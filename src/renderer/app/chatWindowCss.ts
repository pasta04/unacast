/**
 * チャットウィンドウのスタイル設定 (画面から注入するユーザー CSS) の補助関数群。
 *
 * 設定画面の「項目を選んで挿入」とプレビューで使う。React に依存しない純関数のみ置く。
 */

/** スタイルを当てる対象 (チャットウィンドウのコメント DOM のセレクタ) */
export const CSS_TARGETS = [
  { selector: 'body', label: '全体 (背景・既定の文字)' },
  { selector: '.list-item', label: 'コメント1件' },
  { selector: '.res', label: '本文' },
  { selector: '.name', label: '名前' },
  { selector: '.resNumber', label: 'レス番' },
  { selector: '.date', label: '時刻' },
  { selector: '.icon-block', label: 'アイコン' },
  { selector: '.url', label: 'URL' },
  { selector: '.img', label: 'サムネイル画像' },
  { selector: '.aares', label: 'AA' },
  { selector: '.ng-mark', label: 'NGマーク' },
] as const;

/**
 * 設定する項目。
 * - px: 数値入力 (px 単位)
 * - number: 数値入力 (単位なし)
 * - color: カラーピッカー
 * - fixed: 値が決まっている (選ぶだけ)
 */
export type CssPropertyDef =
  { key: string; label: string; property: string; kind: 'px' | 'number' | 'color' } | { key: string; label: string; property: string; kind: 'fixed'; value: string };

export const CSS_PROPERTIES: CssPropertyDef[] = [
  { key: 'fontSize', label: '文字サイズ', property: 'font-size', kind: 'px' },
  { key: 'color', label: '文字色', property: 'color', kind: 'color' },
  { key: 'backgroundColor', label: '背景色', property: 'background-color', kind: 'color' },
  { key: 'bold', label: '太字にする', property: 'font-weight', kind: 'fixed', value: 'bold' },
  { key: 'lineHeight', label: '行間 (倍率)', property: 'line-height', kind: 'number' },
  { key: 'marginBottom', label: '下の余白', property: 'margin-bottom', kind: 'px' },
  { key: 'noShadow', label: '文字の縁取りを消す', property: 'text-shadow', kind: 'fixed', value: 'none' },
  { key: 'hide', label: '非表示にする', property: 'display', kind: 'fixed', value: 'none' },
];

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * CSS テキストの `selector { ... }` ブロックに `property: value;` を書き込む。
 * - 同じセレクタだけのブロックがあれば、その中の同じプロパティを置き換える (無ければ末尾に追加)
 * - ブロックが無ければ、CSS の末尾に新しいブロックを追加する
 * 「.name, .date { }」のような複数セレクタのブロックや @media の中は対象にせず、新しいブロックを足す。
 */
export const upsertCssDeclaration = (css: string, selector: string, property: string, value: string): string => {
  const declaration = `${property}: ${value};`;
  // 行頭 (または } の直後) から始まる、同じセレクタだけのブロック
  const blockRe = new RegExp(`(^|[\\n}])([ \\t]*)${escapeRegExp(selector)}[ \\t]*\\{([^{}]*)\\}`);
  const match = blockRe.exec(css);
  if (match) {
    const body = match[3];
    // 値の終わりは「;」か、ブロック末尾 (後ろに空白しか無い)。値の後ろの空白は残す
    const propRe = new RegExp(`(^|[;{\\s])${escapeRegExp(property)}[ \\t]*:[^;]*?(?:;|(?=\\s*$))`);
    let newBody: string;
    if (propRe.test(body)) {
      newBody = body.replace(propRe, (_m, head: string) => `${head}${declaration}`);
    } else {
      // 末尾の空白・改行を除いて 1 行追加する。中身が空のブロックにも対応する
      const trimmed = body.replace(/\s*$/, '');
      newBody = `${trimmed}\n  ${declaration}\n`;
    }
    const start = match.index + match[1].length;
    const end = match.index + match[0].length;
    return `${css.slice(0, start)}${match[2]}${selector} {${newBody}}${css.slice(end)}`;
  }
  const block = `${selector} {\n  ${declaration}\n}\n`;
  const trimmedCss = css.replace(/\s*$/, '');
  return trimmedCss === '' ? block : `${trimmedCss}\n\n${block}`;
};

