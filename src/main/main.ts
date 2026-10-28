// Electronのモジュール
import path from 'path';
import electron, { Tray, Menu, dialog, ipcMain } from 'electron';
import * as remote from '@electron/remote/main';
import log from 'electron-log';
import { sleep } from './util';
import windowStateKeeper from 'electron-window-state';
import ElectronStore from 'electron-store';
// サーバー起動モジュール (IPC ハンドラ等の副作用登録目的)
import './startServer';
import { initThreadBrowser } from './threadBrowser';
import { registerClipboardHandlers } from './clipboard';
import { registerChatWindowCssHandlers } from './chatWindowCss';
import { registerSpeechControlHandlers } from './speechControl';
import { applyChatWindowRuntimeMode, chatWindowCreateOptions, loadChatWindowMode, registerChatWindowModeHandlers } from './chatWindowMode';
import SherpaSpeechToText from './sherpaStt';
import { electronEvent } from './const';
remote.initialize();

/**
 * 各 HTML ページのロード先 URL を解決する。
 *  - electron-vite dev 中: process.env.ELECTRON_RENDERER_URL に dev サーバの URL が入る
 *  - production: dist/main/index.js から見た dist/renderer/src/html/<name>.html を file:// で読む
 */
const resolveRendererUrl = (htmlName: 'index' | 'chat' | 'translate' | 'imagePreview' | 'threadBrowser') => {
  const devUrl = process.env.ELECTRON_RENDERER_URL;
  if (devUrl) {
    return `${devUrl}/src/html/${htmlName}.html`;
  }
  return 'file://' + path.resolve(__dirname, `../renderer/src/html/${htmlName}.html`);
};
log.initialize();

// HTMLで出ないウインドウの表示設定
type WindowConfig = (typeof globalThis)['window_config'];

console.trace = () => {
  //
};

process.on('uncaughtException', (err) => {
  log.error(err);
});

// アプリケーションをコントロールするモジュール
const app = electron.app;

