import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import renderer from 'vite-plugin-electron-renderer';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist/main',
      commonjsOptions: {
        // src 配下の事前バンドル済み CJS ファイル(googletrans.js, niconama/node.js 等)も
        // rollup の commonjs プラグインを通して扱う
        include: [/node_modules/, /\.cjs$/, /src[\\/]main[\\/].*\.js$/],
        transformMixedEsModules: true,
      },
      rollupOptions: {
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
      rollupOptions: {
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
      renderer({
        // nodeIntegration を有効にしたまま、Node 組み込みモジュールと
        // Electron 関連の依存を require のままにする
        nodeIntegration: true,
      }),
    ],
  },
});
