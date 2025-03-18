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
    --ignore="dist/index.js.map"
    --ignore="documents"
    --ignore=".eslintrc.json"
    --ignore=".gitignore"
    --ignore=".prettierrc.json"
    --ignore="build-mac"
    --ignore="build-win"
    --ignore="electron-package.js"
    --ignore="README.md"
    --ignore="tsconfig.json"
    --ignore="webpack.config.js"
    --ignore="package-lock.json"
`;

execSync(execParam.replace(/\n/g, ' '));
