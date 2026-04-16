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
};

type CommentSocketMessage = {
  type: 'add' | 'reset';
  message: string;
};
