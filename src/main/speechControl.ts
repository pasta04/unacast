/**
 * 読み上げの状態と中断 (#77)。
 *
 * 1件のレスの「読み上げ + 表示を維持する待ち (SpeechCast 風の表示秒数)」を 1 つのセッションとして扱い、
 * - セッション中かどうか (= 読み上げ中ステータス) を全ウィンドウへ通知する
 * - 中断の合図を受け付け、読み子を止める処理を呼んだうえでセッションの待ちを打ち切る
 *
 * 中断ボタンの置き場所 (設定画面の上部・独立したウィンドウなど) に依存しないよう、
 * 状態の通知は全ウィンドウへ送り、中断は IPC 1 つで受け付ける。読み子ごとの止め方は
 * setSpeechStopHandler で登録された処理に任せる (startServer.ts)。
 */
import { BrowserWindow, ipcMain } from 'electron';
import electronlog from 'electron-log';
import { electronEvent } from './const';
const log = electronlog.scope('speechControl');

export type SpeechState = {
  /** 読み上げ中 (読み上げ + 表示を維持する待ちの間)。中断できる */
  active: boolean;
};

export type SpeechSession = {
  /** 中断されたら abort される。待ちの打ち切りに使う */
  signal: AbortSignal;
  /** セッションを終える (finally で必ず呼ぶ) */
  end: () => void;
};

let current: AbortController | null = null;
let stopHandler: () => void = () => {};

const broadcast = () => {
  const state: SpeechState = { active: current !== null };
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send(electronEvent.SPEECH_STATE_UPDATED, state);
  }
};

/** 読み子の発話を止める処理を登録する */
export const setSpeechStopHandler = (handler: () => void) => {
  stopHandler = handler;
};

/** 読み上げのセッションを始める。前のセッションが残っていれば置き換える */
export const beginSpeechSession = (): SpeechSession => {
  const controller = new AbortController();
  current = controller;
  broadcast();
  return {
    signal: controller.signal,
    end: () => {
      // 後から始まったセッションを終わらせない
      if (current !== controller) return;
      current = null;
      broadcast();
    },
  };
};

/** 読み上げを中断する。セッション中でなければ何もしない */
export const stopSpeech = () => {
  if (!current) return;
  log.info('[stopSpeech] 読み上げを中断');
  try {
    stopHandler();
  } catch (e) {
    log.error(e);
  }
  current.abort();
};

/** 中断されるまで ms だけ待つ (中断されたらすぐ戻る) */
export const sleepUnlessStopped = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    if (signal.aborted || ms <= 0) {
      resolve();
      return;
    }
    const timer = setTimeout(done, ms);
    function done() {
      clearTimeout(timer);
      signal.removeEventListener('abort', done);
      resolve();
    }
    signal.addEventListener('abort', done);
  });

export const registerSpeechControlHandlers = () => {
  ipcMain.handle(electronEvent.GET_SPEECH_STATE, (): SpeechState => ({ active: current !== null }));
  ipcMain.on(electronEvent.STOP_SPEECH, () => stopSpeech());
};
