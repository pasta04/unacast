// @electron/packager の `packager()` 関数をこのプロセスから直接 await する。
// 旧実装は execSync で npx 経由の子プロセスを叩いていたが、
// @electron/packager の bin が `cli.run()` を await していない (fire-and-forget)
// ため、子プロセスが silent exit したときに親が exit 0 と誤認する弱点があった。
// 直接 await すれば Promise が本プロセスのルートに繋がり、
// 失敗時の throw / 完了時の結果がそのまま観測できる。
const path = require('path');
const fs = require('fs');
const { packager } = require('@electron/packager');

if (process.argv.length < 3) {
  console.log('specify platform!  win32, darwin');
  return;
}

const PLATFORM = process.argv[2];
const ASAR = process.argv[3] === 'asar';

const ignore = [
  '^/\\.vscode($|/)',
  '^/\\.github($|/)',
  '^/dist/.+\\.map$',
  '^/out($|/)',
  '^/documents($|/)',
  '^/build-mac($|/)',
  '^/build-win($|/)',
  '^/unacast-win32-x64($|/)',
  '^/unacast-darwin-x64($|/)',
  '^/src($|/)',
  '^/\\.eslintrc\\.json$',
  '^/eslint\\.config\\.mjs$',
  '^/\\.gitignore$',
  '^/\\.prettierrc\\.json$',
  '^/electron-package\\.js$',
  '^/electron\\.vite\\.config\\.ts$',
  '^/README\\.md$',
  '^/tsconfig\\.json$',
  '^/package-lock\\.json$',
];

const expectedOutDir = path.resolve(`unacast-${PLATFORM}-x64`);

(async () => {
  try {
    const appPaths = await packager({
      dir: './',
      name: 'unacast',
      platform: PLATFORM,
      arch: 'x64',
      overwrite: true,
      prune: true,
      icon: 'icon.ico',
      asar: ASAR,
      ignore,
    });
    if (!appPaths || appPaths.length === 0) {
      console.error('[electron-package] packager returned empty appPaths');
      process.exit(1);
    }
    if (!fs.existsSync(expectedOutDir)) {
      console.error(`[electron-package] ${expectedOutDir} does not exist after packager success`);
      process.exit(1);
    }
    console.log('[electron-package] wrote app to:', appPaths[0]);
  } catch (e) {
    console.error('[electron-package] packager threw:', e);
    process.exit(1);
  }
})();
