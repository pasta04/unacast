// Electronのモジュール
import path from 'path';
import electron, { Tray, Menu, dialog } from 'electron';
import log from 'electron-log';
import { sleep } from './util';
import windowStateKeeper from 'electron-window-state';

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
  app.quit();
} else {
  log.info('[app] started');

  app.allowRendererProcessReuse = true;

  const iconPath = path.resolve(__dirname, '../icon.png');

  // サーバー起動モジュール
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ss = require('./startServer');
  console.trace(ss);

  // メインウィンドウはGCされないようにグローバル宣言
  globalThis.electron = {
    mainWindow: null as any,
    chatWindow: null as any,
    translateWindow: null as any,
    imagePreviewWindow: null as any,
    seList: [],
    twitchChat: null as any,
    youtubeChat: null as any,
    niconicoChat: null as any,
    jpnknFast: null as any,
    threadConnectionError: 0,
    threadNumber: 0,
    commentQueueList: [],
    translateQueueList: [],
  };

  globalThis.config = {} as any;

  // 全てのウィンドウが閉じたら終了
  // app.on('window-all-closed', () => {
  //   if (process.platform != 'darwin') {
  //     app.quit();
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
      },
      skipTaskbar: true,
    });
    globalThis.electron.mainWindow = mainWin;
    windowState.manage(mainWin);

    mainWin.setTitle('unacast');
    mainWin.setMenu(null);

    // レンダラーで使用するhtmlファイルを指定する
    mainWin.loadURL('file://' + path.resolve(__dirname, '../src/html/index.html'));

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
    let tray = null;
    app.whenReady().then(() => {
      tray = new Tray(iconPath);
      const contextMenu = Menu.buildFromTemplate([
        {
          label: '設定',
          click: function () {
            globalThis.electron.mainWindow.focus();
          },
        },
        {
          label: 'コメント',
          click: function () {
            globalThis.electron.chatWindow.focus();
          },
        },
        {
          label: '翻訳',
          click: function () {
            globalThis.electron.translateWindow.focus();
          },
        },
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
      tray.on('click', async (event) => {
        isDoubleClicked = false;
        await sleep(200);
        if (isDoubleClicked) return;
        globalThis.electron.chatWindow.focus();
      });
      tray.on('double-click', (event) => {
        isDoubleClicked = true;
        globalThis.electron.mainWindow.focus();
      });
    });

    createChatWindow();
    createTranslateWindow();
    createImagePreviewWindow();
  });

  // 音声再生できるようにする
  app.commandLine.appendSwitch('--autoplay-policy', 'no-user-gesture-required');
}

const createChatWindow = () => {
  const windowState = windowStateKeeper({
    defaultWidth: 400,
    defaultHeight: 720,
    file: 'chatWindow.json',
  });
  const iconPath = path.resolve(__dirname, '../icon.png');

  const chatWindow = new electron.BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,

    useContentSize: true,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: true,
    },
    // タスクバーに表示しない
    skipTaskbar: true,
    // 閉じれなくする
    closable: false,
  });
  windowState.manage(chatWindow);

  chatWindow.setTitle('unacast');
  chatWindow.setMenu(null);

  // レンダラーで使用するhtmlファイルを指定する
  chatWindow.loadURL('file://' + path.resolve(__dirname, '../src/html/chat.html'));

  globalThis.electron.chatWindow = chatWindow;
  // chatWindow.webContents.openDevTools();
};

const createTranslateWindow = () => {
  const windowState = windowStateKeeper({
    defaultWidth: 400,
    defaultHeight: 720,
    file: 'translateWindow.json',
  });
  const iconPath = path.resolve(__dirname, '../icon.png');

  const translateWindow = new electron.BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,

    useContentSize: true,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: true,
    },
    // タスクバーに表示しない
    skipTaskbar: true,
    // 閉じれなくする
    closable: false,
  });
  windowState.manage(translateWindow);

  translateWindow.setTitle('unacast');
  translateWindow.setMenu(null);

  // レンダラーで使用するhtmlファイルを指定する
  translateWindow.loadURL('file://' + path.resolve(__dirname, '../src/html/translate.html'));

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
  const iconPath = path.resolve(__dirname, '../icon.png');

  const childwindow = new electron.BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,

    useContentSize: true,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: true,
    },
    // タスクバーに表示しない
    skipTaskbar: true,

    minimizable: false,
    minHeight: 100,
    closable: true,
  });
  windowState.manage(childwindow);

  childwindow.setTitle('unacast');
  childwindow.setMenu(null);
  childwindow.hide();

  // レンダラーで使用するhtmlファイルを指定する
  childwindow.loadURL('file://' + path.resolve(__dirname, '../src/html/imagePreview.html'));

  // ×押したらインスタンス再生成
  childwindow.on('close', (e) => {
    setTimeout(() => {
      createImagePreviewWindow();
    }, 10);
  });

  globalThis.electron.imagePreviewWindow = childwindow;
  // childwindow.webContents.openDevTools();
};
