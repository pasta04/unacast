import { BrowserWindow } from 'electron';
import { ChatClient } from 'dank-twitch-irc';
import { LiveChat } from '../main/youtube-chat';
import NiconamaComment from '../main/niconama';
import JpnknFast from '../main/jpnkn';
import CommentIcons from '../main/CommentIcons';
import AzureSpeechToText from '../main/azureStt';

declare global {
  namespace electron {
    let mainWindow: BrowserWindow;
    let chatWindow: BrowserWindow;
    let translateWindow: BrowserWindow;
    let imagePreviewWindow: BrowserWindow;

    let iconList: CommentIcons;

    /** SEファイルリスト */
    let seList: string[];
    /** Twitchチャットインスタンス */
    let twitchChat: ChatClient;
    /** Youtubeチャットインスタンス */
    let youtubeChat: LiveChat;
    /** jpnknFast */
    let jpnknFast: JpnknFast;
    /** ニコ生チャットインスタンス */
    let niconicoChat: NiconamaComment;
    /** Azure Speech To Text */
    let azureStt: AzureSpeechToText;
    /** 掲示板の読み込み済みのレス番号 */
    let threadNumber: number;
    /** 掲示板との連続通信エラー回数 */
    let threadConnectionError: number;
    /** コメントの処理待ちリスト */
    let commentQueueList: UserComment[];
    /** 翻訳の処理待ちリスト */
    let translateQueueList: UserComment[];
  }
  namespace config {
    /** 掲示板URL */
    let url: string;
    /** jpnkn Fastインタフェース 掲示板ID */
    let jpnknFastBoardId: string;
    /** Youtube チャンネルID */
    let youtubeId: string;
    /** Youtube LiveID */
    let youtubeLiveId: string;
    /** Twitch ユーザID */
    let twitchId: string;
    /** ニコニココミュニティID */
    let niconicoId: string;

    /** Azure Speech To Text 設定 **/
    let azureStt: {
      /** 有効にするかどうか **/
      enable: boolean;
      /** サブスクリプションキー **/
      key: string;
      /** サブスクリプションリージョン **/
      region: string;
      /** 発言者表示名 **/
      name: string;
      /** 認識言語 **/
      language: 'ja-JP' | 'en-US';
      /** 入力デバイスID **/
      inputDevice: string;
    };

    /** 開始レス番号 */
    let resNumber: string;
    /** 初期表示テキスト */
    let initMessage: string;
    /** ポート番号 */
    let port: number;
    /** 表示レス数 */
    let dispNumber: number;
    /** 更新間隔 */
    let interval: number;
    /**
     * レス表示順序
     * - true: 新着が下
     * - false: 新着が上
     */
    let dispSort: boolean;
    /**
     * レス表示時間(秒)
     */
    let minDisplayTime: number;
    /**
     * 名前と本文を改行で分ける
     * - true: 分ける
     * - false: 分けない
     */
    let newLine: boolean;
    /** アイコン表示 */
    let showIcon: boolean;
    /** レス番表示 */
    let showNumber: boolean;
    /** 名前表示 */
    let showName: boolean;
    /** 時刻表示 */
    let showTime: boolean;
    /** 自動改行 */
    let wordBreak: boolean;
    /**
     * サムネイル表示
     * - 0: 表示しない
     * - 1: チャットウィンドウのみ表示
     * - 2: チャットウィンドウとサーバに表示
     */
    let thumbnail: 0 | 1 | 2;
    /** 画像URLの非表示化 */
    let hideImgUrl: boolean;
    /** エモートの表示設定 */
    let emoteAnimation: boolean;
    /** エモートサイズ */
    let emoteSize: 1 | 2 | 3;
    /** iconのパス bbs */
    let iconDirBbs: string;
    /** iconのパス Youtube */
    let iconDirYoutube: string;
    /** iconのパス Twitch */
    let iconDirTwitch: string;
    /** iconのパス niconico */
    let iconDirNiconico: string;
    /** iconのパス 音声認識 */
    let iconDirStt: string;
    /** レス着信音のパス */
    let sePath: string;
    /** レス着信音再生 */
    let playSe: boolean;
    /** レス着信音音量 */
    let playSeVolume: number;
    /** 音声認識レス着信音再生 */
    let playSeStt: boolean;
    /** 読み子の種類 */
    let typeYomiko: 'none' | 'tamiyasu' | 'bouyomi';
    /** 音声認識テキスト読み子の種類 */
    let typeYomikoStt: 'none' | 'tamiyasu' | 'bouyomi';
    let yomikoDictionary: {
      /** 置き換えられるテキストパターン **/
      pattern: string;
      /** 置き換える文字列 **/
      pronunciation: string;
    }[];
    /** 民安Talkのファイルパス */
    let tamiyasuPath: string;
    /** 棒読みちゃんの待ち受けポート */
    let bouyomiPort: number;
    /** 棒読みちゃんの音量 */
    let bouyomiVolume: number;
    /** 棒読みちゃんへ送るときのプレフィックス */
    let bouyomiPrefix: string;
    /** 読み子へ渡す時に改行を置換 */
    let yomikoReplaceNewline: boolean;
    /** スレが通信エラーになった時の通知閾値 */
    let notifyThreadConnectionErrorLimit: number;
    /** スレのレス数が超えた時の通知 */
    let notifyThreadResLimit: number;
    /** 自動スレ移動 */
    let moveThread: boolean;
    /**
     * レスの処理方法
     * - 0: 新着を優先
     * - 1: 1個ずつ順に処理
     */
    let commentProcessType: 0 | 1;
    /**
     * コメント表示方法
     * - 0: チャット風
     * - 1: SpeechCast風
     */
    let dispType: 0 | 1;

    let aamode: {
      enable: boolean;
      condition: {
        length: number;
        words: string[];
      };
      speakWord: string;
    };

    let translate: {
      enable: boolean;
      targetLang: 'ja' | 'en';
    };
    let audioOutputDevices: string[];
  }
}

export { };