// 多重起動防止
if (!app.requestSingleInstanceLock()) {
  log.error('[app] It is terminated for multiple launches.');
  app.exit();
} else {
  log.info('[app] started');

  const store = new ElectronStore<WindowConfig>({
    name: 'unacast-window-config',
    defaults: {
      taskbar: {
        mainWindow: true,
        chatWindow: true,
        translateWindow: true,
        imagePreviewWindow: false,
      },
    },
  }) as any;

  // app.allowRendererProcessReuse = true;

  const iconPath = path.resolve(__dirname, '../../icon.png');

  // メインウィンドウはGCされないようにグローバル宣言
  globalThis.electron = {
    mainWindow: null as any,
    chatWindow: null as any,
    translateWindow: null as any,
    imagePreviewWindow: null as any,
    iconList: null as any,
    seList: [],
    twitchChat: null as any,
    youtubeChat: null as any,
    niconicoChat: null as any,
    twitcastingChat: null as any,
    jpnknFast: null as any,
    sherpaStt: new SherpaSpeechToText(),
    threadNumber: 0,
    bbsDefaultName: '',
    jpnknDefaultName: '',
    commentQueueList: [],
    translateQueueList: [],
  };

  globalThis.window_config = {
    taskbar: store.get('taskbar'),
  };
  // チャットウィンドウの表示モード (最前面・枠なし/背景透過)。ウィンドウ作成前に読み込む
  loadChatWindowMode(store);

  // 全てのウィンドウが閉じたら終了
  // app.on('window-all-closed', () => {
  //   if (process.platform != 'darwin') {
  //     app.exit();
  //   }
  // });

  // Electronの初期化完了後に実行
  app.on('ready', () => {
    const windowState = windowStateKeeper({
      defaultWidth: 700,
      defaultHeight: 720,
      file: 'mainWindow.json',
    });

    // ウィンドウサイズを（フレームサイズを含まない）設定
    const mainWin = new electron.BrowserWindow({
      // 前回起動時のを復元
      x: windowState.x,
      y: windowState.y,
      width: windowState.width,
      height: windowState.height,

      useContentSize: true,
      icon: iconPath,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
      // タスクバー非表示
      skipTaskbar: globalThis.window_config.taskbar?.mainWindow ?? false,
    });
    remote.enable(mainWin.webContents);
    globalThis.electron.mainWindow = mainWin;
    windowState.manage(mainWin);

    mainWin.setTitle('unacast');
    mainWin.setMenu(null);

    // // レンダラーで使用するhtmlファイルを指定する
    mainWin.loadURL(resolveRendererUrl('index'));

    // ウィンドウが閉じられたらアプリも終了
    mainWin.on('close', (event) => {
      // 確認ダイアログではいをクリックしたら閉じる
      event.preventDefault();
      dialog
        .showMessageBox(mainWin, {
          type: 'question',
          buttons: ['Yes', 'No'],
          // title: '',
          message: '終了しますか？',
        })
        .then((value) => {
          if (value.response === 0) {
            app.exit();
          }
        });
    });
    mainWin.on('closed', () => {
      log.info('[app] close');
      app.exit();
    });

    // 開発者ツールを開く
    // mainWin.webContents.openDevTools();

    // タスクトレイの設定
    let tray: Tray = null as any;
    app.whenReady().then(() => {
      tray = new Tray(iconPath);
      const contextMenu = Menu.buildFromTemplate([
        {
          label: '設定',
          click: function () {
            globalThis.electron.mainWindow.show();
            globalThis.electron.mainWindow.focus();
          },
        },
        {
          label: 'コメント',
          click: function () {
            globalThis.electron.chatWindow.show();
            globalThis.electron.chatWindow.focus();
          },
        },
        {
          label: '翻訳',
          click: function () {
            globalThis.electron.translateWindow.show();
            globalThis.electron.translateWindow.focus();
          },
        },
        {
          label: 'タスクバー表示設定',
          submenu: [
            {
              label: '設定',
              type: 'checkbox',
              checked: globalThis.window_config.taskbar?.mainWindow ?? false,
              click(item) {
                globalThis.window_config.taskbar.mainWindow = item.checked;
                store.set('taskbar', globalThis.window_config.taskbar);
                applyTaskbarState();
              },
            },
            {
              label: 'チャット',
              type: 'checkbox',
              checked: globalThis.window_config.taskbar?.chatWindow ?? false,
              click(item) {
                globalThis.window_config.taskbar.chatWindow = item.checked;
                store.set('taskbar', globalThis.window_config.taskbar);
                applyTaskbarState();
              },
            },
            {
              label: '翻訳',
              type: 'checkbox',
              checked: globalThis.window_config.taskbar?.translateWindow ?? false,
              click(item) {
                globalThis.window_config.taskbar.translateWindow = item.checked;
                store.set('taskbar', globalThis.window_config.taskbar);
                applyTaskbarState();
              },
            },
            // {
            //   label: '画像プレビュー',
            //   type: 'checkbox',
            //   checked: globalThis.config.showTaskbar.imagepreview,
            //   click(item) {
            //     globalThis.config.showTaskbar.imagepreview = item.checked;
            //     applyTaskbarState();
            //   },
            // },
          ],
        },
        { type: 'separator' },
        {
          label: '終了',
          click: function () {
            globalThis.electron.mainWindow.close();
          },
        },
      ]);
      tray.setToolTip('∈(ﾟ◎ﾟ)∋ｳﾅｰ');
      tray.setContextMenu(contextMenu);
      // タスクトレイクリック時の挙動
      let isDoubleClicked = false;
      tray.on('click', async () => {
        isDoubleClicked = false;
        await sleep(200);
        if (isDoubleClicked) return;
        globalThis.electron.chatWindow.show();
        globalThis.electron.chatWindow.focus();
      });
      tray.on('double-click', () => {
        isDoubleClicked = true;
        globalThis.electron.mainWindow.show();
        globalThis.electron.mainWindow.focus();
      });
    });

    createChatWindow();
    createTranslateWindow();
    createImagePreviewWindow();
    initThreadBrowser(() => resolveRendererUrl('threadBrowser'));
    registerClipboardHandlers();
    registerChatWindowCssHandlers();
    registerSpeechControlHandlers();
    registerChatWindowModeHandlers(recreateChatWindow);
    initializeSherpaStt(globalThis.electron.sherpaStt);

    applyTaskbarState();
  });

  // 音声再生できるようにする
  app.commandLine.appendSwitch('--autoplay-policy', 'no-user-gesture-required');
}

