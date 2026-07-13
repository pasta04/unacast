import { electronEvent } from '../const';
import koffi, { IKoffiLib } from 'koffi';
import axios from 'axios';
import os from 'os';
import path from 'path';
import fs from 'fs';
import log from 'electron-log';

type Options = {
  path?: string;
  /** エンジン HTTP API の URL。空の場合は既定 (http://127.0.0.1:50021) */
  engineUrl?: string;
  speaker?: string;
  prefix?: string;
  volume?: number;
  speed?: number;
  pitch?: number;
  intonation?: number;
};

type VoiceVoxStyle = {
  id: number;
  name: string;
};

type VoiceVoxSpeaker = {
  name: string;
  speaker_uuid: string;
  styles: VoiceVoxStyle[];
  version: string;
};

/** 接続方式。UI 表示用 */
export type VoiceVoxMode = 'none' | 'dll-0.15' | 'dll-0.16' | 'http';

interface IVoiceVoxCore {
  /**
   * 利用可能かどうか
   */
  available: boolean;
  /**
   * 読み込んだ VOICEVOX で利用できる話者のリスト。
   */
  speakers: VoiceVoxSpeaker[];
  /**
   * 接続方式
   */
  mode: VoiceVoxMode;

  speak(opts: Options, message: string): Promise<Uint8Array | null>;
}

class UnavailableVoiceVoxCore implements IVoiceVoxCore {
  public available: boolean = false;
  public speakers: VoiceVoxSpeaker[] = [];
  public mode: VoiceVoxMode = 'none';
  async speak(_opts: Options, _message: string) {
    return null;
  }
}

/** 話者設定文字列 (「話者名\スタイル名」) からスタイル ID を解決する。見つからなければ先頭の話者・スタイルに寄せる */
const resolveStyleId = (speakers: VoiceVoxSpeaker[], speakerAndStyle: string | undefined): number | null => {
  const [speakerName, styleName] = (speakerAndStyle ?? '\\').split('\\');
  const speaker = speakers.find((s) => s.name === speakerName) || speakers[0];
  if (!speaker) return null;
  const style = speaker.styles.find((s) => s.name === styleName) || speaker.styles[0];
  if (!style) return null;
  return style.id;
};

/**
 * koffi の名前付き型はプロセス内で一意である必要があり、二重登録は例外になる。
 * VoiceVoxClient は再読み込みで複数回構築されるため、struct 定義は一度だけ行う。
 */
let structs015: { VoicevoxInitializeOptions: any; VoicevoxAudioQueryOptions: any; VoicevoxSynthesisOptions: any } | null = null;
const getStructs015 = () => {
  if (!structs015) {
    structs015 = {
      VoicevoxInitializeOptions: koffi.struct('VoicevoxInitializeOptions', {
        accelerationMode: 'int',
        cpuNumThreads: 'uint16',
        loadAllModels: 'bool',
        openJTalkDictDir: 'string',
      }),
      VoicevoxAudioQueryOptions: koffi.struct('VoicevoxAudioQueryOptions', {
        kana: 'bool',
      }),
      VoicevoxSynthesisOptions: koffi.struct('VoicevoxSynthesisOptions', {
        enable_interrogative_upspeak: 'bool',
      }),
    };
    // koffi 側にスキーマだけ登録しておく（現状コードからは未使用）
    koffi.struct('VoicevoxTtsOptions', {
      kana: 'bool',
      enable_interrogative_upspeak: 'bool',
    });
  }
  return structs015;
};

/** 0.15 用: 解放関数付き JSON 文字列型 (これも名前付きなので一度だけ登録する) */
let audioQueryJsonType015: any = null;

