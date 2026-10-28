/**
 * チャットウィンドウのユーザー CSS (設定画面の「チャットウィンドウのスタイル」) を中継する IPC ハンドラ。
 *
 * 設定は設定画面 (renderer) の localStorage に保存されるため、main は最後に受け取った CSS を覚えておき、
 * - 設定画面から適用されたら、チャットウィンドウへ送って即時反映する
 * - チャットウィンドウの読み込み時 (起動時・再読み込み時) は、覚えている CSS を返す
 * 設定画面は起動時にも保存済みの CSS を送ってくるので、サーバー起動前でも反映される。
 */
import { ipcMain } from 'electron';
import { electronEvent } from './const';

let chatWindowCss = '';

export const registerChatWindowCssHandlers = () => {
  ipcMain.on(electronEvent.APPLY_CHAT_WINDOW_CSS, (_event, css: string) => {
    chatWindowCss = String(css ?? '');
    // サーバー起動中は main 側の config も合わせる。古い値のままだと、自動スレ移動などで
    // main から設定画面へ config を送り返した時に、適用済みの CSS が古い値に戻ってしまう
    if (globalThis.config) globalThis.config.chatWindowCss = chatWindowCss;
    globalThis.electron?.chatWindow?.webContents.send(electronEvent.APPLY_CHAT_WINDOW_CSS, chatWindowCss);
  });
  ipcMain.handle(electronEvent.GET_CHAT_WINDOW_CSS, () => chatWindowCss);
};
