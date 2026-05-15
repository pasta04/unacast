import electron from 'electron';
import { Menu, MenuItem, getCurrentWindow } from '@electron/remote';

const mainContextMenuInText = (target: HTMLInputElement) => {
  const menu = new Menu();
  menu.append(
    new MenuItem({
      label: 'Cut',
      type: 'normal',
      click: () => {
        const text = window.getSelection()?.toString() ?? '';
        if (!text) return;
        electron.clipboard.writeText(text);
        target.value = target.value.replace(text, '');
      },
    }),
  );
  menu.append(
    new MenuItem({
      label: 'Copy',
      type: 'normal',
      click: () => {
        const text = window.getSelection()?.toString() ?? '';
        if (!text) return;
        electron.clipboard.writeText(text);
      },
    }),
  );
  menu.append(
    new MenuItem({
      label: 'Paste',
      type: 'normal',
      click: () => {
        const text = electron.clipboard.readText();
        target.value = text;
      },
    }),
  );
  return menu;
};

const mainContextMenu = new Menu();
mainContextMenu.append(
  new MenuItem({
    label: '最前面表示',
    type: 'checkbox',
    checked: false,
    click: (e) => {
      getCurrentWindow().setAlwaysOnTop(e.checked);
    },
  }),
);

export const registerContextMenu = () => {
  document.oncontextmenu = (e) => {
    e.preventDefault();
    const nodeName = (e.target as HTMLInputElement).nodeName;
    if (nodeName === 'INPUT' || nodeName === 'TEXTAREA') {
      mainContextMenuInText(e.target as HTMLInputElement).popup({ window: getCurrentWindow(), x: e.x, y: e.y });
    } else {
      mainContextMenu.popup({ window: getCurrentWindow(), x: e.x, y: e.y });
    }
  };
};
