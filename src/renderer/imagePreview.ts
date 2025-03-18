import electron, { shell } from 'electron';
import { Menu, MenuItem, getCurrentWindow } from '@electron/remote';
import electronlog from 'electron-log/renderer';
import path from 'path';
const log = electronlog.scope('renderer-imagePreview');
import { electronEvent } from '../main/const';
import crypto from 'crypto';
const ipcRenderer = electron.ipcRenderer;

document.addEventListener('DOMContentLoaded', () => {
  log.debug('DOM Content Loaded');
});

ipcRenderer.on(electronEvent.PREVIEW_IMAGE, (event: any, url: string) => {
  document.title = `preview ${url}`;
  log.info('[preview-image] ' + url);
  const md5 = crypto.createHash('md5');
  const id = 'a' + md5.update(url).digest('hex'); // 英文字先頭じゃないとクエリ的に怒られる
  log.info('[preview-image] ' + id);

  const tabname = path.basename(url);

  const tabBartDom = document.getElementById('tab-bar') as HTMLDivElement;
  const tabContentDom = document.getElementById('tab-content') as HTMLDivElement;

  let existsTabdom = tabBartDom.querySelector(`#tab_${id}`);
  const existsContentdom = tabContentDom.querySelector(`#${id}`);

  // アクティブ状態を解除
  let existsdom2 = tabBartDom.querySelector(`.is-active`);
  if (existsdom2) existsdom2.classList.remove('is-active');

  existsdom2 = tabContentDom.querySelector(`.is-active`);
  if (existsdom2) existsdom2.classList.remove('is-active');

  // 既に開いてる場合は、アクティブにするだけ
  if (existsTabdom && existsContentdom) {
    existsTabdom.classList.add('is-active');
    existsContentdom.classList.add('is-active');
    return;
  }

  tabBartDom.insertAdjacentHTML('beforeend', `<a id="tab_${id}" href="#${id}" class="" data-type="tab">${tabname}</a>`);
  tabContentDom.insertAdjacentHTML('beforeend', `<div class="mdl-tabs__panel is-active" id="${id}"><div class="content"><img src="${url}" data-type="content" /></div></div>`);

  existsTabdom = tabBartDom.querySelector(`#tab_${id}`);
  if (existsTabdom) {
    existsTabdom.classList.add('mdl-tabs__tab');
    existsTabdom.classList.add('is-active');
    existsTabdom.addEventListener('click', activeTab(url, id));
  }
});

const activeTab = (url: string, id: string) => () => {
  document.title = `preview ${url}`;
  const tabBartDom = document.getElementById('tab-bar') as HTMLDivElement;
  const tabContentDom = document.getElementById('tab-content') as HTMLDivElement;

  const existsTabdom = tabBartDom.querySelector(`#tab_${id}`);
  const existsContentdom = tabContentDom.querySelector(`#${id}`);

  // アクティブ状態を解除
  let existsdom2 = tabBartDom.querySelector(`.is-active`);
  if (existsdom2) existsdom2.classList.remove('is-active');

  existsdom2 = tabContentDom.querySelector(`.is-active`);
  if (existsdom2) existsdom2.classList.remove('is-active');

  if (existsTabdom && existsContentdom) {
    existsTabdom.classList.add('is-active');
    existsContentdom.classList.add('is-active');
    return;
  }
};

/** タブ右クリック時の処理 */
const handleTabRightClick = (e: MouseEvent, id: string) => {
  const contextMenu = new Menu();
  contextMenu.append(
    new MenuItem({
      label: 'Close',
      type: 'normal',
      click: (menu, browser, event) => {
        // 要素取得
        const tabBarDom = document.getElementById('tab-bar') as HTMLDivElement;
        const tabContentDom = document.getElementById('tab-content') as HTMLDivElement;

        const existsTabdom = tabBarDom.querySelector(`#tab_${id}`) as HTMLDivElement;
        const existsContentdom = tabContentDom.querySelector(`#${id}`) as HTMLDivElement;
        // クローズ対象の位置取得
        const tabIdList: string[] = [];
        tabBarDom.querySelectorAll('a').forEach((value, key) => {
          tabIdList.push(value.getAttribute('id') as string);
        });
        const tabIndex = tabIdList.indexOf(`tab_${id}`);

        // クローズ
        if (existsTabdom) existsTabdom.remove();
        if (existsContentdom) existsContentdom.remove();

        // 他に要素があればそっちにフォーカスを移す
        // 最後の1個だったらそのまま終了
        if (tabIdList.length <= 1) return;
        // 一番後ろの要素なら1個前のやつ、それ以外の要素なら1個後ろのやつをアクティブ化対象にする
        const activeTargetId = tabIdList.length === tabIndex + 1 ? tabIdList[tabIndex - 1] : tabIdList[tabIndex + 1];
        document.getElementById(`${activeTargetId}`)?.classList.add('is-active');
        document.getElementById(`${activeTargetId.replace('tab_', '')}`)?.classList.add('is-active');
      },
    }),
  );

  // ブラウザで画像開く
  contextMenu.append(
    new MenuItem({
      label: 'Open By Browser',
      type: 'normal',
      click: (menu, browser, event) => {
        const imageDom = document.querySelector(`#${id} > div > img`);
        if (imageDom) {
          const src = imageDom.getAttribute('src') as string;
          shell.openExternal(src);
        }
      },
    }),
  );
  contextMenu.popup({ window: getCurrentWindow(), x: e.x, y: e.y });
};

// // 右クリックメニュー
document.oncontextmenu = (e: MouseEvent) => {
  e.preventDefault();

  const target = e.target as any;
  if (!target) return;

  const dataType = target.getAttribute('data-type');
  if (dataType === 'tab') {
    const domId = target.getAttribute('id').replace('tab_', '');

    // タブ右クリックメニュー
    handleTabRightClick(e, domId);
  } else if (dataType === 'content') {
    // const src = target.getAttribute('src');
    const parentNode = target.parentNode.parentNode;
    const domId = parentNode.getAttribute('id').replace('tab_', '');

    // 画像右クリックメニュー
    // とりあえずタブと挙動一緒にしておく
    handleTabRightClick(e, domId);
  }
};
