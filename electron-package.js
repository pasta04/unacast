const { execSync } = require('child_process');

if (process.argv.length < 3) {
  console.log('specify platform!  win32, darwin');
  return;
}

const PLATFORM = process.argv[2];
const ASAR = process.argv[3] ? `--${process.argv[3]}` : '';

const execParam = `
npx electron-packager ./ unacast --platform=${PLATFORM} --arch=x64 --overwrite --icon=icon.ico ${ASAR}
    --ignore=".vscode"
    --ignore="out/.*\\.map$"
    --ignore="documents"
    --ignore=".eslintrc.json"
    --ignore="eslint.config.mjs"
    --ignore=".gitignore"
    --ignore=".prettierrc.json"
    --ignore="build-mac"
    --ignore="build-win"
    --ignore="electron-package.js"
    --ignore="electron.vite.config.ts"
    --ignore="README.md"
    --ignore="tsconfig.json"
    --ignore="package-lock.json"
    --ignore="src"
`;

execSync(execParam.replace(/\n/g, ' '));
