/* eslint-disable @typescript-eslint/camelcase */
import { electronEvent } from '../const';
import ffi from 'ffi-napi';
import ref, { Pointer } from 'ref-napi';
import struct from 'ref-struct-napi';
import os from 'os';
import path from 'path';
import fs from 'fs';

type Options = {
  path?: string;
  speaker?: string;
  prefix?: string;
  volume?: number;
};

const VoicevoxInitializeOptions = struct({
  accelerationMode: 'int',
  cpuNumThreads: 'uint16',
  loadAllModels: 'bool',
  openJTalkDictDir: 'string',
});

const VoicevoxAudioQueryOptions = struct({
  kana: 'bool',
});

const VoicevoxSynthesisOptions = struct({
  enable_interrogative_upspeak: 'bool',
});

const VoicevoxTtsOptions = struct({
  kana: 'bool',
  enable_interrogative_upspeak: 'bool',
});

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
        const kernel32 = ffi.Library('kernel32.dll', {
          SetDllDirectoryW: ['bool', ['uint16*']],
        });
        kernel32.SetDllDirectoryW(Buffer.from(voicevox_path + '\0', 'utf16le') as Pointer<number>);
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
      this.voicevox_core = ffi.Library('voicevox_core', {
        voicevox_initialize: ['int', [VoicevoxInitializeOptions]],
        voicevox_get_metas_json: ['string', []],
        voicevox_audio_query: ['int', ['string', 'uint32', VoicevoxAudioQueryOptions, 'char**']],
        voicevox_audio_query_json_free: ['void', ['char*']],
        voicevox_synthesis: ['int', ['string', 'uint32', VoicevoxSynthesisOptions, ref.sizeof.pointer == 8 ? 'uint64*' : 'uint32*', 'uint8**']],
        voicevox_tts: ['int', ['string', 'uint32', VoicevoxTtsOptions, ref.sizeof.pointer == 8 ? 'uint64*' : 'uint32*', 'uint8**']],
        voicevox_wav_free: ['void', ['uint8*']],
        voicevox_is_model_loaded: ['bool', ['uint32']],
        voicevox_load_model: ['int', ['uint32']],
      });
      const opts = new VoicevoxInitializeOptions();
      opts.accelerationMode = 0; // 利用モードは自動(GPUが使えれば使う)
      opts.cpuNumThreads = 0;
      opts.loadAllModels = false;
      // 辞書ファイルの場所は今のところ固定(VOICEVOXインストール先/pyopenjtalk/open_jtalk_dic_utf_8-1.11)
      opts.openJTalkDictDir = path.join(voicevox_path, 'pyopenjtalk', 'open_jtalk_dic_utf_8-1.11');
      if (this.voicevox_core.voicevox_initialize(opts) == 0) {
        const metas: VoiceVoxSpeaker[] = JSON.parse(this.voicevox_core.voicevox_get_metas_json()!);
        this.speakers = metas;
        this.available = true;
        this.path = voicevox_path;
      } else {
        this.speakers = [];
        this.available = false;
        this.path = options?.path;
      }
    } catch {
      this.available = false;
      this.voicevox_core = null;
      this.speakers = [];
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
  public available: boolean;
  /**
   * 読み込んだ VOICEVOX で利用できる話者のリスト。
   */
  public speakers: VoiceVoxSpeaker[];
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

  private voicevox_core: any;

  /**
   * 読み上げを開始します。
   * @param message VOICEVOX に読み上げてもらう文章
   */
  async speak(message: string) {
    /** 読み前に文字列を処理する */
    const concatMessage = this.prefix.concat(message);

    const speakerAndStyle = this.speaker.split('\\');
    const speaker = this.speakers.find((speaker) => speaker.name === speakerAndStyle[0]) || this.speakers[0];
    if (!speaker) {
      return false;
    }
    const style = speaker.styles.find((style) => style.name === speakerAndStyle[1]) || speaker.styles[0];
    if (!style) {
      return false;
    }
    if (!this.voicevox_core.voicevox_is_model_loaded(style.id)) {
      this.voicevox_core.voicevox_load_model(style.id);
    }
    const query_option = VoicevoxAudioQueryOptions();
    query_option.kana = false;
    const audio_query = ref.alloc('char*');
    if (this.voicevox_core.voicevox_audio_query(concatMessage, style.id, query_option, audio_query) == 0) {
      let audio_query_json = (audio_query.deref() as any).readCString();
      this.voicevox_core.voicevox_audio_query_json_free(audio_query.deref());
      const audio_query_obj = JSON.parse(audio_query_json);
      audio_query_obj.speed_scale = this.speed;
      audio_query_obj.pitch_scale = this.pitch;
      audio_query_obj.intonation_scale = this.intonation;
      audio_query_json = JSON.stringify(audio_query_obj);
      const opts = VoicevoxSynthesisOptions();
      opts.enable_interrogative_upspeak = true;
      const len = ref.alloc(ref.sizeof.pointer == 8 ? 'uint64' : 'uint32');
      const wav = ref.alloc('uint8*');
      const result = this.voicevox_core.voicevox_synthesis(audio_query_json, style.id, opts, len, wav);
      if (result == 0) {
        const buf = new Uint8Array(len.readUInt32LE());
        wav.readPointer(0, len.readUInt32LE()).copy(buf);
        this.voicevox_core.voicevox_wav_free(wav.deref());
        // VOICEVOX は WAV のデータを出力してくるので実際の再生は renderer プロセスにお願いする。
        globalThis.electron.mainWindow.webContents.send(electronEvent.SPEAK_WAV, { wavblob: buf, volume: this.volume, deviceId: undefined });
      }
    }

    return true;
  }

  /**
   * 読み上げを中断します。
   */
  abort() {
    globalThis.electron.mainWindow.webContents.send(electronEvent.ABORT_WAV);
  }
}

export default VoiceVoxClient;
