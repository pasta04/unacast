/**
 * したらば読み込み用モジュール
 */
import axios, { AxiosRequestConfig } from 'axios';
import https from 'https';
import iconv from 'iconv-lite'; // 文字コード変換用パッケージ
import electronlog from 'electron-log';
const log = electronlog.scope('bbs shitaraba');
export type ShitarabaResponse = ReturnType<typeof purseResponse>;
import encoding from 'encoding-japanese';

/** スレ一覧を読み込む */
export const readBoard = async (boardUrl: string) => {
  const requestUrl = `${boardUrl}subject.txt`;
  log.debug(`[readBoard] ${requestUrl}`);

  const list: ReturnType<typeof parseThreadList>[] = [];

  //リクエストオプションの設定
  const options: AxiosRequestConfig = {
    url: requestUrl,
    method: 'GET',
    timeout: 3 * 1000,
    responseType: 'arraybuffer',
  };

  //掲示板へのリクエスト実行
  try {
    const response = await axios(options);

    // レスポンスヘッダ表示
    // const headers: { [key: string]: string } = response.headers;
    // gzipで取得出来たら解凍処理も入れる

    // UTF-8に変換
    const str = iconv.decode(Buffer.from(response.data as any), 'EUC-JP');
    // パースして格納
    list.push(
      ...str
        .split('\n')
        .filter((item) => item)
        .map((line) => parseThreadList(boardUrl, line)),
    );
  } catch (error) {
    log.error('5ch系BBS板取得APIリクエストエラー、message=' + (error as any).message);
    throw new Error('connection error');
  }

  return list;
};

/**
 * レスを投稿する
 * @param hostname ホスト名。https://hogehoge/
 * @param threadNumber スレ番号 12345678
 * @param boardId 板ID pasta04
 * @param message 投稿文
 */
export const postRes = async (hostname: string, threadNumber: string, boardId: string, message: string) => {
  // Shift-JISに変換し、urlエンコードする
  const unicodeArray: number[] = [];
  for (let i = 0; i < message.length; i++) {
    unicodeArray.push(message.charCodeAt(i));
  }
  const sjisArray = encoding.convert(unicodeArray, {
    to: 'EUCJP',
    from: 'UNICODE',
  });
  const encodedKeyword = encoding.urlEncode(sjisArray as any);

  /** gameとか */
  const dir = boardId.split('/')[0];
  /** 番号 */
  const bbs = boardId.split('/')[1];

  const result = await axios.post(
    `${hostname}bbs/write.cgi/${boardId}/${threadNumber}/`,
    `dir=${dir}&bbs=${bbs}&key=${threadNumber}&time=${new Date().getTime()}&name=&MAIL=sage&MESSAGE=${encodedKeyword}`,
    {
      headers: {
        Accept: '*/*',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept-Encoding': 'gzip, deflate, br',
        Referer: `${hostname}${boardId}/`,
        Cookie: 'MAIL="sage"; NAME=""',
      },
      withCredentials: true,
    },
  );
};

class ReadSitaraba {
  /**
   * レス読み込み
   * @description 引数で指定した板からレスを読む。
   * @description レス番号を指定していない場合は全件取得
   * @param threadUrl スレURL
   * @param resNum レス番号
   */
  read = async (threadUrl: string, resNum: number) => {
    //掲示板へのリクエスト実行
    // log.info('[ReadSitaraba.js]したらばレス取得API呼び出し開始');

    // リクエストURL作成
    // URLの「read.cgi」を「rawmode.cgi」に変換
    let requestUrl = threadUrl.replace('read.cgi', 'rawmode.cgi');
    if (resNum > 0) {
      // レス番号がある場合レス番号以降を取得
      requestUrl += resNum + '-';
    } else {
      // レス番号がない場合全県取得
      requestUrl += '';
    }

    // リクエストオプションの設定
    // log.info(requestUrl);
    const options: AxiosRequestConfig = {
      url: requestUrl,
      method: 'GET',
      responseType: 'arraybuffer',
      timeout: 3 * 1000,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    };
    try {
      const response = await axios(options);
      // UTF-8に変換
      const str = decodeUnicodeStr(iconv.decode(Buffer.from(response.data as any), 'EUC-JP'));

      const responseJson = parseNewResponse(str);
      return responseJson;
    } catch (e) {
      // 通信エラー
      throw new Error(`通信エラー: ${requestUrl} stack=${e}`);
    }
  };
}

/**
 * 取得したレスポンス（複数）のパース
 * @param res
 */
const parseNewResponse = (res: string) => {
  //結果を格納する配列
  const result: ReturnType<typeof purseResponse>[] = [];

  // 新着レスを改行ごとにSplitする
  const resArray = res.split(/\r\n|\r|\n/);
  // 1行ごとにパースする
  resArray.forEach((value) => {
    // パースメソッド呼び出し
    if (value.length > 0) {
      result.push(purseResponse(value));
    }
  });
  return result;
};

/**
 * スレ一覧のパース
 * @param String // res レスポンス1レス
 * @param Integer // num レス番（0スタート）
 */
const parseThreadList = (boardUrl: string, subjectLine: string) => {
  //APIの返却値を<>で分割
  //レスの要素
  //0:dat名
  //1:スレタイ（レス数）
  const splitRes = subjectLine.split(',');
  // log.debug(splitRes);
  const datNum = splitRes[0].replace('.cgi', '');

  const hostname = boardUrl.match(/^https?:\/\/.+?\//)?.[0] ?? '';
  const boardName = boardUrl.replace(hostname, '');
  const url = `${hostname}bbs/read.cgi/${boardName}${datNum}/`;
  // log.info(`${hostname}  ${boardName} ${datNum}`);

  const titleTemp = splitRes[1];

  const name: string = titleTemp.match(/(.*?)\(\d+\)$/)?.[1] ?? '★取得失敗★';
  const resNum = Number(titleTemp.match(/\(\d+\)$/)?.[0].replace(/\(|\)/g, ''));

  // オブジェクトを返却
  return {
    url,
    name,
    resNum,
  };
};

/**
 * レスポンスのパース
 * Jsonオブジェクトを返却する
 * @param String // res レスポンス1レス
 */
const purseResponse = (res: string) => {
  //APIの返却値を<>で分割
  //レスの要素
  //0:レス番号
  //1:名前
  //2:メアド
  //3:日付
  //4:本文
  //5:スレタイ
  //6:ID
  const splitRes = res.split('<>');
  const resJson: UserComment = {
    number: splitRes[0],
    name: splitRes[1],
    email: splitRes[2],
    date: splitRes[3],
    text: splitRes[4],
    threadTitle: splitRes[5] ? splitRes[5] : '',
    id: splitRes[6],
    imgUrl: '',
    from: 'bbs',
  };
  // オブジェクトを返却
  return resJson;
};

/** したらばだけは全角ダッシュがUnicode文字列として格納されるので変換する */
const decodeUnicodeStr = (str: string) => {
  return str.replace(/&#65374;/g, '～');
};

export default ReadSitaraba;