class VoiceVoxCore_0_15 implements IVoiceVoxCore {
  constructor(libpath: string, lib: IKoffiLib) {
    const { VoicevoxInitializeOptions, VoicevoxAudioQueryOptions, VoicevoxSynthesisOptions } = getStructs015();

    try {
      if (!audioQueryJsonType015) {
        const voicevox_audio_query_json_free = lib.func('voicevox_audio_query_json_free', 'void', ['void*']);
        audioQueryJsonType015 = koffi.disposable('audio_query_json_type', 'string', voicevox_audio_query_json_free);
      }
      const audio_query_json_type = audioQueryJsonType015;
      this.voicevox_core = {
        voicevox_initialize: lib.func('voicevox_initialize', 'int', [VoicevoxInitializeOptions]),
        voicevox_get_metas_json: lib.func('voicevox_get_metas_json', 'string', []),
        voicevox_make_default_audio_query_options: lib.func('voicevox_make_default_audio_query_options', VoicevoxAudioQueryOptions, []),
        voicevox_audio_query: lib.func('voicevox_audio_query', 'int', ['string', 'uint32', VoicevoxAudioQueryOptions, koffi.out(koffi.pointer(audio_query_json_type))]),
        voicevox_synthesis: lib.func('voicevox_synthesis', 'int', ['string', 'uint32', VoicevoxSynthesisOptions, koffi.out('uintptr_t*'), koffi.out('uint8**')]),
        voicevox_wav_free: lib.func('voicevox_wav_free', 'void', ['uint8*']),
        voicevox_is_model_loaded: lib.func('voicevox_is_model_loaded', 'bool', ['uint32']),
        voicevox_load_model: lib.func('voicevox_load_model', 'int', ['uint32']),
      };
      const opts = {
        accelerationMode: 0, // 利用モードは自動(GPUが使えれば使う)
        cpuNumThreads: 0,
        loadAllModels: false,
        // 辞書ファイルの場所は今のところ固定(VOICEVOXインストール先/pyopenjtalk/open_jtalk_dic_utf_8-1.11)
        openJTalkDictDir: path.join(libpath, 'pyopenjtalk', 'open_jtalk_dic_utf_8-1.11'),
      };
      if (this.voicevox_core.voicevox_initialize(opts) == 0) {
        const metas: VoiceVoxSpeaker[] = JSON.parse(this.voicevox_core.voicevox_get_metas_json()!);
        this.speakers = metas;
        this.available = true;
      } else {
        this.speakers = [];
        this.available = false;
      }
    } catch {
      this.available = false;
      this.voicevox_core = null;
      this.speakers = [];
    }
  }

  /**
   * VOICEVOX が使えるかどうか。
   * 読み込めたら true になる。
   */
  public available: boolean;
  /**
   * 読み込んだ VOICEVOX で利用できる話者のリスト。
   */
  public speakers: VoiceVoxSpeaker[];
  public mode: VoiceVoxMode = 'dll-0.15';
  private voicevox_core: any;

  /**
   * 音声を合成します。
   * @param opts VOICEVOX に読み上げオプション
   * @param message VOICEVOX に読み上げてもらう文章
   */
  async speak(opts: Options, message: string): Promise<Uint8Array | null> {
    /** 読み前に文字列を処理する */
    const concatMessage = (opts.prefix ?? '').concat(message);

    const styleId = resolveStyleId(this.speakers, opts.speaker);
    if (styleId === null) {
      return null;
    }
    if (!this.voicevox_core.voicevox_is_model_loaded(styleId)) {
      this.voicevox_core.voicevox_load_model(styleId);
    }
    const query_option = this.voicevox_core.voicevox_make_default_audio_query_options();
    const audio_query: [string | null] = [null];
    if (this.voicevox_core.voicevox_audio_query(concatMessage, styleId, query_option, audio_query) == 0) {
      let audio_query_json: string = audio_query[0] ?? '';
      const audio_query_obj = JSON.parse(audio_query_json);
      // core 0.15 の AudioQuery は snake_case
      audio_query_obj.speed_scale = opts.speed ?? 1.0;
      audio_query_obj.pitch_scale = opts.pitch ?? 0.0;
      audio_query_obj.intonation_scale = opts.intonation ?? 1.0;
      audio_query_json = JSON.stringify(audio_query_obj);
      const synthesis_opts = {
        enable_interrogative_upspeak: true,
      };
      const len = [0];
      const wav = [null];
      const result = this.voicevox_core.voicevox_synthesis(audio_query_json, styleId, synthesis_opts, len, wav);
      if (result == 0) {
        const buf: Uint8Array = koffi.decode(wav[0], 'uint8', len[0]);
        this.voicevox_core.voicevox_wav_free(wav[0]);
        return buf;
      }
    }
    return null;
  }
}

