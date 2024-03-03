/**
 * 5ch互換BBS読み込み用モジュール
 */
import axios, { AxiosRequestConfig } from 'axios';
import iconv from 'iconv-lite'; // 文字コード変換用パッケージ
import electronlog from 'electron-log';
const log = electronlog.scope('bbs 5ch');
import https from 'https';
import encoding from 'encoding-japanese';

const instance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});

/** ステータスコード304 _NotModified */
const NOT_MODIFIED = '304';
const RANGE_NOT_SATISFIABLE = '416';

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
    const response = await instance(options);

    // レスポンスヘッダ表示
    // const headers: { [key: string]: string } = response.headers;
    // gzipで取得出来たら解凍処理も入れる

    // UTF-8に変換
    const str = iconv.decode(Buffer.from(response.data), 'Shift_JIS');
    // パースして格納
    list.push(
      ...str
        .split('\n')
        .filter((item) => item)
        .map((line) => parseThreadList(boardUrl, line)),
    );
  } catch (error) {
    if (error.status == NOT_MODIFIED) {
      log.error('5ch系BBS板取得APIリクエストエラー、NOT_MODIFIED');
    } else if (error.status == RANGE_NOT_SATISFIABLE) {
      log.error('5ch系BBS板取得APIリクエストエラー、RANGE_NOT_SATISFIABLE');
    } else {
      log.error('5ch系BBS板取得APIリクエストエラー、message=' + error.message);
    }
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
  const unicodeArray = [];
  for (let i = 0; i < message.length; i++) {
    unicodeArray.push(message.charCodeAt(i));
  }
  const sjisArray = encoding.convert(unicodeArray, {
    to: 'SJIS',
    from: 'UNICODE',
  });
  // log.info(sjisArray.toString());

  const encodedKeyword = encoding.urlEncode(sjisArray as any);
  // log.info(encodeURIComponent.toString());
  log.info(`${hostname}test/bbs.cgi`);
  log.info(`FROM=&MESSAGE=${encodedKeyword}&mail=sage&key=${threadNumber}&bbs=${boardId}`);
  const result = await axios.post(`${hostname}test/bbs.cgi`, `FROM=&MESSAGE=${encodedKeyword}&mail=sage&key=${threadNumber}&bbs=${boardId}`, {
    headers: {
      Accept: '*/*',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept-Encoding': 'gzip, deflate, br',
      Cookie: 'MAIL="sage"; NAME=""',
    },
    withCredentials: true,
  });
};

class Read5ch {
  /** 最終取得スレッド */
  private lastThreadUrl: string;
  /** 最終レス番号 */
  private lastResNumber: number;
  /** 最終書き込み時刻 */
  private lastWroteDate: Date | null;
  /** 最終更新日時(ヘッダ) */
  private lastModified: string | null;
  /** 最終バイト数 */
  private lastByte: number;

  constructor() {
    this.lastThreadUrl = '';
    this.lastResNumber = 0;
    this.lastModified = null;
    this.lastByte = 0;
    this.lastWroteDate = null;
  }

