/**
 * コメント取得元 (掲示板 / jpnkn / niconico / twicas / youtube / twitch) の通信エラーが
 * 一定時間継続したら system コメントとして通知する共通モジュール。
 *
 * 計測は時間ベース:
 *   - 閾値: globalThis.config.notifyThreadConnectionErrorLimit (秒, 0 以下なら機能 OFF)
 *   - recordConnectionError(source) 呼び出し時、その取得元がまだエラー状態でなければ
 *     エラー開始時刻を記録し、閾値秒後に通知を発火するタイマーを仕掛ける
 *   - recordConnectionSuccess(source) でエラー状態を解除し、タイマーもキャンセル
 *   - タイマー満了時、通知用 system コメントをコールバック (setNotifyCallback で登録) へ渡す。
 *     その後タイマーを再仕掛けして、エラー状態が継続すれば閾値ごとに再通知される
 *
 * 取得元ごとに独立した状態。1 取得元が落ちても他取得元のカウンタには影響しない。
 *
 * BBS のような polling 型では error が定期的に発火するが、jpnkn/Twitch のような WebSocket 型は
 * 切断時に 1 回しか error が発火しないケースがある。タイマー駆動なので、その場合でも
 * エラー状態が継続していれば閾値経過時に通知が出る。
 */

type NotifiableSource = Extract<CommentSource, 'bbs' | 'jpnkn' | 'youtube' | 'twitch' | 'niconico' | 'twitcasting'>;

type SourceState = {
  /** エラー状態の開始 (Date.now()) または null (エラー状態ではない) */
  errorSince: number | null;
  /** 次回通知判定の setTimeout ハンドル */
  timer: NodeJS.Timeout | null;
};

const newState = (): SourceState => ({ errorSince: null, timer: null });

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

const scheduleCheck = (source: NotifiableSource, limitSec: number): void => {
  const s = state[source];
  clearTimer(s);
  s.timer = setTimeout(() => {
    s.timer = null;
    // タイマー満了。まだエラー状態が続いているなら通知
    if (s.errorSince === null) return;
    if (notifyCallback) notifyCallback(buildNotification(source, limitSec));
    // 連続エラーが続けば次の閾値経過時にもまた通知できるよう、開始時刻を更新して再仕掛け
    s.errorSince = Date.now();
    scheduleCheck(source, limitSec);
  }, limitSec * 1000);
};

/** 全取得元の状態を初期化 (サーバ起動・停止時に呼ぶ) */
export const resetAllConnectionErrors = (): void => {
  (Object.keys(state) as NotifiableSource[]).forEach((src) => {
    const s = state[src];
    s.errorSince = null;
    clearTimer(s);
  });
};

/** 成功イベント時に呼ぶ。エラー状態を解除しタイマーもキャンセルする */
export const recordConnectionSuccess = (source: NotifiableSource): void => {
  const s = state[source];
  s.errorSince = null;
  clearTimer(s);
};

/**
 * エラーイベント時に呼ぶ。
 * その取得元がまだエラー状態でなければエラー開始時刻を記録してタイマーを仕掛ける。
 * 既にエラー状態ならば何もしない (タイマー満了を待つ)。
 */
export const recordConnectionError = (source: NotifiableSource): void => {
  const limitSec = globalThis.config?.notifyThreadConnectionErrorLimit ?? 0;
  if (limitSec <= 0) return;

  const s = state[source];
  if (s.errorSince !== null) return;
  s.errorSince = Date.now();
  scheduleCheck(source, limitSec);
};
