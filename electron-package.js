const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

if (process.argv.length < 3) {
  console.log('specify platform!  win32, darwin');
  return;
}

const PLATFORM = process.argv[2];
const ASAR = process.argv[3] ? `--${process.argv[3]}` : '';

// electron-packager の --ignore は new RegExp(pattern) で評価され、
// プロジェクトルートからの絶対パス(先頭 / 付き)に対して test() される。
// node_modules 配下にも src/ や dist/ など同名ディレクトリがあるため、
// プロジェクト直下のものだけを対象にしたいパターンは ^/ で先頭固定する。
const execParam = `
npx electron-packager ./ unacast --platform=${PLATFORM} --arch=x64 --overwrite --prune=true --icon=icon.ico ${ASAR}
    --ignore="^/\\.vscode($|/)"
    --ignore="^/\\.github($|/)"
    --ignore="^/dist/.+\\.map$"
    --ignore="^/out($|/)"
    --ignore="^/documents($|/)"
    --ignore="^/build-mac($|/)"
    --ignore="^/build-win($|/)"
    --ignore="^/unacast-win32-x64($|/)"
    --ignore="^/unacast-darwin-x64($|/)"
    --ignore="^/src($|/)"
    --ignore="^/\\.eslintrc\\.json$"
    --ignore="^/eslint\\.config\\.mjs$"
    --ignore="^/\\.gitignore$"
    --ignore="^/\\.prettierrc\\.json$"
    --ignore="^/electron-package\\.js$"
    --ignore="^/electron\\.vite\\.config\\.ts$"
    --ignore="^/README\\.md$"
    --ignore="^/tsconfig\\.json$"
    --ignore="^/package-lock\\.json$"
`;

const expectedOutDir = `unacast-${PLATFORM}-x64`;
const cmd = execParam.replace(/\n/g, ' ').trim();

console.log('[electron-package] node:', process.version);
console.log('[electron-package] cwd:', process.cwd());
console.log('[electron-package] expected output dir:', path.resolve(expectedOutDir));
console.log('[electron-package] command:', cmd);

try {
  // DEBUG=electron-packager で @electron/packager 内部の debug() ログを有効化し、
  // どこまで処理が進んで何が起きたかを直接観測する。
  execSync(cmd, {
    stdio: 'inherit',
    env: { ...process.env, DEBUG: 'electron-packager*' },
  });
  console.log('[electron-package] execSync returned without throwing');
} catch (e) {
  console.error('[electron-package] electron-packager failed:', e.message);
  console.error('[electron-package] status:', e.status, 'signal:', e.signal);
  process.exit(typeof e.status === 'number' ? e.status : 1);
}

const exists = fs.existsSync(expectedOutDir);
console.log(`[electron-package] ${expectedOutDir} exists:`, exists);
if (!exists) {
  console.log('[electron-package] cwd contents:');
  for (const entry of fs.readdirSync(process.cwd())) {
    console.log('  -', entry);
  }
  console.error('[electron-package] electron-packager exited 0 but did not create the output directory');
  process.exit(1);
}
