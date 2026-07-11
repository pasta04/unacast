/**
 * スレ立て (新規スレッド作成) の POST 実装。
 *
 * 既存のレス投稿 (Read5ch.postRes / ReadSitaraba.postRes) と同じエンコード機構を使い、
 * スレ立て用のパラメータ (key の代わりに subject) で write cgi を叩く。
 *
 * 注意: 掲示板の write cgi は失敗でも HTTP 200 でエラーHTMLを返すため、ここでの
 * 判定はベストエフォート。成功の最終確認は呼び出し元 (threadBrowser.ts) が
 * subject.txt を再取得して新スレの出現を確認することで行う。
 */
import axios, { AxiosRequestConfig } from 'axios';
import https from 'https';
import iconv from 'iconv-lite';
import encoding from 'encoding-japanese';
import electronlog from 'electron-log';
const log = electronlog.scope('createThread');

const instance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});

export type CreateThreadParams = {
  title: string;
  name: string;
  mail: string;
  body: string;
};

export type CreateThreadPostResult = {
  /** 応答本文から見た判定。'unknown' は成功とも失敗とも断定できない (subject.txt での確認に委ねる) */
  status: 'ok' | 'error' | 'unknown';
  /** status='error' のとき、応答から抽出したエラーメッセージ */
  error?: string;
};

/** 文字列を指定文字コードへ変換して URL エンコードする (postRes と同じ方式) */
const toEncodedParam = (value: string, to: 'SJIS' | 'EUCJP'): string => {
  const unicodeArray: number[] = [];
  for (let i = 0; i < value.length; i++) {
    unicodeArray.push(value.charCodeAt(i));
  }
  const converted = encoding.convert(unicodeArray, { to, from: 'UNICODE' });
  return encoding.urlEncode(converted as number[]);
};

/** 本文の改行を掲示板が期待する \r\n に揃える */
const normalizeBody = (body: string) => body.replace(/\r?\n/g, '\r\n');

/** 応答HTMLからエラーメッセージらしき部分を抽出する */
const extractErrorMessage = (html: string): string => {
  const bold = html.match(/<b>([^<]+)<\/b>/i)?.[1];
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1];
  const message = (bold || title || '').replace(/\s+/g, ' ').trim();
  return message || '掲示板からエラーが返されました';
};

/** 応答HTMLの判定 */
const judgeResponseHtml = (html: string): CreateThreadPostResult => {
  if (/書きこみました|書き込みました/.test(html)) return { status: 'ok' };
  if (/ERROR|ＥＲＲＯＲ|エラー|Samba|SAMBA/i.test(html)) return { status: 'error', error: extractErrorMessage(html) };
  return { status: 'unknown' };
};

/** 確認画面 (クッキー確認) かどうか */
const isConfirmPage = (html: string): boolean => /書き込み確認|書きこみ確認|クッキー|cookie/i.test(html);

/** set-cookie ヘッダから Cookie ヘッダ値を組み立てる */
const buildCookieHeader = (setCookies: string[] | undefined): string => {
  if (!setCookies || setCookies.length === 0) return '';
  return setCookies.map((c) => c.split(';')[0]).join('; ');
};

/**
 * 書き込み系リクエストで名乗る User-Agent。
 * したらば等は UA 無し (axios 既定) の write.cgi POST を 403 で弾くことがあるため、
 * 掲示板ツールの慣習である Monazilla 形式を名乗る。
 */
const WRITE_USER_AGENT = 'Monazilla/1.00 (unacast)';

const post = async (url: string, payload: string, charset: string, headers: Record<string, string>) => {
  const options: AxiosRequestConfig = {
    url,
    method: 'POST',
    data: payload,
    timeout: 10 * 1000,
    responseType: 'arraybuffer',
    headers: {
      Accept: '*/*',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': WRITE_USER_AGENT,
      ...headers,
    },
    // エラーHTML (4xx/5xx) も本文を読んで判定したいので、HTTPステータスでは例外にしない
    validateStatus: () => true,
    maxRedirects: 0,
  };
  const response = await instance(options);
  const html = iconv.decode(Buffer.from(response.data as any), charset);
  log.info(`[post] ${url} -> ${response.status} body=${html.replace(/\s+/g, ' ').slice(0, 200)}`);
  return { response, html };
};

