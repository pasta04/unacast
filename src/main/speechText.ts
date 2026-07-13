/**
 * 読み上げテキストの分割・省略の純粋関数群。
 *
 * main プロセスの読み上げパイプライン (startServer.ts) と renderer の設定 UI の
 * 両方から import できるよう、Electron 依存を持たない (ngWord.ts / yomikoTemplate.ts と同じ流儀)。
 */

export type SplitOptions = {
  /** 最初のチャンクの目標上限 (コードポイント数)。第一声までの合成時間 = 体感レイテンシなので小さくする */
  firstChunkMax: number;
  /** 2番目以降のチャンクの目標上限。再生中に合成できるので大きくして合成回数を減らす */
  chunkMax: number;
  /** これ未満の短片は隣の文と結合する (「はい。」等が単独チャンクにならないように) */
  minChunk: number;
};

/**
 * 分割パラメータの既定値。
 * 文境界で切る限り韻律への影響は小さく、1チャンクに収まる場合は完全に従来動作のため、
 * 現時点では config 化しない (実機で問題が出た場合に設定化する余地あり)。
 */
export const DEFAULT_SPLIT_OPTIONS: SplitOptions = {
  firstChunkMax: 40,
  chunkMax: 120,
  minChunk: 10,
};

/** 文末とみなす文字。区切り文字は直前の文に残す (「？」を落とすと疑問文イントネーションが効かなくなる) */
const SENTENCE_ENDINGS = new Set(['。', '．', '！', '？', '!', '?', '…']);
/** 文中の切れ目候補 (長文の二次分割で使う)。こちらも直前側に残す */
const CLAUSE_BREAKS = new Set(['、', ',', '，', ' ', '　']);

/** 文末記号・改行で文単位に分割する。区切り記号は直前の文に含める。空片は除く */
const splitToSentences = (text: string): string[] => {
  const sentences: string[] = [];
  let current = '';
  // サロゲートペアを壊さないようコードポイント単位で走査する
  for (const ch of text) {
    if (ch === '\n' || ch === '\r') {
      if (current.trim()) sentences.push(current);
      current = '';
      continue;
    }
    current += ch;
    if (SENTENCE_ENDINGS.has(ch)) {
      if (current.trim()) sentences.push(current);
      current = '';
    }
  }
  if (current.trim()) sentences.push(current);
  return sentences;
};

/** 1文が max を超える場合、max 以内の最後の句読点・空白で切る。無ければ max で機械的に切る */
const splitLongSentence = (sentence: string, max: number): string[] => {
  const cps = Array.from(sentence);
  if (cps.length <= max) return [sentence];
  const result: string[] = [];
  let rest = cps;
  while (rest.length > max) {
    let cut = -1;
    for (let i = max - 1; i > 0; i--) {
      if (CLAUSE_BREAKS.has(rest[i])) {
        cut = i + 1; // 句読点は直前側に含める
        break;
      }
    }
    if (cut <= 0) cut = max;
    result.push(rest.slice(0, cut).join(''));
    rest = rest.slice(cut);
  }
  if (rest.length > 0) result.push(rest.join(''));
  return result;
};

const cpLength = (text: string): number => Array.from(text).length;

/**
 * 読み上げテキストをチャンクに分割する。
 *
 * - 文末記号 (。．！？!?…) と改行で文単位に分ける
 * - 1文が chunkMax を超える場合は句読点・空白 (無ければ機械的) で二次分割
 * - 第1チャンクは firstChunkMax 以内、以降は chunkMax 以内で文をまとめる
 * - minChunk 未満の断片は隣と結合する
 * - 全体が firstChunkMax 以内、または結果が1チャンクの場合は [text] を返す (従来動作と同一)
 */
export const splitYomikoText = (text: string, opts: SplitOptions = DEFAULT_SPLIT_OPTIONS): string[] => {
  if (!text || cpLength(text) <= opts.firstChunkMax) return [text];

  const sentences = splitToSentences(text).flatMap((s) => splitLongSentence(s, opts.chunkMax));
  if (sentences.length === 0) return [text];

  // 文を貪欲にまとめてチャンク化する (文間の間は読み子側の句読点処理に任せ、そのまま連結する)
  const chunks: string[] = [];
  let current = '';
  for (const sentence of sentences) {
    const limit = chunks.length === 0 ? opts.firstChunkMax : opts.chunkMax;
    if (current === '') {
      current = sentence;
    } else if (cpLength(current) + cpLength(sentence) <= limit || cpLength(current) < opts.minChunk) {
      // 上限に収まる、または現チャンクが短すぎる場合は結合する
      current += sentence;
    } else {
      chunks.push(current);
      current = sentence;
    }
  }
  if (current !== '') {
    // 末尾の短片は前のチャンクに結合する
    if (cpLength(current) < opts.minChunk && chunks.length > 0) {
      chunks[chunks.length - 1] += current;
    } else {
      chunks.push(current);
    }
  }

  if (chunks.length <= 1) return [text];
  return chunks;
};

export type YomikoOmitConfig = {
  /** 省略機能を使うか */
  enable: boolean;
  /** この文字数 (コードポイント) を超えたら省略する */
  maxLength: number;
};

/** 省略時に末尾へ付ける文言 */
export const OMIT_SUFFIX = '、以下省略';

/**
 * 読み上げ省略ラインを適用する。
 * テンプレート展開・辞書置換など全整形が終わった最終テキストに対して文字数を数え、
 * maxLength を超えていたら先頭 maxLength 文字 + 「、以下省略」に切り詰める。
 * cfg が未定義 (旧設定の持ち込みや main 未初期化) の場合は何もしない。
 */
export const applyYomikoOmit = (text: string, cfg: YomikoOmitConfig | undefined): string => {
  if (!cfg?.enable) return text;
  const maxLength = Math.floor(cfg.maxLength);
  if (!Number.isFinite(maxLength) || maxLength <= 0) return text;
  const cps = Array.from(text);
  if (cps.length <= maxLength) return text;
  return cps.slice(0, maxLength).join('') + OMIT_SUFFIX;
};
