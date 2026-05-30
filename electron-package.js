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

// 残す Chromium ロケール。.pak は Chromium 自身の UI 文字列 (右クリックメニュー
// やエラーページ等) の翻訳であり、ページ本文 (= コメント) の表示には影響しない。
// ja / en があれば日本語環境 + 英語 fallback で実用上問題ないので、その他の
// 56 言語分 (~30MB) を packaging 時に削除する。
const KEEP_LOCALE_PREFIXES = ['ja', 'en'];

// koffi は build/koffi/<platform>_<arch>/ にプラットフォーム毎の prebuilt が
// 全部入っている (18 個 × ~1.5MB = ~27MB)。実行ターゲット以外は不要なので、
// 対象 platform_arch 以外の prebuild ディレクトリを削除する。
const trimChromiumLocales = (buildPath, electronVersion, platform, arch, callback) => {
  // buildPath = <stagingPath>/resources/app  →  locales は <stagingPath>/locales
  const localesDir = path.join(buildPath, '..', '..', 'locales');
  try {
    if (!fs.existsSync(localesDir)) {
      return callback();
    }
    let removed = 0;
    let kept = 0;
    for (const name of fs.readdirSync(localesDir)) {
      const lang = name.replace(/\.pak$/, '');
      const keep = KEEP_LOCALE_PREFIXES.some((p) => lang === p || lang.startsWith(`${p}-`));
      if (!keep) {
        fs.unlinkSync(path.join(localesDir, name));
        removed += 1;
      } else {
        kept += 1;
      }
    }
    console.log(`[electron-package] trimmed Chromium locales: kept=${kept} removed=${removed}`);
    callback();
  } catch (err) {
    callback(err);
  }
};

const trimKoffiPrebuilds = (buildPath, electronVersion, platform, arch, callback) => {
  const koffiDir = path.join(buildPath, 'node_modules', 'koffi', 'build', 'koffi');
  try {
    if (!fs.existsSync(koffiDir)) {
      return callback();
    }
    const keepDir = `${platform}_${arch}`;
    let removed = 0;
    let kept = 0;
    for (const name of fs.readdirSync(koffiDir)) {
      const full = path.join(koffiDir, name);
      if (!fs.statSync(full).isDirectory()) continue;
      if (name === keepDir) {
        kept += 1;
      } else {
        fs.rmSync(full, { recursive: true, force: true });
        removed += 1;
      }
    }
    console.log(`[electron-package] trimmed koffi prebuilds: kept=${kept} (${keepDir}) removed=${removed}`);
    callback();
  } catch (err) {
    callback(err);
  }
};

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
      afterCopy: [trimKoffiPrebuilds, trimChromiumLocales],
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
