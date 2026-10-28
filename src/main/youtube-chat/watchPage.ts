/**
 * 配信ページ (https://www.youtube.com/watch?v=...) の HTML から、コメント取得の開始に必要な情報を取り出す。
 * 依存を持たない純関数にしておく (取得した HTML をそのまま渡して確認できるように)。
 */

/** コメント取得 API に送るクライアントバージョンが配信ページから取れなかった時の値 */
export const FALLBACK_CLIENT_VERSION = '2.20210126.08.02';

export type WatchPageInfo = {
  /**
   * 再生にログインを求められている時の理由 (例: 「ログインして bot ではないことを確認してください」)。
   * YouTube のボット確認のほか、メンバー限定配信などでも出る。求められていなければ undefined
   */
  loginRequiredReason?: string;
  /** 配信中か。ページに情報が無ければ undefined */
  isLiveNow?: boolean;
  /** コメント取得 API のキー */
  apiKey?: string;
  /** コメント取得の開始位置 */
  continuation?: string;
  /** YouTube の現在の Web クライアントのバージョン (コメント取得 API に送る) */
  clientVersion?: string;
};

export const parseWatchPage = (html: string): WatchPageInfo => {
  const info: WatchPageInfo = {};

  const playability = html.match(/"playabilityStatus":\{"status":"([A-Z_]+)"(?:,"reason":"((?:[^"\\]|\\.)*)")?/);
  if (playability?.[1] === 'LOGIN_REQUIRED') {
    info.loginRequiredReason = playability[2] || 'LOGIN_REQUIRED';
  }

  const isLiveNow = html.match(/isLiveNow":\s*(true|false)/)?.[1];
  if (isLiveNow) info.isLiveNow = isLiveNow === 'true';

  info.apiKey = html.match(/innertubeApiKey":"(.*?)"/)?.[1] || undefined;
  info.continuation = html.match(/continuation":"(.*?)"/)?.[1] || undefined;
  info.clientVersion = html.match(/INNERTUBE_CLIENT_VERSION":"(.*?)"/)?.[1] || undefined;

  return info;
};
