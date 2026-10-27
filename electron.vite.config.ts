import { resolve } from 'path';
import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import renderer from 'vite-plugin-electron-renderer';

export default defineConfig({
  main: {
    build: {
      outDir: 'dist/main',
      // dependencies は既定で外部モジュール扱い (require のまま残す)。
      // src 配下の事前バンドル済み CJS (googletrans.js) は Rolldown がそのまま扱う
      rolldownOptions: {
        input: {
          index: resolve(__dirname, 'src/main/main.ts'),
        },
        output: {
          format: 'cjs',
          entryFileNames: '[name].js',
        },
      },
    },
  },
  renderer: {
    root: '.',
    publicDir: resolve(__dirname, 'public'),
    server: {
      fs: {
        // 開発時、プロジェクト全体からのインポートを許可（src/main/const.ts などの参照向け）
        allow: ['..', '.'],
      },
    },
    build: {
      outDir: 'dist/renderer',
      rolldownOptions: {
        input: {
          index: resolve(__dirname, 'src/html/index.html'),
          chat: resolve(__dirname, 'src/html/chat.html'),
          translate: resolve(__dirname, 'src/html/translate.html'),
          imagePreview: resolve(__dirname, 'src/html/imagePreview.html'),
          threadBrowser: resolve(__dirname, 'src/html/threadBrowser.html'),
        },
      },
    },
    plugins: [
      react(),
      // nodeIntegration 有効の renderer で、electron と Node 組み込みモジュールを require のまま残す
      renderer(),
    ],
  },
});
