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
  from: 'system' | 'bbs' | 'youtube' | 'twitch' | 'niconico' | 'twitcasting' | 'jpnkn' | 'stt';
  /** AAモード判定後に付与される。createDom が読む */
  isAA?: boolean;
  /**
   * true の場合、sourceFilter (配信画面表示、将来の SE / 読み上げ等) を
   * 全てバイパスして無条件に各経路へ送る。テストコメントなどで使う。
   */
  bypassFilter?: boolean;
};

/** sourceFilter の対象となるレス取得元。'system' は常時表示のため含めない */
type CommentSource = 'bbs' | 'jpnkn' | 'youtube' | 'twitch' | 'niconico' | 'twitcasting' | 'stt';

/** sourceFilter の軸。今は配信画面への表示のみ。将来 SE / 読み上げを足す予定 */
type SourceFilterAxis = 'broadcast';

type CommentSocketMessage = {
  type: 'add' | 'reset';
  message: string;
};
