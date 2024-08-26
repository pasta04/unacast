import axios, { AxiosRequestConfig } from 'axios';
import iconv from 'iconv-lite'; // 文字コード変換用パッケージ
import express from 'express';
import bodyParser from 'body-parser'; // jsonパーサ
import https from 'https';
const router = express.Router();
import electronlog from 'electron-log';
const log = electronlog.scope('bbs');

import { createDom } from './startServer';
import { judgeAaMessage } from './util';
import ReadSitaraba, { readBoard as readBoardShitaraba, postRes as postResShitaraba } from './readBBS/ReadSitaraba'; // したらば読み込み用モジュール
import Read5ch, { readBoard as readBoard5ch, postRes as postRes5ch } from './readBBS/Read5ch'; // 5ch互換板読み込み用モジュール
const sitaraba = new ReadSitaraba();
const read5ch = new Read5ch();

const instance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});

// 掲示板読み込みモジュール、一度決定したら使いまわすためにグローバル宣言
let bbsModule: ReadSitaraba | ReadSitaraba = null as any;

// リクエストのbodyをパース下りエンコードしたりするためのやつ
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

/**
 * ブラウザからの初期処理リクエスト
 */
router.get('/', async (req, res, next) => {
  log.info('access /');
  // リクエストからURLとレス番号を取得する
  const threadUrl: string = globalThis.config.url;
  // レス番号取得
  const resNum: number = globalThis.config.resNumber ? Number(globalThis.config.resNumber) : NaN;
  log.info(`threadUrl=${threadUrl} resNum=${resNum}`);
  if (!resNum) {
    res.send(JSON.stringify([]));
    return;
  }

  res.header('Content-Type', 'application/json; charset=UTF-8');

  let result = await getRes(threadUrl, resNum);

  result = result.filter((item) => item.from !== 'system');
  const doms = judgeAaMessage(result).map((item) => createDom(item, 'server', item.isAA));
  res.send(JSON.stringify(doms));
});

/**
 * 掲示板のレスを取得する
 * @param threadUrl スレのURL
 * @param resNum この番号以降を取得する。指定しない場合は全件取得
 */
export const getRes = async (threadUrl: string, resNum: number): Promise<UserComment[]> => {
  try {
    if(!threadUrl) return [];
    
    // リクエストURLを解析し、使用するモジュールを変更する
    bbsModule = analysBBSName(threadUrl) as any;

    // 選択したモジュールでレス取得処理を行う
    const response = await bbsModule.read(threadUrl, resNum);
    globalThis.electron.threadConnectionError = 0;
    log.info(`fetch ${threadUrl} resNum = ${resNum}, result = ${response.length} lastResNum=${response.length > 0 ? response[response.length - 1].number : '-'}`);

    return response.map((res) => {
      return {
        ...res,
        imgUrl: globalThis.electron.iconList.getBbs(),
      };
    });
  } catch (e) {
    log.error(e);
    // エラー回数が規定回数以上かチェックして、超えてたら通知する
    if (globalThis.config.notifyThreadConnectionErrorLimit > 0) {
      globalThis.electron.threadConnectionError += 1;
      if (globalThis.electron.threadConnectionError >= globalThis.config.notifyThreadConnectionErrorLimit) {
        log.info('エラー回数超過');

        globalThis.electron.threadConnectionError = 0;
        return [
          {
            name: 'unacastより',
            imgUrl: './img/unacast.png',
            text: '掲示板が規定回数通信エラーになりました。設定を見直すか、掲示板URLを変更してください。',
            from: 'system',
          },
        ];
      }
    }
    return [];
  }
};

/*
 * URLをみてどこのBBSか判定して使用するモジュールを返却する
 */
const analysBBSName = (threadUrl: string) => {
  // したらばドメイン名
  const sitarabaDomain = 'jbbs.shitaraba.net';

  if (threadUrl.indexOf(sitarabaDomain) !== -1) {
    // URLにしたらばドメイン名が入ってればしたらば
    return sitaraba;
  }
  // どこにも該当しなかったらとりあえず5chで
  // この辺も対応ドメインリストとか作ってちゃんと判定したほうがよさそう
  return read5ch;
};

export const getThreadList = async (boardUrl: string) => {
  const sitarabaDomain = 'jbbs.shitaraba.net';
  if (boardUrl.indexOf(sitarabaDomain) !== -1) {
    // URLにしたらばドメイン名が入ってればしたらば
    //
    return await readBoardShitaraba(boardUrl);
  } else {
    return await readBoard5ch(boardUrl);
  }
};

