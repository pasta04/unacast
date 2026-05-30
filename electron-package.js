// 子プロセス起動 + npx 経由で `@electron/packager` の bin を呼ぶ従来方式は、
// bin 側が `cli.run()` を await していない (fire-and-forget) ため、
// CI 環境 (Node 24 + Windows Server 2025) で extract-zip 直後に
// イベントループが空とみなされて Node が静かに exit 0 してしまう事象が発生。
// 直接 API を await することで、Promise を確実にこのプロセスのルートに繋ぎ、
// 失敗時の throw / 完了時の結果 / イベントループ終了の理由を観測可能にする。
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

console.log('[electron-package] node:', process.version);
console.log('[electron-package] cwd:', process.cwd());
console.log('[electron-package] expected output dir:', expectedOutDir);

process.on('beforeExit', (code) => {
  console.log(`[electron-package] beforeExit code=${code}`);
});
process.on('exit', (code) => {
  console.log(`[electron-package] exit code=${code}`);
});
process.on('uncaughtException', (err) => {
  console.error('[electron-package] uncaughtException:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('[electron-package] unhandledRejection:', reason);
  process.exit(1);
});

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
    console.log('[electron-package] packager returned, appPaths =', appPaths);
    if (!appPaths || appPaths.length === 0) {
      console.error('[electron-package] packager returned empty appPaths');
      process.exit(1);
    }
    if (!fs.existsSync(expectedOutDir)) {
      console.error(`[electron-package] ${expectedOutDir} does not exist after packager success`);
      process.exit(1);
    }
    console.log('[electron-package] done.');
  } catch (e) {
    console.error('[electron-package] packager threw:', e);
    process.exit(1);
  }
})();
