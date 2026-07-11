/**
 * スレッドブラウザ (スレ一覧・プレビュー・スレ移動) のウィンドウと IPC ハンドラ。
 *
 * - bbs モード: config.url のスレが属する板を開く。「このスレッドに移動」でコメント
 *   読み込みの threadUrl を置き換えられる (自動スレ移動 checkAutoMoveThread と同じ機構)。
 * - jpnkn モード: config.jpnknFastBoardId の板を開く。MQTT で板全体を受信する方式で
 *   「特定スレを読む」概念がないため、一覧とプレビューのみ (移動は renderer 側で非表示)。
 */
import electron, { ipcMain } from 'electron';
import * as remote from '@electron/remote/main';
import windowStateKeeper from 'electron-window-state';
import electronlog from 'electron-log';
const log = electronlog.scope('threadBrowser');

import { electronEvent } from './const';
import { getThreadList, threadUrlToBoardInfo } from './getRes';
import ReadSitaraba from './readBBS/ReadSitaraba';
import Read5ch from './readBBS/Read5ch';
import { createThread5ch, createThreadShitaraba, CreateThreadPostResult } from './readBBS/createThread';
import { unescapeHtml, sleep } from './util';

export type ThreadBrowserMode = 'bbs' | 'jpnkn';

let browserWindow: electron.BrowserWindow | null = null;

/** threadBrowser.html の URL を解決する関数。main.ts の初期化時に渡される */
let resolvePageUrl: () => string = () => '';

/**
 * 「掲示板を開く」時に設定画面から渡された入力値 (bbs: スレURL / jpnkn: 板ID)。
 * 適用前の編集中の値でも開けるように、globalThis.config より優先する。
 */
let requestedSource: string | null = null;

/**
 * モードから板URL解決の元になる値を返す。設定が無い場合は null。
 * globalThis.config はサーバー起動・適用・テストのいずれかを行うまで main 側では
 * undefined のため (renderer からしか渡されない)、optional chaining で参照する。
 */
const resolveBoardUrl = (mode: ThreadBrowserMode): string | null => {
  if (mode === 'jpnkn') {
    const boardId = requestedSource || globalThis.config?.jpnknFastBoardId;
    if (!boardId) return null;
    return `https://bbs.jpnkn.com/${boardId}/`;
  }
  const threadUrl = requestedSource || globalThis.config?.url;
  if (!threadUrl) return null;
  return threadUrl;
};

const openWindow = (mode: ThreadBrowserMode) => {
  if (browserWindow && !browserWindow.isDestroyed()) {
    // 既に開いている場合はモードを合わせて前面に出す
    browserWindow.loadURL(`${resolvePageUrl()}?mode=${mode}`);
    browserWindow.show();
    browserWindow.focus();
    return;
  }

  const windowState = windowStateKeeper({
    defaultWidth: 960,
    defaultHeight: 700,
    file: 'threadBrowser.json',
  });

  browserWindow = new electron.BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    useContentSize: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  remote.enable(browserWindow.webContents);
  windowState.manage(browserWindow);

  browserWindow.setTitle('unacast - スレッド一覧');
  browserWindow.setMenu(null);
  browserWindow.loadURL(`${resolvePageUrl()}?mode=${mode}`);
  browserWindow.on('closed', () => {
    browserWindow = null;
  });
  // browserWindow.webContents.openDevTools();
};

/** レス本文/名前の HTML を、プレビュー表示用のプレーンテキストへ変換する */
const toPlainText = (html: string): string => {
  return unescapeHtml(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .trim(),
  );
};

export type ThreadPreviewItem = { number: string; name: string; date: string; text: string };

/** スレ立てフォームへコピーする元データ (スレタイ + 1レス目の名前/メール/本文) */
export type ThreadCreateSource = { title: string; name: string; mail: string; body: string };

/** スレURL末尾のスレキー (作成時刻由来の数値)。取れなければ 0 */
const threadKey = (url: string): number => Number(url.match(/(\d+)\/?$/)?.[1] ?? 0);