/** チャットウィンドウの位置・大きさの保存 (作り直し時に、作り直す前の状態を保存するため保持する) */
let chatWindowState: ReturnType<typeof windowStateKeeper> | null = null;

const createChatWindow = () => {
  const windowState = windowStateKeeper({
    defaultWidth: 400,
    defaultHeight: 720,
    file: 'chatWindow.json',
  });
  const iconPath = path.resolve(__dirname, '../../icon.png');

  const chatWindow = new electron.BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,

    useContentSize: true,
    icon: iconPath,
    // 枠・背景透過・下地色 (表示モードによる。作成時にしか指定できない)
    ...chatWindowCreateOptions(),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    // タスクバーに表示しない
    skipTaskbar: globalThis.window_config.taskbar.chatWindow ?? false,
    // 閉じれなくする
    closable: false,
  });
  remote.enable(chatWindow.webContents);
  windowState.manage(chatWindow);
  chatWindowState = windowState;
  // 最前面・クリック透過
  applyChatWindowRuntimeMode(chatWindow);

  chatWindow.setTitle('unacast');
  chatWindow.setMenu(null);

  // レンダラーで使用するhtmlファイルを指定する
  chatWindow.loadURL(resolveRendererUrl('chat'));

  globalThis.electron.chatWindow = chatWindow;
  // chatWindow.webContents.openDevTools();
};

/**
 * チャットウィンドウを作り直す (枠なし/背景透過の切り替え用)。
 * 表示中のコメントは作り直す前に取り出し、新しいウィンドウの読み込み後に戻す。位置・大きさは保存して引き継ぐ。
 */
const recreateChatWindow = async () => {
  const old = globalThis.electron.chatWindow;
  let commentsHtml = '';
  if (old && !old.isDestroyed()) {
    try {
      commentsHtml = await old.webContents.executeJavaScript(`document.getElementById('res-list')?.innerHTML ?? ''`);
    } catch (e) {
      log.warn('[recreateChatWindow] コメントの退避に失敗', e);
    }
    chatWindowState?.saveState(old);
    old.destroy();
  }
  createChatWindow();
  const chatWindow = globalThis.electron.chatWindow;
  chatWindow.setSkipTaskbar(!globalThis.window_config.taskbar.chatWindow);
  chatWindow.webContents.once('did-finish-load', () => {
    chatWindow.webContents.send(electronEvent.RESTORE_CHAT_COMMENTS, commentsHtml);
  });
};

const createTranslateWindow = () => {
  const windowState = windowStateKeeper({
    defaultWidth: 400,
    defaultHeight: 720,
    file: 'translateWindow.json',
  });
  const iconPath = path.resolve(__dirname, '../../icon.png');

  const translateWindow = new electron.BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,

    useContentSize: true,
    icon: iconPath,
    // CSS 適用前の下地色。style-window.css の既定背景と合わせて白フラッシュを防ぐ
    backgroundColor: '#1e1e1e',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    // タスクバーに表示しない
    skipTaskbar: globalThis.window_config.taskbar?.translateWindow ?? false,
    // 閉じれなくする
    closable: false,
  });
  remote.enable(translateWindow.webContents);
  windowState.manage(translateWindow);

  translateWindow.setTitle('unacast');
  translateWindow.setMenu(null);

  // レンダラーで使用するhtmlファイルを指定する
  translateWindow.loadURL(resolveRendererUrl('translate'));

  // 初期表示は最小化
  translateWindow.minimize();
  globalThis.electron.translateWindow = translateWindow;
  // translateWindow.webContents.openDevTools();
};

