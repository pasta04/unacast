const { execSync } = require('child_process');

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

// CI で electron-packager が黙って失敗する事象を可視化するため、
// stdio: 'inherit' で子プロセスの出力を直接親 (CI ログ) に流し、
// 例外発生時はメッセージと exit code を明示してから非ゼロで終了する。
try {
  execSync(execParam.replace(/\n/g, ' '), { stdio: 'inherit' });
} catch (e) {
  console.error('[electron-package] electron-packager failed:', e.message);
  process.exit(typeof e.status === 'number' ? e.status : 1);
}