  /**
   * レス読み込み
   * 引数で指定した板からレスを読む
   * レス番号を指定していない場合は全件取得
   * @param threadUrl スレURL
   * @param resNum レス番号
   */
  read = async (threadUrl: string, resNum: number) => {
    // log.info(`[Read5ch] threadUrl=${threadUrl} resNum=${resNum}`);
    // 板や最終レス番号がかわったら最初からとり直す(lastmodifiと rangeのリセット)
    if (threadUrl != this.lastThreadUrl || Number.isNaN(resNum) || resNum < this.lastResNumber) {
      this.lastThreadUrl = threadUrl;
      this.lastModified = null;
      this.lastByte = 0;
      this.lastWroteDate = null;
      log.info(' reset');
    } else {
      log.debug('noreset');
    }

    //リクエストURL作成 下記みたいな感じで変換する
    //https://bbs.jpnkn.com/test/read.cgi/yudeunagi/1572734724/
    //https://bbs.jpnkn.com/yudeunagi/dat/1572734724.dat
    const rep = /\/test\/read.cgi(\/.+)(\/.+)\//;
    const requestUrl = threadUrl.replace(rep, '$1/dat$2.dat');
    // log.info(`[Read5ch][read] ${requestUrl} resNum=${resNum}`);

    /**
     * １．レス番号指定がない場合
     *  最新1件
     * ２．番号指定あり、且つ、初回取得の場合
     * ２－１．レス500、指定505とか
     *   null返却
     * ２－２．レス500、指定490とか
     *  490からそれ以降の分をあるだけ
     */
    const range = this.lastByte;
    //リクエストオプションの設定
    const options: AxiosRequestConfig = {
      url: requestUrl,
      method: 'GET',
      timeout: 3 * 1000,
      responseType: 'arraybuffer',
      headers: {
        'if-modified-since': this.lastModified,
        range: 'bytes=' + range + '-',
      } as any,
      validateStatus: (status: number) => {
        return status >= 200 && status <= 304;
      },
    };

    let responseJson: UserComment[];
    //掲示板へのリクエスト実行
    try {
      // log.info(JSON.stringify(options, null, '  '));
      const response = await instance(options);
      if (response.status === 304) {
        log.info('status 304');
        return [];
      }

      // レスポンスヘッダ表示
      const headers = response.headers;

      // 文字コード変換
      const str = iconv.decode(Buffer.from(response.data), 'Shift_JIS');
      // レスポンスオブジェクト作成、content-rangeがある場合とない場合で処理を分ける
      if (headers['content-range'] == null || this.lastByte == 0) {
        log.debug('content-range=' + headers['content-range']);
        const result = parseNewResponse(str, resNum);
        responseJson = result.result;
      } else {
        responseJson = parseDiffResponse(str, resNum);
      }

      // 最終書き込み時刻の整合性チェック
      // ぜろちゃんねる固有の問題？たまにデータが巻き戻る
      if (responseJson.length > 0) {
        const dateStr = responseJson[responseJson.length - 1].date;
        if (dateStr) {
          const date = new Date(dateStr);
          if (this.lastWroteDate) {
            // スレが変わったわけでもないのに最終書き込み時刻よりも古いデータが取得できた場合は無かったことにする
            if (this.lastWroteDate > date) {
              log.warn(`時刻不整合: unacast: ${this.lastWroteDate} bbs: ${date}`);
              responseJson = [];
            } else {
              this.lastWroteDate = date;
            }
          } else {
            this.lastWroteDate = date;
          }
        }
      }

      // LastModifiedとRange更新処理
      if (responseJson.length > 0 && headers['last-modified'] != null) {
        this.lastModified = headers['last-modified'];
      }

      // 最終レス番更新
      if (responseJson.length > 0) {
        this.lastResNumber = Number(responseJson[responseJson.length - 1].number);
      }

      // 取得バイト数表示
      if (headers['content-length'] != null && responseJson.length > 0) {
        this.lastByte = this.lastByte + parseInt(headers['content-length']) - 1;
        log.debug('lastByte=' + this.lastByte);
      }
    } catch (error) {
      responseJson = [];
      if (error.status == NOT_MODIFIED) {
        log.error('5ch系BBSレス取得APIリクエストエラー、NOT_MODIFIED');
      } else if (error.status == RANGE_NOT_SATISFIABLE) {
        log.error('5ch系BBSレス取得APIリクエストエラー、RANGE_NOT_SATISFIABLE');
      } else {
        log.error('5ch系BBSレス取得APIリクエストエラー、message=' + error.message);
      }
      throw new Error('connection error');
    }

    return responseJson;
  };
}

/**
 * 全取得したレスポンス（複数）のパース
 * 戻りとしてパースしたjsonオブジェクトの配列を返す
 * @param res 板から返却されたdat
 * @param resNum リクエストされたレス番号
 */
