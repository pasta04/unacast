/**
 * クリップボードの読み書きを main プロセスで行う IPC ハンドラ。
 * Electron 44 以降、renderer プロセスから clipboard モジュールを使えなくなったため、renderer はこれを経由する。
 * navigator.clipboard と違い、ネイティブの右クリックメニューを閉じた直後などウィンドウにフォーカスが無くても動く。
 */
import { clipboard, ipcMain } from 'electron';
import { electronEvent } from './const';

export const registerClipboardHandlers = () => {
  ipcMain.handle(electronEvent.CLIPBOARD_WRITE_TEXT, async (_event, text: string) => {
    await clipboard.writeText(String(text));
  });
  ipcMain.handle(electronEvent.CLIPBOARD_READ_TEXT, async () => {
    return await clipboard.readText();
  });
};
