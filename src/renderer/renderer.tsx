import * as React from 'react';
import { createRoot } from 'react-dom/client';
import electronlog from 'electron-log/renderer';
import { App } from './app/App';
import { useAppStore } from './app/store';
import { registerIpcSubscribers } from './app/ipc';
import { registerContextMenu } from './app/contextMenu';

const log = electronlog.scope('renderer-main');

const bootstrap = () => {
  log.debug('React renderer bootstrap');

  // store の値を globalThis.config に同期しておく（既存の chat.html などが globalThis.config を参照しているため）。
  (globalThis as any).config = useAppStore.getState().config;
  useAppStore.subscribe((state) => {
    (globalThis as any).config = state.config;
  });

  registerIpcSubscribers();
  registerContextMenu();

  const container = document.getElementById('root');
  if (!container) {
    log.error('React root element not found');
    return;
  }
  const root = createRoot(container);
  root.render(<App />);
};

document.addEventListener('DOMContentLoaded', bootstrap);

require('./azureStt');
