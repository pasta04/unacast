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
npx electron-packager ./ unacast --platform=${PLATFORM} --arch=x64 --overwrite --icon=icon.ico ${ASAR}
    --ignore="^/\\.vscode($|/)"
    --ignore="^/\\.github($|/)"
    --ignore="^/dist($|/)"
    --ignore="^/out/.+\\.map$"
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

execSync(execParam.replace(/\n/g, ' '));
