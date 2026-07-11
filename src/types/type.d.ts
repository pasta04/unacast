type UserComment = {
  /** レス番号 */
  number?: string;
  /** 名前 */
  name: string;
  /** 日付 */
  date?: string;
  /** コメント */
  text: string;
  /** アイコン画像 */
  imgUrl: string;
  threadTitle?: string;
  id?: string;
  email?: string;
  /** ギフト情報 */
  gift?: {
    /** ギフト名 */
    name: string;
    /** ギフト画像 */
    image: string;
  };
  type: 'comment' | 'gift';
  from: 'system' | 'bbs' | 'youtube' | 'twitch' | 'niconico' | 'twitcasting' | 'jpnkn' | 'stt' | 'external';
  /** AAモード判定後に付与される。createDom が読む */
  isAA?: boolean;
  /**
   * 匿名コメントか (bbs/jpnkn: デフォルトネーム一致 / niconico: 184)。
   * 判定できないソースでは undefined。読み上げテンプレートの匿名用切り替えに使う。
   */
  isAnonymous?: boolean;
  /** NGワード判定後に付与される。NGワードに該当した場合 true */
  isNg?: boolean;
  /**
   * NGの表示方法。マッチした NG ワードの displayType から決定される。
   * - 'normal': チャット窓に本文 + NG マークを表示
   * - 'transparent': チャット窓にも表示しない (痕跡を残さない)
   * 配信画面 / 読み上げ / SE は値に関わらず常に対象外。
   * 複数 NG ワードにマッチした場合は 'transparent' が優先される。
   */
  ngDisplayType?: 'normal' | 'transparent';
  /**
   * true の場合、sourceFilter (配信画面表示、将来の SE / 読み上げ等) を
   * 全てバイパスして無条件に各経路へ送る。テストコメントなどで使う。
   * NGワード判定はバイパスしない。
   */
  bypassFilter?: boolean;
};

/** sourceFilter の対象となるレス取得元。'system' は常時表示のため含めない */
type CommentSource = 'bbs' | 'jpnkn' | 'youtube' | 'twitch' | 'niconico' | 'twitcasting' | 'stt' | 'external';

/** sourceFilter の軸。今は配信画面への表示のみ。将来 SE / 読み上げを足す予定 */
type SourceFilterAxis = 'broadcast';

type CommentSocketMessage = {
  type: 'add' | 'reset';
  message: string;
};