/** HTTP ステータスも加味した応答判定 */
const judgeResponse = (status: number, html: string): CreateThreadPostResult => {
  if (status >= 300 && status < 400) return { status: 'ok' }; // 成功時にリダイレクトを返す板がある
  if (status >= 400) return { status: 'error', error: `HTTP ${status}: ${extractErrorMessage(html)}` };
  return judgeResponseHtml(html);
};

/**
 * 5ch互換板 (jpnkn 含む) のスレ立て。
 * POST {hostname}test/bbs.cgi に key の代わりに subject を付けると新規スレッド作成になる。
 * 初回書き込みの確認画面 (クッキー確認) が返ってきた場合は、付与されたクッキーを
 * 持って同じ内容を 1 回だけ再送する。
 *
 * @param hostname 例 https://bbs.jpnkn.com/
 * @param boardId 例 pasta04
 */
export const createThread5ch = async (hostname: string, boardId: string, p: CreateThreadParams): Promise<CreateThreadPostResult> => {
  const payload = [
    `subject=${toEncodedParam(p.title, 'SJIS')}`,
    `FROM=${toEncodedParam(p.name, 'SJIS')}`,
    `mail=${toEncodedParam(p.mail, 'SJIS')}`,
    `MESSAGE=${toEncodedParam(normalizeBody(p.body), 'SJIS')}`,
    `bbs=${boardId}`,
    `time=${Math.floor(Date.now() / 1000)}`,
    `submit=${toEncodedParam('新規スレッド作成', 'SJIS')}`,
  ].join('&');
  const url = `${hostname}test/bbs.cgi`;
  const baseHeaders = { Referer: `${hostname}${boardId}/` };

  log.info(`[createThread5ch] ${url} bbs=${boardId}`);
  const first = await post(url, payload, 'Shift_JIS', baseHeaders);
  if (isConfirmPage(first.html)) {
    // クッキーを持って1回だけ再送
    log.info('[createThread5ch] confirm page returned. retrying with cookies');
    const cookie = buildCookieHeader(first.response.headers['set-cookie']);
    const second = await post(url, payload, 'Shift_JIS', { ...baseHeaders, ...(cookie ? { Cookie: cookie } : {}) });
    return judgeResponse(second.response.status, second.html);
  }
  return judgeResponse(first.response.status, first.html);
};

/**
 * したらばのスレ立て。
 * POST {hostname}bbs/write.cgi/{dir}/{bbs}/ (スレ番号なし) + SUBJECT で新規スレッド作成。
 * したらばの write.cgi のパラメータ名は大文字 (DIR/BBS/TIME/NAME/MAIL/MESSAGE/SUBJECT)。
 * また http だと 403 になることがあるため https に正規化する。
 *
 * @param hostname 例 https://jbbs.shitaraba.net/
 * @param dir 例 game
 * @param bbs 例 51638
 */
export const createThreadShitaraba = async (hostname: string, dir: string, bbs: string, p: CreateThreadParams): Promise<CreateThreadPostResult> => {
  const secureHost = hostname.replace(/^http:/, 'https:');
  const payload = [
    `DIR=${dir}`,
    `BBS=${bbs}`,
    `TIME=${Math.floor(Date.now() / 1000)}`,
    `SUBJECT=${toEncodedParam(p.title, 'EUCJP')}`,
    `NAME=${toEncodedParam(p.name, 'EUCJP')}`,
    `MAIL=${toEncodedParam(p.mail, 'EUCJP')}`,
    `MESSAGE=${toEncodedParam(normalizeBody(p.body), 'EUCJP')}`,
    `submit=${toEncodedParam('新規スレッド作成', 'EUCJP')}`,
  ].join('&');
  const url = `${secureHost}bbs/write.cgi/${dir}/${bbs}/`;
  const baseHeaders = { Referer: `${secureHost}${dir}/${bbs}/` };

  log.info(`[createThreadShitaraba] ${url}`);
  const first = await post(url, payload, 'EUC-JP', baseHeaders);
  if (isConfirmPage(first.html)) {
    log.info('[createThreadShitaraba] confirm page returned. retrying with cookies');
    const cookie = buildCookieHeader(first.response.headers['set-cookie']);
    const second = await post(url, payload, 'EUC-JP', { ...baseHeaders, ...(cookie ? { Cookie: cookie } : {}) });
    return judgeResponse(second.response.status, second.html);
  }
  return judgeResponse(first.response.status, first.html);
};