/**
 * voicevox_core 0.16 以降の C API 対応。
 * 0.15 までと違い、onnxruntime・Open JTalk 辞書・音声モデル (.vvm) を明示的に読み込む必要がある。
 * VOICEVOX アプリ同梱のエンジン (vv-engine) には core DLL・onnxruntime DLL・model/*.vvm が含まれる。
 */
/** 0.16 用の struct 定義 (一度だけ登録する) */
let structs016: { VoicevoxLoadOnnxruntimeOptions: any; VoicevoxInitializeOptionsV16: any; VoicevoxSynthesisOptionsV16: any } | null = null;
const getStructs016 = () => {
  if (!structs016) {
    structs016 = {
      VoicevoxLoadOnnxruntimeOptions: koffi.struct('VoicevoxLoadOnnxruntimeOptions', {
        filename: 'string',
      }),
      VoicevoxInitializeOptionsV16: koffi.struct('VoicevoxInitializeOptionsV16', {
        acceleration_mode: 'int32',
        cpu_num_threads: 'uint16',
      }),
      VoicevoxSynthesisOptionsV16: koffi.struct('VoicevoxSynthesisOptionsV16', {
        enable_interrogative_upspeak: 'bool',
      }),
    };
  }
  return structs016;
};

/** 0.16 用: voicevox_json_free で解放する JSON 文字列型 (名前付きなので一度だけ登録する) */
let jsonType016: any = null;

