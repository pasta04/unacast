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
 *  - 判定前にマッチ対象テキストを正規化する: bbs / jpnkn の本文は改行が実際の
 *    改行文字ではなく <br> タグでのみ入ってくるため、<br> を \n に変換して
 *    「見た目の行」と正規表現上の行を一致させる。さらに数値文字参照
 *    (&#10084; 等) と HTML エンティティ (&gt; 等) を復号し、ユーザーが
 *    画面で見たままの文字列 (>>1 や ❤) で NG ワードを書けるようにする。
 *  - multiline=false の場合は正規化後のテキストを改行で分割し、
 *    いずれかの行に一致したら NG。
 *  - multiline=true の場合は正規化後のテキスト全体を 1 つの塊として判定。
 *    正規表現は 'm' フラグ付きなので ^ $ が各行の先頭・末尾に効き、
 *    \n や [\s\S] で行またぎのパターンが書ける。
 *  - source は将来のソース別フィルタ用 ('all' = 全ソース)。
 *  - 複数 NG ワードにマッチした場合、displayType は transparent 優先。
 *  - 不正な正規表現は console.warn してその場では「マッチしない」扱い
 *    (アプリを止めない)。UI 側でも事前バリデーションを行うので通常は到達しない。
 *
 * `validateNgRegexp` は renderer 側 (NgWord.tsx) のフォームバリデーションでも
 * 使う。util の import は renderer からも解決できる (ipc.ts が sleep を
 * import している前例に同じ)。
 */
import { decodeNumericCharRefs, unescapeHtml } from './util';

/** NG ワード設定 1 件の型 (config.ngWords の要素) */
type NgWordEntry = (typeof globalThis.config.ngWords)[number];

/** 掲示板 (bbs / jpnkn) の本文で改行として使われる <br> タグ (<br>, <br/>, <br /> を許容) */
const BR_TAG = /<br\s*\/?>/gi;

/** 行分割に使う区切りパターン (normalizeForMatch 後のテキストに適用する) */
const LINE_SPLITTER = /\r\n|\r|\n/;

/**
 * マッチ対象テキストを正規化する。
 * 1. <br> タグを実際の改行文字 \n に変換 (1行判定の分割・^ $ ・\n を全ソースで一致させる)
 * 2. 数値文字参照 (&#10084; → ❤) を復号
 * 3. HTML エンティティ (&gt;&gt;1 → >>1) を復号
 * これによりユーザーは画面で見たままの文字列で NG ワードを書ける。
 */
const normalizeForMatch = (raw: string): string => unescapeHtml(decodeNumericCharRefs(raw.replace(BR_TAG, '\n')));

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

  const normalized = normalizeForMatch(raw);
  const targets = entry.multiline ? [normalized] : normalized.split(LINE_SPLITTER);

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
