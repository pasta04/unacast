/**
 * REST / WebSocket 経由で受け取った外部入力を UserComment に正規化する。
 *
 * - text は必須 (非空文字列)。
 * - from は省略時 'external'。指定された場合は許可リストに含まれるものだけ受け入れる。
 *   外部から 'system' を名乗ることはできない (bypassFilter 経路の悪用を防ぐ)。
 * - bypassFilter / isAA は外部からの指定を受け付けない (主処理側で付与する内部フラグのため)。
 * - imgUrl が空の場合の補完 (アイコンディレクトリからの選択) は呼び出し側で行う。
 */

const ALLOWED_FROM: ReadonlyArray<UserComment['from']> = ['bbs', 'jpnkn', 'youtube', 'twitch', 'niconico', 'twitcasting', 'stt', 'external'];

const isString = (v: unknown): v is string => typeof v === 'string';
const isNonEmptyString = (v: unknown): v is string => isString(v) && v.length > 0;

export type NormalizeResult = { ok: true; comment: UserComment } | { ok: false; error: string };

export const normalizeExternalComment = (raw: unknown): NormalizeResult => {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, error: 'body must be a JSON object' };
  }
  const body = raw as Record<string, unknown>;

  if (!isNonEmptyString(body.text)) {
    return { ok: false, error: '"text" must be a non-empty string' };
  }

  // from の検証
  let from: UserComment['from'] = 'external';
  if (body.from !== undefined) {
    if (!isString(body.from) || !ALLOWED_FROM.includes(body.from as UserComment['from'])) {
      return { ok: false, error: `"from" must be one of ${ALLOWED_FROM.join(', ')}` };
    }
    from = body.from as UserComment['from'];
  }

  // type の検証
  let type: UserComment['type'] = 'comment';
  if (body.type !== undefined) {
    if (body.type !== 'comment' && body.type !== 'gift') {
      return { ok: false, error: '"type" must be "comment" or "gift"' };
    }
    type = body.type;
  }

  // gift サブオブジェクトの検証
  let gift: UserComment['gift'] | undefined = undefined;
  if (body.gift !== undefined) {
    if (typeof body.gift !== 'object' || body.gift === null) {
      return { ok: false, error: '"gift" must be an object' };
    }
    const g = body.gift as Record<string, unknown>;
    if (!isString(g.name) || !isString(g.image)) {
      return { ok: false, error: '"gift.name" and "gift.image" must be strings' };
    }
    gift = { name: g.name, image: g.image };
  }

  const comment: UserComment = {
    name: isString(body.name) ? body.name : 'external',
    text: body.text,
    imgUrl: isString(body.imgUrl) ? body.imgUrl : '',
    type,
    from,
  };
  if (isString(body.number)) comment.number = body.number;
  if (isString(body.date)) comment.date = body.date;
  if (isString(body.id)) comment.id = body.id;
  if (isString(body.email)) comment.email = body.email;
  if (isString(body.threadTitle)) comment.threadTitle = body.threadTitle;
  if (gift) comment.gift = gift;

  return { ok: true, comment };
};
