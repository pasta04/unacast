import { electronEvent } from '../const';
import koffi, { IKoffiLib } from 'koffi';
import os from 'os';
import path from 'path';
import fs from 'fs';

type Options = {
  path?: string;
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

interface IVoiceVoxCore {
  /**
   * 利用可能かどうか
   */
  available: boolean;
  /**
   * 読み込んだ VOICEVOX で利用できる話者のリスト。
   */
  speakers: VoiceVoxSpeaker[];

  speak(opts: Options, message: string): Promise<Uint8Array | null>;
}

class UnavailableVoiceVoxCore implements IVoiceVoxCore {
  public available: boolean = false;
  public speakers: VoiceVoxSpeaker[] = [];
  async speak(opts: Options, message: string) {
    return null;
  }
}

class VoiceVoxCore_0_15 implements IVoiceVoxCore {
  constructor(libpath: string, lib: IKoffiLib) {
    const VoicevoxInitializeOptions = koffi.struct('VoicevoxInitializeOptions', {
      accelerationMode: 'int',
      cpuNumThreads: 'uint16',
      loadAllModels: 'bool',
      openJTalkDictDir: 'string',
    });

    const VoicevoxAudioQueryOptions = koffi.struct('VoicevoxAudioQueryOptions', {
      kana: 'bool',
    });

    const VoicevoxSynthesisOptions = koffi.struct('VoicevoxSynthesisOptions', {
      enable_interrogative_upspeak: 'bool',
    });

    const VoicevoxTtsOptions = koffi.struct('VoicevoxTtsOptions', {
      kana: 'bool',
      enable_interrogative_upspeak: 'bool',
    });

    try {
      const voicevox_audio_query_json_free = lib.func('voicevox_audio_query_json_free', 'void', ['void*']);
      const audio_query_json_type = koffi.disposable('audio_query_json_type', 'string', voicevox_audio_query_json_free);
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
  private voicevox_core: any;

  /**
   * 読み上げを開始します。
   * @param opts VOICEVOX に読み上げオプション
   * @param message VOICEVOX に読み上げてもらう文章
   */
  async speak(opts: Options, message: string): Promise<Uint8Array | null> {
    /** 読み前に文字列を処理する */
    const concatMessage = (opts.prefix ?? '').concat(message);

    const speakerAndStyle = (opts.speaker ?? '\\').split('\\');
    const speaker = this.speakers.find((speaker) => speaker.name === speakerAndStyle[0]) || this.speakers[0];
    if (!speaker) {
      return null;
    }
    const style = speaker.styles.find((style) => style.name === speakerAndStyle[1]) || speaker.styles[0];
    if (!style) {
      return null;
    }
    if (!this.voicevox_core.voicevox_is_model_loaded(style.id)) {
      this.voicevox_core.voicevox_load_model(style.id);
    }
    const query_option = this.voicevox_core.voicevox_make_default_audio_query_options();
    const audio_query: [string | null] = [null];
    if (this.voicevox_core.voicevox_audio_query(concatMessage, style.id, query_option, audio_query) == 0) {
      let audio_query_json: string = audio_query[0] ?? '';
      const audio_query_obj = JSON.parse(audio_query_json);
      audio_query_obj.speed_scale = opts.speed ?? 1.0;
      audio_query_obj.pitch_scale = opts.pitch ?? 0.0;
      audio_query_obj.intonation_scale = opts.intonation ?? 1.0;
      audio_query_json = JSON.stringify(audio_query_obj);
      const synthesis_opts = {
        enable_interrogative_upspeak: true,
      };
      const len = [0];
      const wav = [null];
      const result = this.voicevox_core.voicevox_synthesis(audio_query_json, style.id, synthesis_opts, len, wav);
      if (result == 0) {
        const buf: Uint8Array = koffi.decode(wav[0], 'uint8', len[0]);
        this.voicevox_core.voicevox_wav_free(wav[0]);
        return buf;
      }
    }
    return null;
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
        // VOICEVOX Core の 0.16 以降(VOICEVOXの0.16以降ではない)は API が変わっている。
        // 未対応
        this.voicevox_core = new UnavailableVoiceVoxCore();
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
    this.speaker = options?.speaker ?? '';
    this.volume = options?.volume ?? 50;
    this.prefix = options?.prefix ?? '';
  }

  /**
   * VOICEVOX のインストール先のパス。
   * 空文字列または undefined の場合は自動検索する。
   */
  public path: string | undefined;
  /**
   * VOICEVOX が使えるかどうか。
   * 読み込めたら true になる。
   */
  public get available(): boolean {
    return this.voicevox_core.available;
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
   * 読み上げを開始します。
   * @param message VOICEVOX に読み上げてもらう文章
   */
  async speak(message: string) {
    const opts = {
      speaker: this.speaker,
      prefix: this.prefix,
      volume: this.volume,
      speed: this.speed,
      pitch: this.pitch,
      intonation: this.intonation,
    };
    const buf = await this.voicevox_core.speak(opts, message);
    if (buf !== null) {
      // VOICEVOX は WAV のデータを出力してくるので実際の再生は renderer プロセスにお願いする。
      globalThis.electron.mainWindow.webContents.send(electronEvent.SPEAK_WAV, { wavblob: buf, volume: this.volume, deviceId: undefined });
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
