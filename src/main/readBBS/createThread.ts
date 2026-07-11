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
      ...headers,
    },
    // 302 (成功時にリダイレクトを返す板がある) も許容する
    validateStatus: (status: number) => status >= 200 && status < 400,
    maxRedirects: 0,
  };
  const response = await instance(options);
  const html = iconv.decode(Buffer.from(response.data as any), charset);
  return { response, html };
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
    return judgeResponseHtml(second.html);
  }
  return judgeResponseHtml(first.html);
};

/**
 * したらばのスレ立て。
 * POST {hostname}bbs/write.cgi/{dir}/{bbs}/ (スレ番号なし) + subject で新規スレッド作成。
 *
 * @param hostname 例 https://jbbs.shitaraba.net/
 * @param dir 例 game
 * @param bbs 例 51638
 */
export const createThreadShitaraba = async (hostname: string, dir: string, bbs: string, p: CreateThreadParams): Promise<CreateThreadPostResult> => {
  const payload = [
    `dir=${dir}`,
    `bbs=${bbs}`,
    `time=${Math.floor(Date.now() / 1000)}`,
    `subject=${toEncodedParam(p.title, 'EUCJP')}`,
    `NAME=${toEncodedParam(p.name, 'EUCJP')}`,
    `MAIL=${toEncodedParam(p.mail, 'EUCJP')}`,
    `MESSAGE=${toEncodedParam(normalizeBody(p.body), 'EUCJP')}`,
    `submit=${toEncodedParam('新規書き込み', 'EUCJP')}`,
  ].join('&');
  const url = `${hostname}bbs/write.cgi/${dir}/${bbs}/`;

  log.info(`[createThreadShitaraba] ${url}`);
  const { response, html } = await post(url, payload, 'EUC-JP', { Referer: `${hostname}${dir}/${bbs}/` });
  // したらばは成功時に302を返すことがある
  if (response.status >= 300 && response.status < 400) return { status: 'ok' };
  if (isConfirmPage(html)) {
    const cookie = buildCookieHeader(response.headers['set-cookie']);
    const second = await post(url, payload, 'EUC-JP', { Referer: `${hostname}${dir}/${bbs}/`, ...(cookie ? { Cookie: cookie } : {}) });
    if (second.response.status >= 300 && second.response.status < 400) return { status: 'ok' };
    return judgeResponseHtml(second.html);
  }
  return judgeResponseHtml(html);
};