/** レスを投稿 */
export const postResponse = async (hostname: string, threadNumber: string, boardId: string, message: string) => {
  log.info(`[postResponse] ${hostname} ${threadNumber} ${boardId}`);

  const sitarabaDomain = 'jbbs.shitaraba.net';
  if (hostname.indexOf(sitarabaDomain) !== -1) {
    // URLにしたらばドメイン名が入ってればしたらば
    return await postResShitaraba(hostname, threadNumber, boardId, message);
  } else {
    return await postRes5ch(hostname, threadNumber, boardId, message);
  }
};

/**
 * スレのURLから板情報を取得
 * @param threadUrl スレのURL
 */
export const threadUrlToBoardInfo = async (threadUrl: string) => {
  const sitarabaDomain = 'jbbs.shitaraba.net';

  const result: {
    status: 'ok' | 'ng';
    boardUrl: string;
    boardName: string;
  } = {
    status: 'ng',
    boardUrl: threadUrl,
    boardName: '★取得失敗★',
  };

  let boardUrl = '';

  // 表記ゆれ補正
  let tempUrl = threadUrl;
  tempUrl = tempUrl.replace(/\/l\d+$/, '/');

  if (!tempUrl.match(/.*\/$/)) {
    tempUrl += '/';
  }

  let encoding = '';

  if (tempUrl.indexOf(sitarabaDomain) !== -1) {
    // スレ: https://jbbs.shitaraba.net/bbs/read.cgi/game/51638/1581839266/
    // 板: https://jbbs.shitaraba.net/game/51638/
    // 設定: https://jbbs.shitaraba.net/bbs/api/setting.cgi/game/51638/

    encoding = 'EUC-JP';

    // 板かスレか判定
    if (tempUrl.match('read.cgi')) {
      // スレ
      tempUrl = tempUrl.replace('jbbs.shitaraba.net/bbs/read.cgi/', '').replace(/https?:\/\//, '');
      tempUrl = (tempUrl.match(/(.+)\/.+\/$/) as any)[1] + '/';

      boardUrl = `http://jbbs.shitaraba.net/${tempUrl}`;
      tempUrl = `http://jbbs.shitaraba.net/bbs/api/setting.cgi/${tempUrl}`;
    } else {
      // 板
      boardUrl = tempUrl;
      tempUrl = tempUrl.replace('jbbs.shitaraba.net/', '').replace(/https?:\/\//, '');
      tempUrl = `http://jbbs.shitaraba.net/bbs/api/setting.cgi/${tempUrl}`;
    }
  } else {
    // スレ: https://bbs.jpnkn.com/test/read.cgi/pasta04/1586794623/
    // 板: https://bbs.jpnkn.com/pasta04/
    // 設定: https://bbs.jpnkn.com/pasta04/SETTING.TXT

    encoding = 'SHIFT-JIS';

    // 板かスレか判定
    if (tempUrl.match(/test\/read.cgi\/.+\/.+\//)) {
      // スレ
      tempUrl = `${(tempUrl.replace('test/read.cgi/', '').match(/(.+)\/.+\/$/) as any)[1]}/`;
      boardUrl = tempUrl;
      tempUrl = `${tempUrl}SETTING.TXT`;
    } else {
      // 板
      boardUrl = tempUrl;
      tempUrl = `${tempUrl}SETTING.TXT`;
    }
  }

  log.debug(`[SETTING.TXT] ${tempUrl} [BoardUrl] ${boardUrl}`);
  try {
    const options: AxiosRequestConfig = {
      url: tempUrl,
      method: 'GET',
      timeout: 3 * 1000,
      responseType: 'arraybuffer',
    };

    const response = (await instance<ArrayBuffer>(options));
    if (response.status < 400) {
      const str = iconv.decode(Buffer.from(response.data as any), encoding);

      str.split(/\n/g).map((text: string) => {
        const matched = text.match(/BBS_TITLE=(.+)/);
        if (matched) {
          result.boardName = matched[1];
          result.boardUrl = boardUrl;
          result.status = 'ok';
        }
      });
    }
  } catch (e: any) {
    log.error('なんかエラー error=' + JSON.stringify(e.message));
  }

  log.info(JSON.stringify(result));
  return result;
};

export default router;