class VoiceVoxCore_0_16 implements IVoiceVoxCore {
  constructor(libpath: string, lib: IKoffiLib) {
    try {
      const { VoicevoxLoadOnnxruntimeOptions, VoicevoxInitializeOptionsV16, VoicevoxSynthesisOptionsV16 } = getStructs016();
      if (!jsonType016) {
        const voicevox_json_free = lib.func('voicevox_json_free', 'void', ['void*']);
        jsonType016 = koffi.disposable('voicevox_json_type', 'string', voicevox_json_free);
      }

      const api = {
        voicevox_make_default_load_onnxruntime_options: lib.func('voicevox_make_default_load_onnxruntime_options', VoicevoxLoadOnnxruntimeOptions, []),
        voicevox_onnxruntime_load_once: lib.func('voicevox_onnxruntime_load_once', 'int', [VoicevoxLoadOnnxruntimeOptions, koffi.out('void**')]),
        voicevox_open_jtalk_rc_new: lib.func('voicevox_open_jtalk_rc_new', 'int', ['string', koffi.out('void**')]),
        voicevox_synthesizer_new: lib.func('voicevox_synthesizer_new', 'int', ['void*', 'void*', VoicevoxInitializeOptionsV16, koffi.out('void**')]),
        voicevox_voice_model_file_open: lib.func('voicevox_voice_model_file_open', 'int', ['string', koffi.out('void**')]),
        voicevox_voice_model_file_create_metas_json: lib.func('voicevox_voice_model_file_create_metas_json', jsonType016, ['void*']),
        voicevox_voice_model_file_delete: lib.func('voicevox_voice_model_file_delete', 'void', ['void*']),
        voicevox_synthesizer_load_voice_model: lib.func('voicevox_synthesizer_load_voice_model', 'int', ['void*', 'void*']),
        voicevox_synthesizer_create_audio_query: lib.func('voicevox_synthesizer_create_audio_query', 'int', ['void*', 'string', 'uint32', koffi.out(koffi.pointer(jsonType016))]),
        voicevox_synthesizer_synthesis: lib.func('voicevox_synthesizer_synthesis', 'int', [
          'void*',
          'string',
          'uint32',
          VoicevoxSynthesisOptionsV16,
          koffi.out('uintptr_t*'),
          koffi.out('uint8**'),
        ]),
        voicevox_wav_free: lib.func('voicevox_wav_free', 'void', ['uint8*']),
      };
      this.api = api;

      // onnxruntime の読み込み (ファイル名は core が返す既定値。SetDllDirectoryW 済みなので DLL と同じディレクトリから解決される)
      const onnxOpts = api.voicevox_make_default_load_onnxruntime_options();
      const onnxruntime = [null];
      const onnxResult = api.voicevox_onnxruntime_load_once(onnxOpts, onnxruntime);
      if (onnxResult !== 0) {
        log.error(`[voicevox] onnxruntime の読み込みに失敗 (code=${onnxResult})`);
        return;
      }

      // Open JTalk 辞書ディレクトリの探索
      const dictDir = this.findOpenJtalkDict(libpath);
      if (!dictDir) {
        log.error(`[voicevox] Open JTalk 辞書が見つかりません (path=${libpath})`);
        return;
      }
      const openJtalk = [null];
      const jtalkResult = api.voicevox_open_jtalk_rc_new(dictDir, openJtalk);
      if (jtalkResult !== 0) {
        log.error(`[voicevox] Open JTalk 辞書の読み込みに失敗 (code=${jtalkResult} dir=${dictDir})`);
        return;
      }

      // シンセサイザの構築
      const synthesizer = [null];
      const synthResult = api.voicevox_synthesizer_new(onnxruntime[0], openJtalk[0], { acceleration_mode: 0, cpu_num_threads: 0 }, synthesizer);
      if (synthResult !== 0) {
        log.error(`[voicevox] synthesizer の構築に失敗 (code=${synthResult})`);
        return;
      }
      this.synthesizer = synthesizer[0];

      // 音声モデル (.vvm) の列挙とメタ情報の収集 (ロード自体は発話時に遅延実行する)
      const modelDir = [path.join(libpath, 'model'), path.join(libpath, 'models')].find((p) => fs.existsSync(p));
      if (!modelDir) {
        log.error(`[voicevox] 音声モデルディレクトリが見つかりません (path=${libpath})`);
        return;
      }
      const vvmFiles = fs
        .readdirSync(modelDir)
        .filter((f) => f.endsWith('.vvm'))
        .map((f) => path.join(modelDir, f));
      const speakers: VoiceVoxSpeaker[] = [];
      for (const vvmPath of vvmFiles) {
        const model = [null];
        if (api.voicevox_voice_model_file_open(vvmPath, model) !== 0) {
          log.warn(`[voicevox] vvm を開けませんでした: ${vvmPath}`);
          continue;
        }
        try {
          const metasJson = api.voicevox_voice_model_file_create_metas_json(model[0]);
          const metas: VoiceVoxSpeaker[] = JSON.parse(metasJson);
          for (const speaker of metas) {
            for (const style of speaker.styles) {
              this.styleIdToVvmPath.set(style.id, vvmPath);
            }
            // 同名話者が複数 vvm に分かれている場合はスタイルをマージする
            const existing = speakers.find((s) => s.speaker_uuid === speaker.speaker_uuid);
            if (existing) {
              existing.styles = existing.styles.concat(speaker.styles.filter((st) => !existing.styles.some((es) => es.id === st.id)));
            } else {
              speakers.push(speaker);
            }
          }
        } catch (e) {
          log.warn(`[voicevox] vvm のメタ情報解析に失敗: ${vvmPath} ${e}`);
        } finally {
          api.voicevox_voice_model_file_delete(model[0]);
        }
      }
      if (speakers.length === 0) {
        log.error(`[voicevox] 利用可能な音声モデルがありません (dir=${modelDir})`);
        return;
      }
      this.speakers = speakers;
      this.available = true;
      log.info(`[voicevox] core 0.16 系で初期化完了 (話者=${speakers.length} モデル=${vvmFiles.length})`);
    } catch (e) {
      log.error(`[voicevox] core 0.16 系の初期化に失敗: ${e}`);
      this.available = false;
      this.speakers = [];
    }
  }

  public available = false;
  public speakers: VoiceVoxSpeaker[] = [];
  public mode: VoiceVoxMode = 'dll-0.16';
  private api: any;
  private synthesizer: any = null;
  /** スタイル ID → vvm ファイルパス */
  private styleIdToVvmPath = new Map<number, string>();
  /** ロード済みの vvm ファイルパス */
  private loadedVvmPaths = new Set<string>();

  /** Open JTalk 辞書ディレクトリを探す */
  private findOpenJtalkDict(libpath: string): string | null {
    // 既知の配置: {engine}/pyopenjtalk/open_jtalk_dic_utf_8-1.11
    const candidates = [path.join(libpath, 'pyopenjtalk'), libpath];
    for (const dir of candidates) {
      if (!fs.existsSync(dir)) continue;
      try {
        const found = fs
          .readdirSync(dir)
          .filter((f) => f.startsWith('open_jtalk_dic_utf_8'))
          .map((f) => path.join(dir, f))
          .find((p) => fs.statSync(p).isDirectory());
        if (found) return found;
      } catch {
        // 読めないディレクトリはスキップ
      }
    }
    return null;
  }

