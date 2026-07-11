import fs from 'fs';
export const readWavFiles = (path: string): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    fs.readdir(path, (err, files) => {
      if (err) reject(err);
      const fileList = files.filter((file) => {
        return isExistFile(path + '/' + file) && /.*\.wav$/.test(file); //絞り込み
      });
      resolve(fileList);
    });
  });
};

const isExistFile = (file: string) => {
  try {
    fs.statSync(file).isFile();
    return true;
  } catch (err: any) {
    if (err.code === 'ENOENT') return false;
  }
};

export const sleep = (msec: number) => new Promise((resolve) => setTimeout(resolve, msec));

export const escapeHtml = (string: string): string => {
  if (typeof string !== 'string') {
    return string;
  }
  return string.replace(/[&'`"<>]/g, (match) => {
    return (
      {
        '&': '&amp;',
        "'": '&#x27;',
        '`': '&#x60;',
        '"': '&quot;',
        '<': '&lt;',
        '>': '&gt;',
      } as any
    )[match];
  });
};

export const unescapeHtml = (str: string) => {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x60;/g, '`')
    .replace(/&#044;/g, ',')
    .replace(/&amp;/g, '&');
};

const safeFromCodePoint = (codePoint: number, fallback: string): string => {
  if (!Number.isInteger(codePoint) || codePoint <= 0 || codePoint > 0x10ffff) return fallback;
  try {
    return String.fromCodePoint(codePoint);
  } catch {
    return fallback;
  }
};

/**
 * 数値文字参照 (&#10084; / &#x2764; など) を実際の文字に復号する。
 * Shift_JIS 等で表せない文字 (絵文字など) を掲示板がこの形式で dat に保存するため、
 * プレーンテキスト化や読み上げの前に通す。HTML として描画する経路 (チャット窓・配信画面)
 * はブラウザが復号するので不要。
 * unescapeHtml より先に呼ぶこと (&amp;#123; のような「参照の字面」を壊さないため)。
 */
export const decodeNumericCharRefs = (str: string): string => {
  return str
    .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => safeFromCodePoint(parseInt(hex, 16), match))
    .replace(/&#(\d+);/g, (match, dec) => safeFromCodePoint(Number(dec), match));
};

/**
 * Unicode 絵文字にマッチするパターン。
 * Extended_Pictographic (絵文字全般) + 異体字セレクタ + ZWJ + 肌色修飾 + 国旗 + キーキャップ結合。
 * tsconfig の target (ES2015) では正規表現リテラルに \p{...} を書けないため RegExp で構築する。
 */
// eslint-disable-next-line no-misleading-character-class -- ZWJ・修飾子等の構成文字を個別に除去する意図のため問題ない
const EMOJI_PATTERN = new RegExp('[\\p{Extended_Pictographic}\\u{FE0F}\\u{200D}\\u{1F3FB}-\\u{1F3FF}\\u{1F1E6}-\\u{1F1FF}\\u{20E3}]', 'gu');

/** Unicode 絵文字を除去する (読み上げエンジンに絵文字を渡さないため) */
export const removeEmoji = (text: string): string => text.replace(EMOJI_PATTERN, '');

export const convertUrltoImgTagSrc = (imgUrl: string) => {
  // return imgUrl.match(/.+\.(jpg|png|gif)$/) ? imgUrl : `data:image/png;base64,${imgUrl}`;
  return imgUrl;
};

export const judgeAaMessage = (messageList: UserComment[]) => {
  return messageList.map((message) => {
    let isAA = false;
    if (config.aamode.enable) {
      if (config.aamode.condition.length <= message.text.length) isAA = true;
      for (const word of config.aamode.condition.words) {
        if (message.text.includes(word)) isAA = true;
      }
    }

    return {
      ...message,
      isAA,
    };
  });
};

/** 日本語のテキストか */
export const isNihongo = (message: string) => {
  const reg = new RegExp('.*[ぁ-んァ-ヶ亜-熙ａ-ｚＡ-Ｚ]+.*');

  return reg.test(message);
};
