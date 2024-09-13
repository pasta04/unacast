/**
 * アイコン表示に関するモジュール
 */
import fs from 'fs';
import path from 'path';
import electronlog from 'electron-log';
const log = electronlog.scope('ReadIcons');

class CommentIcons {
  bbsIconList: string[] = [];
  youtubeIconList: string[] = [];
  twitchIconList: string[] = [path.resolve(__dirname, `../public/img/twitch.png`)];
  niconicoIconList: string[] = [path.resolve(__dirname, `../public/img/niconico.png`)];
  sttIconList: string[] = [];

  constructor(arg: { bbs: string; youtube: string; twitch: string; niconico: string; stt: string }) {
    const randomDir = fs.existsSync(arg.bbs) ? arg.bbs : path.resolve(__dirname, `../public/img/random/`);
    log.debug('loadRandomDir = ' + randomDir);
    this.bbsIconList = readDir(randomDir);

    if (fs.existsSync(arg.youtube)) {
      this.youtubeIconList = readDir(arg.youtube);
    }
    if (fs.existsSync(arg.twitch)) {
      const list = readDir(arg.twitch);
      if (list.length > 0) this.twitchIconList = list;
    }
    if (fs.existsSync(arg.niconico)) {
      const list = readDir(arg.niconico);
      if (list.length > 0) this.niconicoIconList = list;
    }
    if (fs.existsSync(arg.stt)) {
      const list = readDir(arg.stt);
      if (list.length > 0) this.sttIconList = list;
    }

    log.debug(this.bbsIconList);
    log.debug(this.youtubeIconList);
    log.debug(this.twitchIconList);
    log.debug(this.niconicoIconList);
    log.debug(this.sttIconList);
  }

  // /**
  //  * アイコンランダム表示機能（デフォルト）
  //  * 起動時に作成したアイコンリストからランダムで1つ取得
  //  */
  // getRandomIcons = () => {
  //   let iconPath = '';
  //   try {
  //     const dirName = './img/random/';
  //     // リストからランダム取得
  //     //  const size = randomIconList.size;
  //     const num = Math.floor(bbsIconList.length * Math.random());
  //     iconPath = dirName + bbsIconList[num];
  //   } catch (e) {
  //     log.error(e);
  //   }
  //   return iconPath;
  // };
  getBbs = () => {
    let icon = '';
    try {
      const num = Math.floor(this.bbsIconList.length * Math.random());
      const iconPath = this.bbsIconList[num];
      icon = fs.readFileSync(iconPath, { encoding: 'base64' });
    } catch (e) {
      log.error(e);
    }
    return icon;
  };
  getYoutube = () => {
    let icon = '';
    try {
      const num = Math.floor(this.youtubeIconList.length * Math.random());
      const iconPath = this.youtubeIconList[num];
      icon = fs.readFileSync(iconPath, { encoding: 'base64' });
    } catch (e) {
      log.error(e);
    }
    return icon;
  };
  getYoutubeLogo = () => {
    let icon = '';
    try {
      const iconPath = path.resolve(__dirname, `../public/img/youtube.png`);
      icon = fs.readFileSync(iconPath, { encoding: 'base64' });
    } catch (e) {
      log.error(e);
    }
    return icon;
  };
  getTwitch = () => {
    let icon = '';
    try {
      const num = Math.floor(this.twitchIconList.length * Math.random());
      const iconPath = this.twitchIconList[num];
      icon = fs.readFileSync(iconPath, { encoding: 'base64' });
    } catch (e) {
      log.error(e);
    }
    return icon;
  };

  getNiconico = () => {
    let icon = '';
    try {
      const num = Math.floor(this.niconicoIconList.length * Math.random());
      const iconPath = this.niconicoIconList[num];
      icon = fs.readFileSync(iconPath, { encoding: 'base64' });
    } catch (e) {
      log.error(e);
    }
    return icon;
  };
  getStt = () => {
    let icon = '';
    // 専用アイコンがなければ BBS のアイコンを使う
    const list = this.sttIconList.length !== 0 ? this.sttIconList : this.bbsIconList;
    try {
      const num = Math.floor(list.length * Math.random());
      const iconPath = list[num];
      icon = fs.readFileSync(iconPath, { encoding: 'base64' });
    } catch (e) {
      log.error(e);
    }
    return icon;
  };
}

const readDir = (imgDir: string): string[] => {
  const iconFileList: string[] = [];
  //  指定したディレクトリのアイコン取得
  const files = fs.readdirSync(imgDir, { withFileTypes: true });

  //pngファイルのみ返却リストに格納する
  files.forEach((file) => {
    // asar圧縮するとfileが文字列になる。開発環境だとfileオブジェクトになる
    const target = typeof file.name !== 'string' ? file : file.name;
    const regx = /.*\.png$/.test(target as any);
    if (regx) {
      iconFileList.push(path.join(imgDir, target as any) as any);
    }
  });

  return iconFileList;
};

export default CommentIcons;