/** 項目と入力値から CSS の値を作る。値が不正なら null */
export const buildCssValue = (def: CssPropertyDef, input: string): string | null => {
  switch (def.kind) {
    case 'fixed':
      return def.value;
    case 'color':
      return /^#[0-9a-fA-F]{6}$/.test(input) ? input : null;
    case 'px': {
      const n = Number(input);
      return input.trim() !== '' && Number.isFinite(n) && n >= 0 ? `${n}px` : null;
    }
    case 'number': {
      const n = Number(input);
      return input.trim() !== '' && Number.isFinite(n) && n > 0 ? String(n) : null;
    }
  }
};

/** プレビューに並べるサンプルコメント (チャットウィンドウと同じ DOM 構造。startServer.ts の createDom 参照) */
const SAMPLE_COMMENTS_HTML = `
<li class="list-item">
  <span class="icon-block"><img class="icon" src="../../img/unacast.png"></span>
  <div class="content">
    <span class="resNumber">123</span>
    <span class="name">名無しさん</span>
    <span class="date">2026/10/28(水) 12:34:56</span><br />
    <span class="res">
      掲示板のレスのサンプルです。長い文章は横幅に合わせて折り返されます。<span class="url">https://example.com/</span>
    </span>
  </div>
</li>
<li class="list-item">
  <span class="icon-block"><img class="icon" src="../../img/youtube.png"></span>
  <div class="content">
    <span class="name">YouTubeの視聴者</span><br />
    <span class="res">
      配信のコメントのサンプルです
    </span>
  </div>
</li>
<li class="list-item">
  <span class="icon-block"><img class="icon" src="../../img/twitch.png"></span>
  <div class="content">
    <span class="ng-mark" title="NGワード">🚫</span>
    <span class="name">Twitchの視聴者</span><br />
    <span class="res">
      NGワードに一致したコメントのサンプルです
    </span>
  </div>
</li>
<li class="list-item">
  <span class="icon-block"><img class="icon" src="../../img/unacast.png"></span>
  <div class="content">
    <span class="resNumber">124</span>
    <span class="name">名無しさん</span><br />
    <span class="aares">
      &nbsp;&nbsp;∧＿∧<br />（&#x3000;´∀｀）＜ AAのサンプル
    </span>
  </div>
</li>`;

/**
 * プレビュー用 iframe の srcdoc を作る。
 * CSS の読み込み順はチャットウィンドウ (src/html/chat.html) と同じにする:
 * 共用既定 → アプリ内ウィンドウ既定 → resources/style-server.css → 画面で入力中の CSS。
 * 相対パスを chat.html と同じ位置から解決させるため、設定画面 (index.html と同じ階層) の URL を base にする。
 * 入力中の CSS は id="user-css" の style 要素に入れる (編集のたびに文書を作り直さず、ここだけ書き換えるため)。
 */
export const buildPreviewDocument = (baseHref: string, userCss: string): string => {
  // </style> を含む入力で style 要素が閉じられないようにする
  const safeCss = userCss.replace(/<\/style/gi, '<\\/style');
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <base href="${baseHref.replace(/"/g, '&quot;')}" />
  <link rel="stylesheet" href="../../css/style-server.css" />
  <link rel="stylesheet" href="../../css/style-window.css" />
  <link rel="stylesheet" href="../../../../../style-server.css" />
  <style>body { overflow-y: auto; }</style>
  <style id="user-css">${safeCss}</style>
</head>
<body>
  <div id="parent">
    <ul id="res-list" style="margin: 0px;">${SAMPLE_COMMENTS_HTML}</ul>
  </div>
</body>
</html>`;
};
