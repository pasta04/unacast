/**
 * アイコン表示に関するモジュール
 */
import fs from 'fs';
import path from 'path';
import electronlog from 'electron-log';
const log = electronlog.scope('ReadIcons');

class CommentIcons {
  bbsIconDir: string = path.resolve(__dirname, `../public/img/random/`);
  bbsIconList: string[] = readDir(this.bbsIconDir);
  youtubeIconDir: string = '';
  youtubeIconList: string[] = [];
  twitchIconDir: string = path.resolve(__dirname, `../public/img/`);
  twitchIconList: string[] = ['twitch.png'];
  niconicoIconDir: string = path.resolve(__dirname, `../public/img/`);
  niconicoIconList: string[] = ['niconico.png'];
  sttIconDir: string = '';
  sttIconList: string[] = [];

  constructor(arg: { bbs: string; youtube: string; twitch: string; niconico: string; stt: string }) {
    if (fs.existsSync(arg.bbs)) {
      const list = readDir(arg.bbs);
      if (list.length > 0) {
        this.bbsIconList = list;
        this.bbsIconDir = arg.bbs;
      }
    }

    if (fs.existsSync(arg.youtube)) {
      const list = readDir(arg.youtube);
      if (list.length > 0) {
        this.youtubeIconList = list;
        this.youtubeIconDir = arg.youtube;
      }
    }
    if (fs.existsSync(arg.twitch)) {
      const list = readDir(arg.twitch);
      if (list.length > 0) {
        this.twitchIconList = list;
        this.twitchIconDir = arg.twitch;
      }
    }
    if (fs.existsSync(arg.niconico)) {
      const list = readDir(arg.niconico);
      if (list.length > 0) {
        this.niconicoIconList = list;
        this.niconicoIconDir = arg.niconico;
      }
    }
    if (fs.existsSync(arg.stt)) {
      const list = readDir(arg.stt);
      if (list.length > 0) {
        this.sttIconList = list;
        this.sttIconDir = arg.stt;
      }
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
      icon = `/bbs/${iconPath}`;
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
      icon = `/youtube/${iconPath}`;
    } catch (e) {
      log.error(e);
    }
    return icon;
  };
  getYoutubeLogo = () => {
    const icon = `/img/youtube.png`;
    return icon;
  };
  getTwitch = () => {
    let icon = '';
    try {
      const num = Math.floor(this.twitchIconList.length * Math.random());
      const iconPath = this.twitchIconList[num];
      icon = `/twitch/${iconPath}`;
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
      icon = `/niconico/${iconPath}`;
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
      icon = `/stt/${iconPath}`;
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
      // iconFileList.push(path.join(imgDir, target as any) as any);
      iconFileList.push(target as any);
    }
  });

  return iconFileList;
};

export default CommentIcons;
