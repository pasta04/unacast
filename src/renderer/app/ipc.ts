import electron from 'electron';
import electronlog from 'electron-log/renderer';
import { electronEvent } from '../../main/const';
import { sleep } from '../../main/util';
import { useAppStore } from './store';
import type { AppConfig } from './config';

const log = electronlog.scope('renderer-react');

const ipcRenderer = electron.ipcRenderer;

type UpdateStatusPayload = {
  commentType: 'bbs' | 'jpnkn' | 'youtube' | 'twitch' | 'niconico' | 'twitcasting' | 'stt';
  category: string;
  message: string;
};

type VoicevoxConfigPayload = {
  path: string | undefined;
  available: boolean;
  /** 接続方式 (dll-0.15 / dll-0.16 = DLL直接読み込み, http = エンジンAPI) */
  mode: 'none' | 'dll-0.15' | 'dll-0.16' | 'http';
  speakers: { speaker: string; style: string }[];
  speakerAndStyle: string;
};

const voicevoxModeLabel: Record<VoicevoxConfigPayload['mode'], string> = {
  none: '-',
  'dll-0.15': 'DLL直接 (core 0.15)',
  'dll-0.16': 'DLL直接 (core 0.16)',
  http: 'エンジンAPI',
};

let speakWavElement: HTMLAudioElement | null = null;

const playSe = async (arg: { wavfilepath: string; volume: number; deviceId: string }) => {
  const audioElem = new Audio();
  try {
    await (audioElem as any).setSinkId(arg.deviceId);
    audioElem.volume = arg.volume / 100;
    audioElem.src = arg.wavfilepath;
    audioElem.play();
    audioElem.onended = () => ipcRenderer.send(electronEvent.PLAY_SOUND_END);
    audioElem.onerror = () => ipcRenderer.send(electronEvent.PLAY_SOUND_END);
  } catch (e) {
    log.error(e);
    ipcRenderer.send(electronEvent.PLAY_SOUND_END);
  }
};