  async speak(opts: Options, message: string): Promise<Uint8Array | null> {
    if (!this.available || !this.synthesizer) return null;
    const concatMessage = (opts.prefix ?? '').concat(message);

    const styleId = resolveStyleId(this.speakers, opts.speaker);
    if (styleId === null) {
      return null;
    }

    // 対象スタイルのモデルを遅延ロード
    const vvmPath = this.styleIdToVvmPath.get(styleId);
    if (vvmPath && !this.loadedVvmPaths.has(vvmPath)) {
      const model = [null];
      if (this.api.voicevox_voice_model_file_open(vvmPath, model) !== 0) {
        log.error(`[voicevox] vvm を開けませんでした: ${vvmPath}`);
        return null;
      }
      const loadResult = this.api.voicevox_synthesizer_load_voice_model(this.synthesizer, model[0]);
      this.api.voicevox_voice_model_file_delete(model[0]);
      if (loadResult !== 0) {
        log.error(`[voicevox] 音声モデルのロードに失敗 (code=${loadResult} vvm=${vvmPath})`);
        return null;
      }
      this.loadedVvmPaths.add(vvmPath);
    }

    const audioQueryOut = [null as string | null];
    const queryResult = this.api.voicevox_synthesizer_create_audio_query(this.synthesizer, concatMessage, styleId, audioQueryOut);
    if (queryResult !== 0) {
      log.error(`[voicevox] audio query の生成に失敗 (code=${queryResult})`);
      return null;
    }
    const audio_query_obj = JSON.parse(audioQueryOut[0] ?? '{}');
    // core 0.16 の AudioQuery は camelCase (エンジン HTTP API と同じ形式)
    audio_query_obj.speedScale = opts.speed ?? 1.0;
    audio_query_obj.pitchScale = opts.pitch ?? 0.0;
    audio_query_obj.intonationScale = opts.intonation ?? 1.0;

    const len = [0];
    const wav = [null];
    const result = this.api.voicevox_synthesizer_synthesis(this.synthesizer, JSON.stringify(audio_query_obj), styleId, { enable_interrogative_upspeak: true }, len, wav);
    if (result !== 0) {
      log.error(`[voicevox] 音声合成に失敗 (code=${result})`);
      return null;
    }
    const buf: Uint8Array = koffi.decode(wav[0], 'uint8', len[0]);
    this.api.voicevox_wav_free(wav[0]);
    return buf;
  }
}

/** エンジン HTTP API の既定 URL (VOICEVOX アプリ起動中にエンジンが待ち受けるポート) */
export const DEFAULT_VOICEVOX_ENGINE_URL = 'http://127.0.0.1:50021';

/**
 * VOICEVOX エンジンの HTTP API (既定 http://127.0.0.1:50021) を使う実装。
 * DLL のバージョンに依存せず全バージョンで利用でき、AivisSpeech 等の互換エンジンも
 * URL 設定で利用できる。VOICEVOX アプリ (エンジン) が起動している必要がある。
 * 合成が HTTP 越しの非同期になるため、main プロセスをブロックしない利点もある。
 */
class VoiceVoxEngineApi implements IVoiceVoxCore {
  constructor(engineUrl: string | undefined) {
    this.baseUrl = (engineUrl || DEFAULT_VOICEVOX_ENGINE_URL).replace(/\/+$/, '');
  }

  public available = false;
  public speakers: VoiceVoxSpeaker[] = [];
  public mode: VoiceVoxMode = 'http';
  private baseUrl: string;

  /** エンジンへの疎通確認と話者一覧の取得。成功したら available になる */
  async init(): Promise<void> {
    try {
      const version = await axios.get<string>(`${this.baseUrl}/version`, { timeout: 3000, proxy: false });
      const speakers = await axios.get<VoiceVoxSpeaker[]>(`${this.baseUrl}/speakers`, { timeout: 5000, proxy: false });
      this.speakers = speakers.data;
      this.available = this.speakers.length > 0;
      log.info(`[voicevox] エンジン HTTP API に接続 (${this.baseUrl} version=${version.data} 話者=${this.speakers.length})`);
    } catch (e) {
      log.info(`[voicevox] エンジン HTTP API に接続できません (${this.baseUrl}): ${e}`);
      this.available = false;
      this.speakers = [];
    }
  }