const parseNewResponse = (res: string, resNum: number) => {
  log.info(`parseNewResponse: res=${res.length} resNum=${resNum}`);

  // 結果を格納する配列
  const result: ReturnType<typeof parseResponse>[] = [];
  // レス番号
  let num = 0;

  // 新着レスを改行ごとにSplitする
  const resArray = res.split(/\r\n|\r|\n/);
  // 新着なしなら戻る。
  if (resArray.length === 0) {
    return { result, lastResNumber: resNum };
  }
  // 配列の最後に空の要素が入ることがあるので取り除く
  if (resArray[resArray.length - 1].length === 0) {
    resArray.pop();
  }

  // レス指定なしの場合全件取得
  if (Number.isNaN(resNum) || resNum < 1) {
    log.info(`resNum: ${resNum} `);
    num = 0;
  } else {
    num = resNum;
  }

  // log.info(`num = ${num}  resArrayLength = ${resArray.length}   ${resArray[num]}`);
  // 1行ごとにパースする
  for (; num < resArray.length; num++) {
    // パースメソッド呼び出し
    if (resArray[num].length > 0) {
      result.push(parseResponse(resArray[num], num + 1));
    }
  }
  // パースしたオブジェクトの配列を返却
  return { result, lastResNumber: num + 1 };
};

/**
 * 差分取得したレスポンス（複数）のパース
 * 戻りとしてパースしたjsonオブジェクトの配列を返す
 * @param res 板から返却されたdat1行分
 * @param resNum リクエストされたレス番号
 */
const parseDiffResponse = (res: string, resNum: number) => {
  log.info(`parseDiffResponse: res=${res.length} resNum=${resNum}`);

  //結果を格納する配列
  const result: ReturnType<typeof parseResponse>[] = [];
  // レス番号
  let num = resNum + 1;

  //新着レスを改行ごとにSplitする
  const resArray = res.split(/\r\n|\r|\n/);
  // 新着なしなら戻る。
  if (resArray.length === 0) {
    return result;
  } else {
    // 配列の最後に空の要素が入ることがあるので取り除く
    if (resArray[resArray.length - 1].length == 0) {
      resArray.pop();
    }
  }

  log.debug('purseDiffResponse 取得レス番号=' + num);
  //1行ごとにパースする
  resArray.forEach((value) => {
    //パースメソッド呼び出し
    if (value.length > 0) {
      result.push(parseResponse(value, num));
      num++;
    }
  });

  // パースしたオブジェクトの配列を返却
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
  const splitRes = subjectLine.split('<>');
  // log.debug(splitRes);
  const datNum = splitRes[0].replace('.dat', '');

  const hostname = boardUrl.match(/^https?:\/\/.+?\//)?.[0] ?? '';
  const boardName = boardUrl.replace(hostname, '');
  const url = `${hostname}test/read.cgi/${boardName}${datNum}/`;

  const titleTemp = splitRes[1];

  const name: string = titleTemp.match(/(.*?) \(\d+\)$/)?.[1] ?? '★取得失敗★';
  const resNum = Number(titleTemp.match(/\(\d+\)$/)?.[0].replace(/\(|\)/g, ''));

  // オブジェクトを返却
  return {
    url,
    name,
    resNum,
  };
};

/**
 * レスのパース
 * @param res レスポンス1レス
 * @param num レス番
 */
const parseResponse = (res: string, num: number) => {
  //APIの返却値を<>で分割
  //レスの要素
  //0:名前
  //1:メアド
  //2:日付とID （2019/11/03(日) 08:55:00 ID:kanikani）みたいに表示
  //3:本文
  //4:スレタイ （1レス目のみ）
  const splitRes = res.split('<>');
  // 日付とID分離処理、' ID:'で区切る
  const dateId = splitRes[2].split(' ID:');
  const date = dateId[0];
  const id = dateId.length === 2 ? dateId[1] : '';

  const resJson: UserComment = {
    number: num.toString(),
    name: splitRes[0],
    email: splitRes[1],
    date: date,
    text: splitRes[3],
    threadTitle: splitRes[4] ? splitRes[4] : '',
    id: id,
    imgUrl: '',
    from: 'bbs',
  };

  // オブジェクトを返却
  return resJson;
};

export default Read5ch;
