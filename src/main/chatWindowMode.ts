/**
 * チャットウィンドウの表示モード (最前面・枠なし/背景透過・クリック透過)。
 *
 * ゲーム画面などの上に重ねてコメントを見る用途向け。設定画面とチャットウィンドウの右クリックメニューから
 * 切り替える。モードの正は main が持ち、変わったら両方のウィンドウへ通知する。
 *
 * - 最前面・枠なし/背景透過はウィンドウ設定 (electron-store) に保存し、次回起動時も引き継ぐ
 * - クリック透過は保存しない (有効中はチャットウィンドウを操作できないため、起動時は常に解除しておく)
 * - 枠なし/背景透過 (frame / transparent) はウィンドウ作成時にしか指定できないため、切り替え時は作り直す。
 *   Windows では transparent は枠なしでないと効かないので、両者はセットで切り替える
 */
import { BrowserWindow, BrowserWindowConstructorOptions, ipcMain } from 'electron';
import electronlog from 'electron-log';
import { electronEvent } from './const';
const log = electronlog.scope('chatWindowMode');

export type ChatWindowMode = {
  /** 最前面に表示 */
  alwaysOnTop: boolean;
  /** 枠なし・背景透過 */
  frameless: boolean;
  /** クリック透過 (マウス操作を後ろのウィンドウへ通す) */
  clickThrough: boolean;
};

/** electron-store に保存する部分 (クリック透過は保存しない) */
export type StoredChatWindowMode = Pick<ChatWindowMode, 'alwaysOnTop' | 'frameless'>;

type ModeStore = {
  get: (key: 'chatWindowMode') => Partial<StoredChatWindowMode> | undefined;
  set: (key: 'chatWindowMode', value: StoredChatWindowMode) => void;
};

let mode: ChatWindowMode = { alwaysOnTop: false, frameless: false, clickThrough: false };
let store: ModeStore | null = null;
let recreateChatWindow: () => Promise<void> = async () => {};

/** 保存済みのモードを読み込む。チャットウィンドウを作る前に呼ぶ */
export const loadChatWindowMode = (modeStore: ModeStore) => {
  store = modeStore;
  const saved = modeStore.get('chatWindowMode') ?? {};
  mode = { alwaysOnTop: saved.alwaysOnTop === true, frameless: saved.frameless === true, clickThrough: false };
};

export const getChatWindowMode = (): ChatWindowMode => ({ ...mode });

/** ウィンドウ作成時にしか指定できないオプション */
export const chatWindowCreateOptions = (): Pick<BrowserWindowConstructorOptions, 'frame' | 'transparent' | 'backgroundColor'> =>
  mode.frameless
    ? { frame: false, transparent: true, backgroundColor: '#00000000' }
    : // CSS 適用前の下地色。style-window.css の既定背景と合わせて白フラッシュを防ぐ
      { frame: true, transparent: false, backgroundColor: '#1e1e1e' };

/** 作成後に切り替えられるモードをウィンドウへ反映する */
export const applyChatWindowRuntimeMode = (win: BrowserWindow) => {
  win.setAlwaysOnTop(mode.alwaysOnTop);
  win.setIgnoreMouseEvents(mode.clickThrough);
};

const notify = () => {
  for (const win of [globalThis.electron?.mainWindow, globalThis.electron?.chatWindow]) {
    if (win && !win.isDestroyed()) win.webContents.send(electronEvent.CHAT_WINDOW_MODE_UPDATED, getChatWindowMode());
  }
};

/**
 * IPC ハンドラを登録する。
 * @param recreate 枠なし/背景透過の切り替え時にチャットウィンドウを作り直す関数
 */
export const registerChatWindowModeHandlers = (recreate: () => Promise<void>) => {
  recreateChatWindow = recreate;
  ipcMain.handle(electronEvent.GET_CHAT_WINDOW_MODE, () => getChatWindowMode());
  ipcMain.handle(electronEvent.SET_CHAT_WINDOW_MODE, async (_event, patch: Partial<ChatWindowMode>) => {
    const prev = mode;
    mode = {
      alwaysOnTop: typeof patch?.alwaysOnTop === 'boolean' ? patch.alwaysOnTop : prev.alwaysOnTop,
      frameless: typeof patch?.frameless === 'boolean' ? patch.frameless : prev.frameless,
      clickThrough: typeof patch?.clickThrough === 'boolean' ? patch.clickThrough : prev.clickThrough,
    };
    log.info(`[set] ${JSON.stringify(mode)}`);
    store?.set('chatWindowMode', { alwaysOnTop: mode.alwaysOnTop, frameless: mode.frameless });

    if (mode.frameless !== prev.frameless) {
      // 作り直したウィンドウには作成時に全モードが反映される
      await recreateChatWindow();
    } else {
      const win = globalThis.electron?.chatWindow;
      if (win && !win.isDestroyed()) applyChatWindowRuntimeMode(win);
    }
    notify();
    return getChatWindowMode();
  });
};
