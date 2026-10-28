/**
 * 読み上げの状態の取得と中断 (#77) の renderer 側。
 *
 * どのウィンドウからでも使えるよう、設定画面の store には依存しない
 * (将来、中断ボタンを独立したウィンドウに出す場合もこれを使う)。main 側は src/main/speechControl.ts。
 */
import electron from 'electron';
import { electronEvent } from '../main/const';
import type { SpeechState } from '../main/speechControl';

const ipcRenderer = electron.ipcRenderer;

/** 今の読み上げの状態を取得する */
export const getSpeechState = (): Promise<SpeechState> => ipcRenderer.invoke(electronEvent.GET_SPEECH_STATE);

/** 読み上げの状態の変化を購読する。戻り値で購読を解除する */
export const subscribeSpeechState = (listener: (state: SpeechState) => void) => {
  const handler = (_event: unknown, state: SpeechState) => listener(state);
  ipcRenderer.on(electronEvent.SPEECH_STATE_UPDATED, handler);
  return () => {
    ipcRenderer.removeListener(electronEvent.SPEECH_STATE_UPDATED, handler);
  };
};

/** 読み上げを中断する (読み上げ中でなければ何もしない) */
export const requestStopSpeech = () => {
  ipcRenderer.send(electronEvent.STOP_SPEECH);
};
