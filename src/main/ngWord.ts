/**
 * NG ワード判定ロジック。
 *
 * sendDom() の集約点で `judgeNgWord()` を呼び、各 UserComment に `isNg` と
 * `ngDisplayType` を付与する。判定結果は 3 経路 (配信画面 / チャット窓 / 読み上げ・SE)
 * で参照される。
 *
 * 設計:
 *  - judgeAaMessage と同形の「フラグ付与純関数」パターン。
 *  - matchType=include は部分一致、regexp は new RegExp。
 *  - multiline=false の場合は対象テキストを改行 (\r\n, \n, <br/> も含む) で
 *    分割し、いずれかの行に一致したら NG。
 *  - source は将来のソース別フィルタ用 ('all' = 全ソース)。
 *  - 複数 NG ワードにマッチした場合、displayType は transparent 優先。
 *  - 不正な正規表現は console.warn してその場では「マッチしない」扱い
 *    (アプリを止めない)。UI 側でも事前バリデーションを行うので通常は到達しない。
 *
 * `validateNgRegexp` は renderer 側 (NgWord.tsx) のフォームバリデーションでも
 * 使う。
 */

/** NG ワード設定 1 件の型 (config.ngWords の要素) */
type NgWordEntry = (typeof globalThis.config.ngWords)[number];

/** 行分割に使う区切りパターン。本文には掲示板由来の `<br/>` が改行として入る */
const LINE_SPLITTER = /\r\n|\r|\n|<br\s*\/?>/i;

/**
 * 1 エントリの正規表現として `word` を評価できるかチェックする。
 * 不正なら ok:false とエラーメッセージを返す。
 *
 * @param multiline true なら 'm' フラグを付けて検証する (実際の判定と同じ条件で確認するため)
 */
export const validateNgRegexp = (word: string, multiline: boolean): { ok: true } | { ok: false; error: string } => {
  try {
    new RegExp(word, multiline ? 'm' : '');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
};

/** 1 エントリが 1 メッセージにマッチするか */
const matchEntry = (entry: NgWordEntry, message: UserComment): boolean => {
  // source: 'all' は全許可。将来ソース別はここで message.from と比較
  if (entry.source !== 'all' && entry.source !== message.from) return false;
  if (!entry.word) return false;

  const raw = entry.target === 'name' ? message.name : message.text;
  if (typeof raw !== 'string' || raw === '') return false;

  const targets = entry.multiline ? [raw] : raw.split(LINE_SPLITTER);

  if (entry.matchType === 'regexp') {
    let re: RegExp;
    try {
      re = new RegExp(entry.word, entry.multiline ? 'm' : '');
    } catch (e) {
      console.warn('[ngWord] invalid regexp, skipped:', entry.word, e);
      return false;
    }
    return targets.some((line) => re.test(line));
  }
  // 部分一致
  return targets.some((line) => line.includes(entry.word));
};

/**
 * messageList の各メッセージに NG 判定結果 (isNg, ngDisplayType) を付与して返す。
 *
 * judgeAaMessage と同形。NG が複数マッチした場合の表示種別は
 * 'transparent' が 1 件でもあれば 'transparent'、それ以外は 'normal'。
 *
 * 多重呼び出し対策で、既に isNg が付いているメッセージは判定を上書きしない。
 */
export const judgeNgWord = (messageList: UserComment[]): UserComment[] => {
  const ngWords = globalThis.config.ngWords ?? [];
  if (ngWords.length === 0) {
    return messageList.map((m) => ({ ...m, isNg: m.isNg ?? false }));
  }
  return messageList.map((message) => {
    if (message.isNg !== undefined) return message;
    const matched = ngWords.filter((entry) => matchEntry(entry, message));
    if (matched.length === 0) {
      return { ...message, isNg: false };
    }
    const ngDisplayType: 'normal' | 'transparent' = matched.some((e) => e.displayType === 'transparent') ? 'transparent' : 'normal';
    return { ...message, isNg: true, ngDisplayType };
  });
};