/** IPC ハンドラとウィンドウ生成を登録する。main.ts の起動処理から一度だけ呼ぶ */
export const initThreadBrowser = (resolveUrl: () => string) => {
  resolvePageUrl = resolveUrl;

  ipcMain.on(electronEvent.OPEN_THREAD_BROWSER, (_event, payload: { mode: ThreadBrowserMode; source?: string }) => {
    log.info(`[open] mode=${payload.mode}`);
    requestedSource = payload.source || null;
    openWindow(payload.mode);
  });

  /** 板情報の解決。板名・板URL・現在読み込み中のスレURLを返す */
  ipcMain.handle(electronEvent.THREAD_BROWSER_INIT, async (_event, mode: ThreadBrowserMode) => {
    try {
      const source = resolveBoardUrl(mode);
      if (!source) {
        return { ok: false, error: mode === 'jpnkn' ? 'jpnkn の板IDが設定されていません。' : '掲示板URLが設定されていません。' };
      }
      const info = await threadUrlToBoardInfo(source);
      if (info.status !== 'ok') {
        return { ok: false, error: `板情報を取得できませんでした (${source})` };
      }
      return {
        ok: true,
        mode,
        boardUrl: info.boardUrl,
        boardName: info.boardName,
        currentThreadUrl: globalThis.config?.url ?? '',
      };
    } catch (e) {
      log.error(e);
      return { ok: false, error: '板情報の取得中にエラーが発生しました。' };
    }
  });

  /** スレ一覧の取得 */
  ipcMain.handle(electronEvent.THREAD_BROWSER_LIST, async (_event, boardUrl: string) => {
    try {
      const threads = await getThreadList(boardUrl);
      // subject.txt は「最終更新スレ」が先頭にもう一度重複して現れる掲示板がある
      // (したらば・jpnkn) ため、URL で重複を除く (先頭 = 更新順の位置を残す)
      const seen = new Set<string>();
      const unique = threads.filter((t) => {
        if (seen.has(t.url)) return false;
        seen.add(t.url);
        return true;
      });
      return { ok: true, threads: unique };
    } catch (e) {
      log.error(e);
      return { ok: false, error: 'スレッド一覧を取得できませんでした。' };
    }
  });

  /**
   * スレ内容のプレビュー。全レスをプレーンテキストで返す (テンプレ確認等のため省略しない)。
   * resNum は「この番号より後」の意味なので、レス1を含む全件は 0 を指定する。
   * コメント取得のポーリングが使う共有インスタンス (getRes.ts のシングルトン) の
   * 取得位置キャッシュを壊さないよう、毎回新しいインスタンスで読む。
   */
  ipcMain.handle(electronEvent.THREAD_BROWSER_PREVIEW, async (_event, threadUrl: string) => {
    try {
      const reader = threadUrl.includes('jbbs.shitaraba.net') ? new ReadSitaraba() : new Read5ch();
      const comments = await reader.read(threadUrl, 0);
      const items: ThreadPreviewItem[] = comments.map((c) => ({
        number: c.number ?? '',
        name: toPlainText(c.name ?? ''),
        date: c.date ?? '',
        text: toPlainText(c.text ?? ''),
      }));
      return { ok: true, total: items.length, comments: items };
    } catch (e) {
      log.error(e);
      return { ok: false, error: 'スレッドの内容を取得できませんでした。' };
    }
  });

  /**
   * コメント読み込みのスレッドURLを置き換える。
   * 自動スレ移動 (checkAutoMoveThread) と同じ機構: config.url を書き換えて
   * threadNumber をリセットし、renderer へ SAVE_CONFIG で通知して永続化させる。
   */
  ipcMain.handle(electronEvent.THREAD_BROWSER_APPLY, async (_event, threadUrl: string) => {
    try {
      log.info(`[apply] ${threadUrl}`);
      if (globalThis.config) {
        globalThis.config.url = threadUrl;
        globalThis.electron.threadNumber = 0;
        globalThis.electron.mainWindow.webContents.send(electronEvent.SAVE_CONFIG, globalThis.config);
      } else {
        // main 側の config はサーバー起動・適用・テストのいずれかまで未初期化。
        // その場合は renderer に URL だけ通知し、renderer 側で config.url を更新・永続化する
        globalThis.electron.mainWindow.webContents.send(electronEvent.THREAD_BROWSER_URL_SELECTED, threadUrl);
      }

      // サーバー起動中ならシステムコメントで移動を通知する
      if (globalThis.electron.commentQueueList) {
        globalThis.electron.commentQueueList.push({
          name: 'unacastより',
          imgUrl: '/img/unacast.png',
          text: 'スレッドを移動しました',
          type: 'comment',
          from: 'system',
        });
      }
      return { ok: true };
    } catch (e) {
      log.error(e);
      return { ok: false, error: 'スレッドの切り替えに失敗しました。' };
    }
  });

  /**
   * スレ立てフォームの「現在のスレッドからコピー」用データ取得。
   * bbs: 現在コメント読み込み中のスレ / jpnkn: スレキー最大 (最も新しく立った) のスレ。
   * スレタイと1レス目の名前・メール・本文を返す。
   */
  ipcMain.handle(electronEvent.THREAD_BROWSER_CREATE_SOURCE, async (_event, payload: { mode: ThreadBrowserMode; boardUrl: string }) => {
    try {
      let threadUrl: string | null;
      if (payload.mode === 'jpnkn') {
        const threads = await getThreadList(payload.boardUrl);
        if (threads.length === 0) return { ok: false, error: 'コピー元にできるスレッドがありません。' };
        threadUrl = threads.reduce((a, b) => (threadKey(b.url) > threadKey(a.url) ? b : a)).url;
      } else {
        threadUrl = requestedSource || globalThis.config?.url || null;
        if (!threadUrl) return { ok: false, error: '現在読み込み中のスレッドがありません。' };
      }

      const reader = threadUrl.includes('jbbs.shitaraba.net') ? new ReadSitaraba() : new Read5ch();
      const comments = await reader.read(threadUrl, 0);
      if (comments.length === 0) return { ok: false, error: 'コピー元スレッドの内容を取得できませんでした。' };
      const first = comments[0];
      const source: ThreadCreateSource = {
        title: toPlainText(first.threadTitle ?? ''),
        name: toPlainText(first.name ?? ''),
        mail: first.email ?? '',
        body: toPlainText(first.text ?? ''),
      };
      return { ok: true, source };
    } catch (e) {
      log.error(e);
      return { ok: false, error: 'コピー元スレッドの取得中にエラーが発生しました。' };
    }
  });

  /**
   * スレ立ての実行。
   * write cgi は失敗でも HTTP 200 でエラーHTMLを返すため、応答本文の判定は
   * ベストエフォートとし、成功の最終確認は subject.txt の再取得で
   * 「実行前に無かった新スレが現れたか」を見る。
   */
  ipcMain.handle(electronEvent.THREAD_BROWSER_CREATE, async (_event, payload: { boardUrl: string; title: string; name: string; mail: string; body: string }) => {
    try {
      const { boardUrl, title, name, mail, body } = payload;
      if (!title.trim() || !body.trim()) return { ok: false, error: 'タイトルと本文を入力してください。' };

      // 実行前のスレ一覧 (新スレ出現の判定基準)
      const before = new Set((await getThreadList(boardUrl).catch(() => [] as { url: string }[])).map((t) => t.url));

      let postResult: CreateThreadPostResult;
      if (boardUrl.includes('jbbs.shitaraba.net')) {
        // 例: https://jbbs.shitaraba.net/game/51638/
        const m = boardUrl.match(/^(https?:\/\/[^/]+\/)([^/]+)\/(\d+)\/?$/);
        if (!m) return { ok: false, error: `したらばの板URLを解析できませんでした (${boardUrl})` };
        postResult = await createThreadShitaraba(m[1], m[2], m[3], { title, name, mail, body });
      } else {
        // 例: https://bbs.jpnkn.com/pasta04/
        const m = boardUrl.match(/^(https?:\/\/[^/]+\/)(.+?)\/?$/);
        if (!m) return { ok: false, error: `板URLを解析できませんでした (${boardUrl})` };
        postResult = await createThread5ch(m[1], m[2], { title, name, mail, body });
      }
      log.info(`[create] post status=${postResult.status} ${postResult.error ?? ''}`);

      // subject.txt を再取得して新スレの出現を確認する (反映ラグを考慮して数回)
      const normalize = (s: string) => s.replace(/\s+/g, '');
      for (let attempt = 0; attempt < 3; attempt++) {
        await sleep(1500);
        const threads = await getThreadList(boardUrl).catch(() => [] as { url: string; name: string; resNum: number }[]);
        const fresh = threads.filter((t) => !before.has(t.url));
        // タイトル一致を優先し、一致が無くても新スレが1件だけなら自スレとみなす
        const matched = fresh.find((t) => normalize(t.name).includes(normalize(title))) ?? (fresh.length === 1 ? fresh[0] : undefined);
        if (matched) {
          log.info(`[create] created: ${matched.url}`);
          return { ok: true, newThreadUrl: matched.url };
        }
      }

      // 新スレを確認できなかった。応答本文のエラーがあればそれを返す
      if (postResult.status === 'error') return { ok: false, error: postResult.error };
      return { ok: false, error: 'スレッドの作成を確認できませんでした。時間をおいて一覧を更新してください。' };
    } catch (e) {
      log.error(e);
      const message = e instanceof Error ? e.message : String(e);
      return { ok: false, error: `スレッド作成中にエラーが発生しました (${message})` };
    }
  });
};
