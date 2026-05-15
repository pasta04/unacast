/**
 * レス取得元 (UserComment.from) ごとに、各出力軸 (配信画面表示 / 将来の SE / 読み上げ等)
 * への配信を許可するかどうかを判定するヘルパ。
 *
 * 設計方針:
 *  - 軸 (sourceFilter[axis]) も取得元 (sourceFilter[axis][source]) も
 *    存在しなければ「true (許可)」とみなす。`!== false` で判定する。
 *  - これにより、軸を増やしても source を増やしても、旧 localStorage を
 *    マイグレーションせずに後方互換が保たれる。
 *  - 'system' は内部通知用なので常に許可。
 *  - UserComment.bypassFilter が true ならすべての軸を素通り (テストコメント用)。
 */

/** message を「指定軸の出力先」に出してよいか */
export const isAllowedOnAxis = (axis: SourceFilterAxis, source: UserComment['from']): boolean => {
  if (source === 'system') return true;
  // typeof globalThis.config.sourceFilter は global.d.ts の宣言通り
  const axisMap = globalThis.config.sourceFilter?.[axis];
  if (!axisMap) return true;
  // CommentSource (== source 型から 'system' を除いたもの) のキーで検索
  const value = axisMap[source as CommentSource];
  return value !== false;
};

/** UserComment 自体が bypassFilter を持つ or system from なら無条件で許可 */
export const isBypassedFilter = (message: UserComment): boolean => {
  return Boolean(message.bypassFilter) || message.from === 'system';
};

/**
 * 軸単位でメッセージ配列を絞り込む。
 * bypassFilter / system from は素通り、それ以外は isAllowedOnAxis を見る。
 */
export const filterByAxis = (axis: SourceFilterAxis, messageList: UserComment[]): UserComment[] => {
  return messageList.filter((m) => isBypassedFilter(m) || isAllowedOnAxis(axis, m.from));
};