const createImagePreviewWindow = () => {
  const windowState = windowStateKeeper({
    defaultWidth: 400,
    defaultHeight: 400,
    file: 'imagePreview.json',
  });
  const iconPath = path.resolve(__dirname, '../../icon.png');

  const childwindow = new electron.BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,

    useContentSize: true,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    // タスクバーに表示しない
    skipTaskbar: true,

    minimizable: false,
    minHeight: 100,
    closable: true,
  });
  remote.enable(childwindow.webContents);
  windowState.manage(childwindow);

  childwindow.setTitle('unacast');
  childwindow.setMenu(null);
  childwindow.hide();

  // レンダラーで使用するhtmlファイルを指定する
  childwindow.loadURL(resolveRendererUrl('imagePreview'));

  // ×押したらインスタンス再生成
  childwindow.on('close', () => {
    setTimeout(() => {
      createImagePreviewWindow();
    }, 10);
  });

  globalThis.electron.imagePreviewWindow = childwindow;
  // childwindow.webContents.openDevTools();
};

const applyTaskbarState = () => {
  const map = globalThis.window_config.taskbar;

  const targets: [string, electron.BrowserWindow][] = [
    ['mainWindow', globalThis.electron.mainWindow],
    ['chatWindow', globalThis.electron.chatWindow],
    ['translateWindow', globalThis.electron.translateWindow],
    //['imagePreviewWindow', globalThis.electron.imagePreviewWindow],
  ];

  for (const [key, win] of targets) {
    if (win && !win.isDestroyed()) {
      win.setSkipTaskbar(!map[key]);
    }
  }
};

const initializeSherpaStt = (stt: SherpaSpeechToText) => {
  stt.on('start', () => {
    globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, {
      commentType: 'stt',
      category: 'status',
      message: `読み取り開始`,
    });
  });

  stt.on('comment', (event) => {
    globalThis.electron.commentQueueList.push({ ...event, imgUrl: globalThis.electron.iconList.getStt() });
    globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, {
      commentType: 'stt',
      category: 'status',
      message: `ok`,
    });
  });
  // 読み取り終了
  stt.on('end', () => {
    globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, {
      commentType: 'stt',
      category: 'status',
      message: `読み取り終了`,
    });
  });
  stt.on('error', (error, message) => {
    globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, {
      commentType: 'stt',
      category: 'status',
      // 見出しが無いエラー (マイク関連など) は理由だけを出す
      message: message ? `${message}: ${error}` : `${error}`,
    });
  });
  stt.on('status', (message) => {
    globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, {
      commentType: 'stt',
      category: 'status',
      message: message,
    });
  });

  /** モデルのダウンロード状態を renderer に通知する */
  const sendModelStatus = () => {
    globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, {
      commentType: 'stt',
      category: 'modelStatus',
      message: stt.checkModels() ? 'ダウンロード済み' : '未ダウンロード',
    });
  };

  ipcMain.on(electronEvent.SHERPA_STT, async (_event: any, command: string, arg?: unknown) => {
    switch (command) {
      case 'micStarted':
        stt.onMicStarted();
        break;
      case 'micError':
        stt.onMicError(String(arg));
        break;
      case 'restart':
        stt.restart((arg as { inputDevice?: string } | undefined)?.inputDevice);
        break;
      case 'downloadModels':
        await stt.downloadModels();
        sendModelStatus();
        break;
      case 'checkModelStatus':
        // 起動直後は renderer の準備前に送っても届かないため、設定画面の表示時に renderer から問い合わせる
        sendModelStatus();
        break;
    }
  });
};
