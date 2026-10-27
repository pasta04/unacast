import electron from 'electron';
import { electronEvent } from '../main/const';

// Electron 44 以降 renderer から clipboard を直接使えないため、main プロセス経由で読み書きする
export const writeClipboardText = (text: string): Promise<void> => electron.ipcRenderer.invoke(electronEvent.CLIPBOARD_WRITE_TEXT, text);
export const readClipboardText = (): Promise<string> => electron.ipcRenderer.invoke(electronEvent.CLIPBOARD_READ_TEXT);
