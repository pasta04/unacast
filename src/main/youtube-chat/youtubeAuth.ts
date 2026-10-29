/**
 * アプリ内での YouTube へのログイン。
 *
 * YouTube にボット確認 (「ログインして bot ではないことを確認してください」) を求められた時の対処として、
 * ログイン済みのユーザーとしてページ解析・コメント取得をできるようにする。
 * ログイン情報 (Cookie) は専用のセッション (partition) に保存し、次回起動時も引き継ぐ。
 * ログアウトするとそのセッションの保存内容を消す。
 */
import { BrowserWindow, ipcMain, session } from 'electron';
import electronlog from 'electron-log';
import { electronEvent } from '../const';
import { buildSapisidHash, YOUTUBE_ORIGIN } from './sapisidHash';
const log = electronlog.scope('youtubeAuth');

const PARTITION = 'persist:youtube';
const LOGIN_URL = `https://accounts.google.com/ServiceLogin?service=youtube&continue=${encodeURIComponent(`${YOUTUBE_ORIGIN}/`)}`;

/**
 * ログイン画面・ログイン後のリクエストで使う User-Agent。
 * Electron を名乗っていると Google にログインを拒否されることがあるため、同じバージョンの Chrome を名乗る
 */
export const youtubeUserAgent = () => `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${process.versions.chrome} Safari/537.36`;

export type YoutubeLoginState = { loggedIn: boolean };

let loginWindow: BrowserWindow | null = null;

const youtubeSession = () => {
  const ses = session.fromPartition(PARTITION);
  ses.setUserAgent(youtubeUserAgent());
  return ses;
};

const pickSapisid = (cookies: Electron.Cookie[]) => (cookies.find((c) => c.name === 'SAPISID') ?? cookies.find((c) => c.name === '__Secure-3PAPISID'))?.value;

export const getLoginState = async (): Promise<YoutubeLoginState> => ({
  loggedIn: !!pickSapisid(await youtubeSession().cookies.get({ url: YOUTUBE_ORIGIN })),
});

/**
 * ログイン中なら、YouTube へのリクエストに付けるヘッダ (Cookie・認証) を返す。ログインしていなければ空
 */
export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  try {
    const cookies = await youtubeSession().cookies.get({ url: YOUTUBE_ORIGIN });
    const sapisid = pickSapisid(cookies);
    if (!sapisid) return {};
    return {
      'user-agent': youtubeUserAgent(),
      Cookie: cookies.map((c) => `${c.name}=${c.value}`).join('; '),
      Authorization: buildSapisidHash(sapisid, Math.floor(Date.now() / 1000)),
      'X-Origin': YOUTUBE_ORIGIN,
      Origin: YOUTUBE_ORIGIN,
      'X-Goog-AuthUser': '0',
    };
  } catch (e) {
    log.warn(e);
    return {};
  }
};

const notify = async () => {
  const state = await getLoginState();
  const win = globalThis.electron?.mainWindow;
  if (win && !win.isDestroyed()) win.webContents.send(electronEvent.YOUTUBE_LOGIN_STATE_UPDATED, state);
};

/** ログイン画面を開く。YouTube に戻ってきてログイン済みになったら閉じる */
const openLoginWindow = () => {
  if (loginWindow && !loginWindow.isDestroyed()) {
    loginWindow.focus();
    return;
  }
  loginWindow = new BrowserWindow({
    width: 500,
    height: 700,
    title: 'YouTube にログイン',
    autoHideMenuBar: true,
    webPreferences: { partition: PARTITION, nodeIntegration: false, contextIsolation: true, sandbox: true },
  });
  const win = loginWindow;
  youtubeSession();
  win.webContents.setUserAgent(youtubeUserAgent());

  const checkDone = async (url: string) => {
    if (!url.startsWith(YOUTUBE_ORIGIN)) return;
    if ((await getLoginState()).loggedIn && !win.isDestroyed()) {
      log.info('logged in');
      win.close();
    }
  };
  win.webContents.on('did-navigate', (_e, url) => void checkDone(url));
  win.on('closed', () => {
    loginWindow = null;
    void notify();
  });
  win.loadURL(LOGIN_URL);
};

const logout = async () => {
  await youtubeSession().clearStorageData();
  log.info('logged out');
  await notify();
};

export const registerYoutubeAuthHandlers = () => {
  ipcMain.handle(electronEvent.YOUTUBE_LOGIN, () => openLoginWindow());
  ipcMain.handle(electronEvent.YOUTUBE_LOGOUT, () => logout());
  ipcMain.handle(electronEvent.GET_YOUTUBE_LOGIN_STATE, () => getLoginState());
};