const speakWav = async (arg: { wavblob: Uint8Array; volume: number; deviceId?: string }) => {
  const audioElem = new Audio();
  speakWavElement = audioElem;
  // TS の DOM lib 更新で BlobPart の ArrayBufferView が ArrayBuffer 限定にジェネリック化され、
  // Uint8Array<ArrayBufferLike> (= SharedArrayBuffer を含み得る) が直接渡せなくなった。
  // ランタイムでは問題ないので BlobPart にキャストする
  const blob = new Blob([arg.wavblob as BlobPart], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  try {
    if (arg.deviceId) {
      await (audioElem as any).setSinkId(arg.deviceId);
    }
    audioElem.volume = arg.volume / 100;
    audioElem.src = url;
    audioElem.play();
    audioElem.onended = () => {
      ipcRenderer.send(electronEvent.SPEAKING_END);
      URL.revokeObjectURL(url);
    };
    audioElem.onerror = () => {
      ipcRenderer.send(electronEvent.SPEAKING_END);
      URL.revokeObjectURL(url);
    };
  } catch (e) {
    log.error(e);
    ipcRenderer.send(electronEvent.SPEAKING_END);
    URL.revokeObjectURL(url);
  }
};

const abortWav = () => {
  if (speakWavElement != null) {
    speakWavElement.pause();
  }
};

const yomikoTime = async (msg: string) => {
  return new Promise<void>((resolve) => {
    const uttr = new globalThis.SpeechSynthesisUtterance(msg);
    uttr.volume = 0;
    uttr.onend = () => resolve();
    speechSynthesis.speak(uttr);
    sleep(10 * 1000).then(() => resolve());
  });
};

/** メインプロセスからの IPC をすべて store に流し込む */
export const registerIpcSubscribers = () => {
  ipcRenderer.on(electronEvent.UPDATE_VOICEVOX_CONFIG, (_event: any, arg: VoicevoxConfigPayload) => {
    const speakers = arg.speakers.map((val) => ({
      value: `${val.speaker}\\${val.style}`,
      label: `${val.speaker} - ${val.style}`,
    }));
    useAppStore.getState().setVoicevoxSpeakers(speakers);
    useAppStore.getState().setStatus('voicevox', arg.available ? `OK [${voicevoxModeLabel[arg.mode] ?? arg.mode}]` : 'VOICEVOXが読み込めません (DLL・エンジンAPIとも接続不可)');
    // 既存値が speaker 一覧に無い場合は config 側を先頭に寄せておく
    const current = useAppStore.getState().config.voicevox.speakerAndStyle;
    if (current && !speakers.some((s) => s.value === current) && speakers.length > 0) {
      useAppStore.getState().setConfig('voicevox', { ...useAppStore.getState().config.voicevox, speakerAndStyle: speakers[0].value });
    }
  });

  ipcRenderer.on(electronEvent.START_SERVER_REPLY, (_event: any, arg: any) => {
    log.debug(arg);
  });

  ipcRenderer.on(electronEvent.PLAY_SOUND_START, (_event: any, arg: { wavfilepath: string; volume: number; deviceId: string }) => {
    playSe(arg);
  });

  ipcRenderer.on(electronEvent.SPEAK_WAV, async (_event: any, arg: { wavblob: Uint8Array; volume: number; deviceId?: string }) => {
    await speakWav(arg);
  });

  ipcRenderer.on(electronEvent.ABORT_WAV, () => {
    abortWav();
  });

  ipcRenderer.on(electronEvent.WAIT_YOMIKO_TIME, async (_event: any, arg: string) => {
    await yomikoTime(arg);
    ipcRenderer.send(electronEvent.SPEAKING_END);
  });

  ipcRenderer.on(electronEvent.SHOW_ALERT, (_event: any, args: string) => {
    useAppStore.getState().openAlert(args);
  });

  ipcRenderer.on(electronEvent.UPDATE_STATUS, (_event: any, args: UpdateStatusPayload) => {
    const { setStatus } = useAppStore.getState();
    switch (args.commentType) {
      case 'bbs':
        if (args.category === 'title') setStatus('bbsTitle', args.message);
        else if (args.category === 'status') setStatus('bbs', args.message);
        break;
      case 'jpnkn':
        if (args.category === 'status') setStatus('jpnknFast', args.message);
        break;
      case 'youtube':
        if (args.category === 'status') setStatus('youtube', args.message);
        else setStatus('youtubeLiveId', args.message);
        break;
      case 'twitch':
        setStatus('twitch', args.message);
        break;
      case 'niconico':
        if (args.category === 'status') setStatus('niconico', args.message);
        break;
      case 'twitcasting':
        if (args.category === 'status') setStatus('twitcasting', args.message);
        break;
      case 'stt':
        if (args.category === 'status') setStatus('stt', args.message);
        break;
    }
  });

  // main プロセス側で config が書き換えられた時の通知 (自動スレ移動・スレッドブラウザによる url 変更)。
  // フォーム編集中の値を消さないよう、未編集のフィールドだけマージする。
  ipcRenderer.on(electronEvent.SAVE_CONFIG, (_event: any, arg: AppConfig) => {
    useAppStore.getState().mergeFromServer(arg);
    useAppStore.getState().persist();
  });

  // スレッドブラウザでのスレ移動 (main 側 config 未初期化時のフォールバック)。
  // url フィールドだけ更新して永続化する。適用ボタンで main へ反映される。
  ipcRenderer.on(electronEvent.THREAD_BROWSER_URL_SELECTED, (_event: any, url: string) => {
    useAppStore.getState().setConfig('url', url);
    useAppStore.getState().persist();
  });

  ipcRenderer.on(electronEvent.PREVIEW_IMAGE, (_event: any, url: string) => {
    (window as any).electron?.imagePreviewWindow?.webContents?.send(electronEvent.PREVIEW_IMAGE, url);
  });
};

export const sendApplyConfig = (config: AppConfig) => {
  ipcRenderer.send(electronEvent.APPLY_CONFIG, config);
};

export const sendStartServer = (config: AppConfig) => {
  return ipcRenderer.sendSync(electronEvent.START_SERVER, config);
};

export const sendStopServer = () => {
  return ipcRenderer.sendSync(electronEvent.STOP_SERVER);
};

export const sendCommentTest = (config: AppConfig) => {
  ipcRenderer.send(electronEvent.COMMENT_TEST, config);
};

export const sendLoadVoicevox = (voicevox: AppConfig['voicevox']) => {
  ipcRenderer.send(electronEvent.LOAD_VOICEVOX, voicevox);
};

export type AutoCreateThreadPreview = {
  ok: boolean;
  error?: string;
  /** 現スレのタイトル */
  currentTitle?: string;
  /** 生成されるタイトル (数字インクリメント後) */
  title?: string;
  name?: string;
  mail?: string;
  body?: string;
};

/** 自動スレ立てのプレビュー (書き込みは行わない)。threadUrl は設定画面で入力中の掲示板URL */
export const invokeAutoCreateThreadPreview = (threadUrl: string): Promise<AutoCreateThreadPreview> => {
  return ipcRenderer.invoke(electronEvent.AUTO_CREATE_THREAD_PREVIEW, threadUrl);
};

/**
 * スレッドブラウザを開く。
 * source には設定画面で入力中の値 (bbs: スレURL / jpnkn: 板ID) を渡す。
 * 適用前でも入力中の掲示板を開けるようにするため。
 */
export const sendOpenThreadBrowser = (mode: 'bbs' | 'jpnkn', source: string) => {
  ipcRenderer.send(electronEvent.OPEN_THREAD_BROWSER, { mode, source });
};
