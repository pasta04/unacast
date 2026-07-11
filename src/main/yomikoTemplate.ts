/**
 * 読み上げテンプレートの解決と展開。
 *
 * sendDom() の読み上げ処理で、読み子へ渡すテキストを
 * 「{name}さん、{text}」「レス{res}番さん、{text}」のように加工する。
 *
 * 設計:
 *  - プレースホルダは {text} (本文) / {name} (名前) / {res} (レス番) の3つ。
 *  - 値が無いプレースホルダは空文字に置換する (レス番の無いソース等)。
 *  - 未知のプレースホルダ ({nmae} 等の typo) は置換せずそのまま残す。
 *    UI 側で findUnknownPlaceholders により入力時に警告する。
 *  - テンプレートの決定は 匿名 ? (anonymousTemplate ?? template ?? default)
 *                        : (template ?? default)。
 *  - システムコメント (from='system') はテンプレート適用外で常に本文のみ。
 *
 * ngWord.ts と同じく pure な実装で、renderer (Yomiko.tsx) からも
 * バリデーション用に import される。
 */

/** 使用できるプレースホルダ名 */
export const KNOWN_PLACEHOLDERS = ['text', 'name', 'res'] as const;

export type YomikoPerSourceTemplate = {
  /** このソースの基本テンプレート。空/未設定なら default を使う */
  template?: string;
  /** 匿名コメント用テンプレート。空/未設定なら template → default の順でフォールバック */
  anonymousTemplate?: string;
};

export type YomikoTemplateConfig = {
  default: string;
  perSource: Partial<Record<CommentSource, YomikoPerSourceTemplate>>;
};

/** テンプレート中の未知のプレースホルダを列挙する (UI バリデーション用) */
export const findUnknownPlaceholders = (template: string): string[] => {
  const found = template.match(/\{[^{}]*\}/g) ?? [];
  const unknown = found.filter((p) => !(KNOWN_PLACEHOLDERS as readonly string[]).includes(p.slice(1, -1)));
  return [...new Set(unknown)];
};

/**
 * メッセージに適用するテンプレートを決定する。
 * config が未設定 (旧設定からの移行直後等) やシステムコメントは '{text}' (従来挙動)。
 */
export const resolveYomikoTemplate = (cfg: YomikoTemplateConfig | undefined, from: UserComment['from'], isAnonymous: boolean | undefined): string => {
  if (!cfg || from === 'system') return '{text}';
  const per = cfg.perSource?.[from as CommentSource];
  const base = per?.template || cfg.default || '{text}';
  if (isAnonymous && per?.anonymousTemplate) return per.anonymousTemplate;
  return base;
};

/**
 * テンプレートを展開する。
 * @param template 適用するテンプレート
 * @param message 対象コメント ({name} {res} の値の元)
 * @param speakText {text} に入れる本文 (呼び出し元でタグ除去等の整形済み。AAモード時は speakWord)
 */
export const applyYomikoTemplate = (template: string, message: { name?: string; number?: string }, speakText: string): string => {
  // 名前にはトリップ等のタグが混ざることがあるため除去する (エンティティの復号は呼び出し元のパイプラインが行う)
  const plainName = (message.name ?? '').replace(/<[^>]+>/g, '').trim();
  return template.replace(/\{[^{}]*\}/g, (placeholder) => {
    switch (placeholder.slice(1, -1)) {
      case 'text':
        return speakText;
      case 'name':
        return plainName;
      case 'res':
        return message.number ?? '';
      default:
        // 未知のプレースホルダはそのまま残す
        return placeholder;
    }
  });
};
