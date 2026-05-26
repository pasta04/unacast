/**
 * コメント取得元 (掲示板 / jpnkn / niconico / twicas / youtube / twitch) の通信エラーが
 * 一定時間継続したら system コメントとして通知する共通モジュール。
 *
 * 計測は時間ベース:
 *   - 閾値: globalThis.config.notifyThreadConnectionErrorLimit (秒, 0 以下なら機能 OFF)
 *   - recordConnectionError(source) 呼び出し時、その取得元がまだエラー状態でなければ
 *     エラー開始時刻を記録し、閾値秒後に通知を発火するタイマーを仕掛ける
 *   - recordConnectionSuccess(source) でエラー状態を解除し、タイマーもキャンセル
 *   - タイマー満了時、通知用 system コメントをコールバック (setNotifyCallback で登録) へ渡す
 *
 * 取得元ごとに独立した状態。1 取得元が落ちても他取得元のカウンタには影響しない。
 *
 * 過剰通知を避けるための仕様:
 *   - **初回成功イベントまではエラーをカウントしない**。配信開始前にサーバ起動すると
 *     Youtube 等は「配信無し」を error として頻発させるため、初回 success が来るまでは
 *     recordConnectionError を無視する (= サーバ起動時の待機状態は通知対象外)
 *   - **エラー継続中は 1 回だけ通知する**。一度通知を出した後は success が来てエラー状態が
 *     解除されるまで再通知しない。再び success → error と遷移すれば再度通知し得る。
 *
 * BBS のような polling 型では error が定期的に発火するが、jpnkn/Twitch のような WebSocket 型は
 * 切断時に 1 回しか error が発火しないケースがある。タイマー駆動なので、その場合でも
 * エラー状態が継続していれば閾値経過時に通知が出る。
 */

type NotifiableSource = Extract<CommentSource, 'bbs' | 'jpnkn' | 'youtube' | 'twitch' | 'niconico' | 'twitcasting'>;

type SourceState = {
  /** 初回成功 (open/comment 等) を受信済みか。false の間は recordConnectionError を無視する */
  hasConnectedOnce: boolean;
  /** エラー状態の開始 (Date.now()) または null (エラー状態ではない) */
  errorSince: number | null;
  /** 閾値到達時に通知を発火する setTimeout ハンドル */
  timer: NodeJS.Timeout | null;
  /** 今のエラー状態 (errorSince が立ってから success まで) で既に通知を出したか */
  notifiedInCurrentError: boolean;
};

const newState = (): SourceState => ({
  hasConnectedOnce: false,
  errorSince: null,
  timer: null,
  notifiedInCurrentError: false,
});

const state: Record<NotifiableSource, SourceState> = {
  bbs: newState(),
  jpnkn: newState(),
  youtube: newState(),
  twitch: newState(),
  niconico: newState(),
  twitcasting: newState(),
};

const sourceLabels: Record<NotifiableSource, string> = {
  bbs: '掲示板',
  jpnkn: 'jpnkn',
  youtube: 'YouTube',
  twitch: 'Twitch',
  niconico: 'ニコ生',
  twitcasting: 'ツイキャス',
};

const buildNotification = (source: NotifiableSource, limitSec: number): UserComment => {
  const text =
    source === 'bbs'
      ? `掲示板の通信エラーが${limitSec}秒以上続いています。設定を見直すか、掲示板URLを変更してください。`
      : `${sourceLabels[source]}の通信エラーが${limitSec}秒以上続いています。サービスの状態や設定を確認してください。`;
  return {
    name: 'unacastより',
    imgUrl: './img/unacast.png',
    text,
    type: 'comment',
    from: 'system',
  };
};

type NotifyCallback = (notification: UserComment) => void;
let notifyCallback: NotifyCallback | null = null;

/** 通知の出力先コールバックを登録する。サーバ起動時に sendDomForChatWindow を渡す想定 */
export const setNotifyCallback = (cb: NotifyCallback | null): void => {
  notifyCallback = cb;
};

const clearTimer = (s: SourceState): void => {
  if (s.timer) {
    clearTimeout(s.timer);
    s.timer = null;
  }
};

/** 全取得元の状態を初期化 (サーバ起動・停止時に呼ぶ) */
export const resetAllConnectionErrors = (): void => {
  (Object.keys(state) as NotifiableSource[]).forEach((src) => {
    const s = state[src];
    s.hasConnectedOnce = false;
    s.errorSince = null;
    s.notifiedInCurrentError = false;
    clearTimer(s);
  });
};

/** 成功イベント時に呼ぶ。エラー状態を解除しタイマーもキャンセルする。初回成功フラグも立てる */
export const recordConnectionSuccess = (source: NotifiableSource): void => {
  const s = state[source];
  s.hasConnectedOnce = true;
  s.errorSince = null;
  s.notifiedInCurrentError = false;
  clearTimer(s);
};

/**
 * エラーイベント時に呼ぶ。
 *
 * - 一度も成功イベントが来ていない取得元は無視する (= 配信開始前のサーバ起動で
 *   不要に通知が飛ぶのを避ける)
 * - 既にエラー状態ならば何もしない (タイマー満了を待つ)
 * - タイマー満了で 1 回だけ通知し、success が来るまで再通知しない
 */
export const recordConnectionError = (source: NotifiableSource): void => {
  const limitSec = globalThis.config?.notifyThreadConnectionErrorLimit ?? 0;
  if (limitSec <= 0) return;

  const s = state[source];
  // 初回成功前 (待機中) はカウントしない
  if (!s.hasConnectedOnce) return;
  // 既にエラー状態 (タイマー仕掛け済み or 通知済み) なら何もしない
  if (s.errorSince !== null) return;

  s.errorSince = Date.now();
  s.timer = setTimeout(() => {
    s.timer = null;
    // タイマー満了。まだエラー状態が続いていて、まだ通知していなければ通知
    if (s.errorSince === null) return;
    if (s.notifiedInCurrentError) return;
    s.notifiedInCurrentError = true;
    if (notifyCallback) notifyCallback(buildNotification(source, limitSec));
    // 再通知はしない。次の通知は success → error の遷移を待つ
  }, limitSec * 1000);
};
