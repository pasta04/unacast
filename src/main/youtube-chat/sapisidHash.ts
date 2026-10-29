import crypto from 'crypto';

export const YOUTUBE_ORIGIN = 'https://www.youtube.com';

/**
 * ログイン中のユーザーとして YouTube の内部 API を呼ぶ時の Authorization ヘッダの値を作る。
 * YouTube の Web 版と同じく `SAPISIDHASH <時刻>_<sha1("<時刻> <SAPISID> <origin>")>` の形式。
 * @param sapisid Cookie の SAPISID の値
 * @param nowSec 現在時刻 (UNIX 秒)
 */
export const buildSapisidHash = (sapisid: string, nowSec: number, origin = YOUTUBE_ORIGIN): string => {
  const hash = crypto.createHash('sha1').update(`${nowSec} ${sapisid} ${origin}`).digest('hex');
  return `SAPISIDHASH ${nowSec}_${hash}`;
};