  async speak(opts: Options, message: string): Promise<Uint8Array | null> {
    if (!this.available) return null;
    const concatMessage = (opts.prefix ?? '').concat(message);
    const styleId = resolveStyleId(this.speakers, opts.speaker);
    if (styleId === null) {
      return null;
    }
    try {
      const query = await axios.post(`${this.baseUrl}/audio_query`, null, {
        params: { text: concatMessage, speaker: styleId },
        timeout: 30 * 1000,
        proxy: false,
      });
      const audioQuery = query.data;
      // エンジン HTTP API の AudioQuery は camelCase
      audioQuery.speedScale = opts.speed ?? 1.0;
      audioQuery.pitchScale = opts.pitch ?? 0.0;
      audioQuery.intonationScale = opts.intonation ?? 1.0;
      const synthesis = await axios.post<ArrayBuffer>(`${this.baseUrl}/synthesis`, audioQuery, {
        params: { speaker: styleId, enable_interrogative_upspeak: true },
        responseType: 'arraybuffer',
        timeout: 60 * 1000,
        proxy: false,
      });
      return new Uint8Array(synthesis.data);
    } catch (e) {
      log.error(`[voicevox] エンジン HTTP API での合成に失敗: ${e}`);
      return null;
    }
  }
}

class VoiceVoxClient {
  constructor(options?: Options) {
    let voicevox_path = options?.path || '';
    if (os.platform() == 'win32') {
      // パスが設定されていれば指定したパスから VOICEVOX を読み込む。
      // 設定されていない(空の場合)は VOICEVOX の既定のインストール先を検索する。
      // Windows の場合は
      // * C:/Program Files/VOICEVOX
      // * C:/Users/(ユーザー名)/AppData/Local/Programs/VOICEVOX
      // のいずれか
      const programfilesPath = path.join(process.env['PROGRAMFILES'] || 'C:\\Program Files', 'VOICEVOX');
      const appdataPath = path.join(os.homedir(), 'AppData\\Local\\Programs\\VOICEVOX');

      const search_paths = voicevox_path ? [voicevox_path] : [programfilesPath, appdataPath];

      voicevox_path = search_paths.find((p) => fs.existsSync(path.join(p, 'voicevox_core.dll'))) || '';
      if (!voicevox_path) {
        // ver.0.16.1以降対応
        const tmpDir = search_paths.find((p) => fs.existsSync(path.join(p, 'vv-engine/voicevox_core.dll'))) || '';
        if (tmpDir) voicevox_path = path.join(tmpDir, 'vv-engine');
      }

      if (voicevox_path) {
        const kernel32 = koffi.load('kernel32.dll');
        const SetDllDirectoryW = kernel32.func('__stdcall', 'SetDllDirectoryW', 'int', ['str16']);
        SetDllDirectoryW(voicevox_path);
      }
    } else if (os.platform() == 'darwin') {
      // macOS の場合は
      // * /Applications/VOICEVOX/VOICEVOX.app/Contents/MacOS
      // * $HOME/Applications/VOICEVOX/VOICEVOX.app/Contents/MacOS
      // のいずれか
      const appDir = '/Applications/VOICEVOX/VOICEVOX.app/Contents/MacOS';
      const userAppDir = path.join(os.homedir(), '/Applications/VOICEVOX/VOICEVOX.app/Contents/MacOS');

      const search_paths = voicevox_path ? [voicevox_path] : [appDir, userAppDir];
      voicevox_path = search_paths.find((p) => fs.existsSync(path.join(p, 'libvoicevox_core.dylib'))) || '';
    }

    try {
      const voicevox_core = koffi.load('voicevox_core');
      const voicevox_get_version = voicevox_core.func('string voicevox_get_version()');
      const version = voicevox_get_version()
        .split('.')
        .map((v: string) => parseInt(v, 10));
      const major = version[0];
      const minor = version[1];
      if (major === 0 && minor <= 15) {
        this.voicevox_core = new VoiceVoxCore_0_15(voicevox_path, voicevox_core);
      } else {
        // VOICEVOX Core の 0.16 以降(VOICEVOXの0.16以降ではない)は API が別物
        this.voicevox_core = new VoiceVoxCore_0_16(voicevox_path, voicevox_core);
      }
      if (this.voicevox_core.available) {
        this.path = voicevox_path;
      } else {
        this.path = options?.path;
      }
    } catch {
      this.voicevox_core = new UnavailableVoiceVoxCore();
      this.path = options?.path;
    }
    this.engineUrl = options?.engineUrl ?? '';
    this.speaker = options?.speaker ?? '';
    this.volume = options?.volume ?? 50;
    this.prefix = options?.prefix ?? '';
  }

