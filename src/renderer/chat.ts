import electron, { shell } from 'electron';
import { Menu, MenuItem, getCurrentWindow } from '@electron/remote';
import { writeClipboardText } from './clipboard';
import electronlog from 'electron-log/renderer';
const log = electronlog.scope('renderer-chat');
import { electronEvent } from '../main/const';

const ipcRenderer = electron.ipcRenderer;

let forceScroll = true;

document.addEventListener('DOMContentLoaded', () => {
  log.debug('DOM Content Loaded');
});

/** テキスト選択中の右クリックメニュー */
const contextMenuInText = new Menu();
contextMenuInText.append(
  new MenuItem({
    label: 'Copy',
    type: 'normal',
    click: (_menu, _browser, _event) => {
      const text = window.getSelection()?.toString() ?? '';
      if (!text) return;

      void writeClipboardText(text);
    },
  }),
);

/** 画像右クリックメニュー */
const createContextMenuInImage = (e: MouseEvent, src: string) => {
  const contextMenuInImage = new Menu();
  contextMenuInImage.append(
    new MenuItem({
      label: 'Copy URL',
      type: 'normal',
      click: (_menu, _browser, _event) => {
        void writeClipboardText(src);
      },
    }),
  );
  contextMenuInImage.append(
    new MenuItem({
      label: 'Open By Browser',
      type: 'normal',
      click: (_menu, _browser, _event) => {
        shell.openExternal(src);
      },
    }),
  );
  contextMenuInImage.popup({ window: getCurrentWindow(), x: e.x, y: e.y });
};

const contextMenu = new Menu();
contextMenu.append(
  new MenuItem({
    label: '最前面表示',
    type: 'checkbox',
    checked: false,
    click: (e) => {
      getCurrentWindow().setAlwaysOnTop(e.checked);
    },
  }),
);

contextMenu.append(
  new MenuItem({
    label: 'スクロールが端以外の時もコメント受信時に端に飛ぶ',
    type: 'checkbox',
    checked: true,
    click: (e) => {
      getCurrentWindow().webContents.send(electronEvent.FORCE_SCROLL, e.checked);
    },
  }),
);

// 右クリックメニュー
document.oncontextmenu = (e: MouseEvent) => {
  e.preventDefault();

  const target = e.target as any;
  if (target && target.tagName === 'IMG') {
    // 画像クリックした時は画像用のメニューを表示
    createContextMenuInImage(e, target.src);
  } else {
    // 選択範囲があるならCopyのメニューを出す
    const selectText = window.getSelection()?.toString() ?? '';
    if (selectText) {
      contextMenuInText.popup({ window: getCurrentWindow(), x: e.x, y: e.y });
    } else {
      contextMenu.popup({ window: getCurrentWindow(), x: e.x, y: e.y });
    }
  }
};

ipcRenderer.on(electronEvent.FORCE_SCROLL, (event: any, args: boolean) => {
  log.info(`[FORCE_SCROLL] ${args}`);
  forceScroll = args;
});

// コメント表示
ipcRenderer.on(electronEvent.SHOW_COMMENT, (event: any, args: { config: (typeof globalThis)['config']; dom: string }) => {
  // log.info('[show-comment] received');
  const dom = document.getElementById('res-list') as HTMLInputElement;

  // スクロール位置が端であるなら、スクロール位置も追従する
  const isTop = document.documentElement.scrollTop === 0;
  const isBottom = document.documentElement.scrollTop + document.documentElement.clientHeight === document.documentElement.scrollHeight;

  // 表示順オプションで上に追加するか下に追加するか選ぶ
  if (args.config.dispSort) {
    // 下に追加
    dom.insertAdjacentHTML('beforeend', args.dom);
  } else {
    // 上に追加
    dom.insertAdjacentHTML('afterbegin', args.dom);
  }

  if (args.config.dispSort) {
    // 新着が下
    if (isBottom || forceScroll) {
      document.documentElement.scrollTo(0, document.documentElement.scrollHeight);
    }
  } else {
    // 新着が上
    if (isTop || forceScroll) {
      document.documentElement.scrollTo(0, 0);
    }
  }
});

/**
 * 設定画面で編集したユーザー CSS を反映する。
 * head の末尾に置くので、resources/style-server.css を含む既存の CSS より優先される。
 */
const applyUserCss = (css: string) => {
  let style = document.getElementById('user-css') as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = 'user-css';
    document.head.appendChild(style);
  }
  style.textContent = css;
};

ipcRenderer.on(electronEvent.APPLY_CHAT_WINDOW_CSS, (_event: any, css: string) => {
  applyUserCss(css);
});

// 読み込み時 (起動時・再読み込み時) は main が覚えている CSS を取得する
void ipcRenderer.invoke(electronEvent.GET_CHAT_WINDOW_CSS).then((css: string) => {
  // 取得中に適用が届いていたら、そちらが新しいので上書きしない
  if (!document.getElementById('user-css')) applyUserCss(css);
});

// リセット
ipcRenderer.on(electronEvent.CLEAR_COMMENT, () => {
  // log.info('[clear-comment] received');
  const dom = document.getElementById('res-list') as HTMLInputElement;
  dom.innerHTML = '';
});