  /**
   * DLL が読み込めなかった場合にエンジン HTTP API へのフォールバックを試す。
   * VoiceVoxClient を new した後、available を参照する前に await すること。
   */
  async init(): Promise<void> {
    if (this.voicevox_core.available) return;
    const engineApi = new VoiceVoxEngineApi(this.engineUrl);
    await engineApi.init();
    if (engineApi.available) {
      this.voicevox_core = engineApi;
    }
  }

  /**
   * VOICEVOX のインストール先のパス。
   * 空文字列または undefined の場合は自動検索する。
   */
  public path: string | undefined;
  /**
   * エンジン HTTP API の URL。空の場合は既定 (http://127.0.0.1:50021)。
   */
  public engineUrl = '';
  /**
   * VOICEVOX が使えるかどうか。
   * 読み込めたら true になる。
   */
  public get available(): boolean {
    return this.voicevox_core.available;
  }
  /**
   * 接続方式 (dll-0.15 / dll-0.16 / http / none)。
   */
  public get mode(): VoiceVoxMode {
    return this.voicevox_core.mode;
  }
  /**
   * 読み込んだ VOICEVOX で利用できる話者のリスト。
   */
  public get speakers(): VoiceVoxSpeaker[] {
    return this.voicevox_core.speakers;
  }
  /**
   * 読み上げに使用する話者。
   * 話者名とスタイル名を\で接続した文字列を格納する。
   */
  public speaker = '';
  /**
   * 読み上げ音量 default=50 (0 ～ 100)
   */
  public volume = 50;
  /**
   * 読み上げの際先頭に付加する文字列
   */
  public prefix = '';
  /**
   * 速度倍率 default=1.0 (0.5 ～ 2.0)
   */
  public speed = 1.0;
  /**
   * 音声ピッチ default=0.0 (-0.15 ～ 0.15)
   */
  public pitch = 0.0;
  /**
   * 抑揚倍率 default=1.0 (0.0 ～ 2.0)
   */
  public intonation = 1.0;

  private voicevox_core: IVoiceVoxCore;

  /**
   * 音声を合成して WAV データを返します (再生はしない)。
   * @param message VOICEVOX に読み上げてもらう文章
   * @param applyPrefix プレフィックスを付けるか (分割読み上げでは先頭チャンクのみ true)
   */
  async synthesize(message: string, applyPrefix = true): Promise<Uint8Array | null> {
    const opts = {
      speaker: this.speaker,
      prefix: applyPrefix ? this.prefix : '',
      volume: this.volume,
      speed: this.speed,
      pitch: this.pitch,
      intonation: this.intonation,
    };
    return await this.voicevox_core.speak(opts, message);
  }

  /**
   * 合成済みの WAV データを renderer プロセスに送って再生させます。
   */
  playWav(buf: Uint8Array) {
    globalThis.electron.mainWindow.webContents.send(electronEvent.SPEAK_WAV, { wavblob: buf, volume: this.volume, deviceId: undefined });
  }

  /**
   * 読み上げを開始します。
   * @param message VOICEVOX に読み上げてもらう文章
   */
  async speak(message: string) {
    const buf = await this.synthesize(message);
    if (buf !== null) {
      this.playWav(buf);
      return true;
    } else {
      return false;
    }
  }

  /**
   * 読み上げを中断します。
   */
  abort() {
    globalThis.electron.mainWindow.webContents.send(electronEvent.ABORT_WAV);
  }
}

export default VoiceVoxClient;
