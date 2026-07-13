import { BrowserWindow } from 'electron';
import { ChatClient } from 'dank-twitch-irc';
import { LiveChat } from '../main/youtube-chat';
import NiconamaComment from '../main/niconama';
import TwicasComment from '../main/twicas';
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
    /** ツイキャス */
    let twitcastingChat: TwicasComment;
    /** Azure Speech To Text */
    let azureStt: AzureSpeechToText;
    /** 掲示板の読み込み済みのレス番号 */
    let threadNumber: number;
    /** bbs 板のデフォルトネーム (SETTING.TXT の BBS_NONAME_NAME。匿名判定に使う) */
    let bbsDefaultName: string;
    /** jpnkn Fast 板のデフォルトネーム (匿名判定に使う) */
    let jpnknDefaultName: string;
    /** コメントの処理待ちリスト */
    let commentQueueList: UserComment[];
    /** 翻訳の処理待ちリスト */
    let translateQueueList: UserComment[];
  }

  namespace window_config {
    let taskbar: {
      mainWindow: boolean;
      chatWindow: boolean;
      translateWindow: boolean;
      imagePreviewWindow: boolean;
    };
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
    /** ツイキャスユーザID */
    let twitcastingId: string;

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
    /** iconのパス twicas */
    let iconDirTwitcasting: string;
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
    let typeYomiko: 'none' | 'tamiyasu' | 'bouyomi' | 'voicevox';
    /** 音声認識テキスト読み子の種類 */
    let typeYomikoStt: 'none' | 'tamiyasu' | 'bouyomi' | 'voicevox';
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
    /** VOICE VOX 設定 **/
    let voicevox: {
      /** VOICE VOX CORE のパス **/
      path: string;
      /**
       * エンジン HTTP API の URL。空の場合は既定 (http://127.0.0.1:50021)。
       * DLL が読み込めない場合のフォールバック接続先。AivisSpeech 等の互換エンジンも指定できる。
       */
      engineUrl: string;
      /** 話者とスタイル(名前を\で区切った文字列) **/
      speakerAndStyle: string;
    };
    /** 読み子へ渡す時に改行を置換 */
    let yomikoReplaceNewline: boolean;
    /**
     * 読み上げ省略ライン。
     * テンプレート展開・辞書置換後の最終テキストが maxLength 文字を超えたら
     * 先頭 maxLength 文字 + 「、以下省略」に切り詰める。全読み子種別に共通で効く。
     */
    let yomikoOmit: {
      /** 省略機能を使うか。既定 false */
      enable: boolean;
      /** この文字数を超えたら省略する。既定 100 */
      maxLength: number;
    };
    /**
     * 読み上げテンプレート。
     * プレースホルダ: {text}=本文 / {name}=名前 / {res}=レス番。
     * 値の無いプレースホルダは空文字になる。
     */
    let yomikoTemplate: {
      /** 全ソース共通の既定テンプレート。既定値 '{text}' (= 従来挙動) */
      default: string;
      /**
       * ソース別の上書き。キーが無いソースは default を使う。
       * anonymousTemplate は匿名コメント (bbs/jpnkn: デフォルトネーム一致、niconico: 184) 用。
       * 未設定なら template → default の順でフォールバック。
       */
      perSource: Partial<
        Record<
          CommentSource,
          {
            template?: string;
            anonymousTemplate?: string;
          }
        >
      >;
    };
    /**
     * bbs の匿名判定で「デフォルトネームとみなす名前」の手動指定。
     * 通常は SETTING.TXT の BBS_NONAME_NAME を自動取得するため空でよい。
     * SETTING.TXT を取得できない板向けのフォールバック。
     */
    let bbsAnonymousName: string;
    /**
     * コメント取得 (掲示板/jpnkn/ニコ生/ツイキャス/YouTube/Twitch) が連続で通信エラー状態の時、
     * その状態が継続した秒数がこの値以上になったら通知する。0 以下なら機能 OFF。
     * 取得元ごとに独立に判定し、通知後も状態が継続していれば再度同じ秒数経過時に再通知する。
     */
    let notifyThreadConnectionErrorLimit: number;
    /** スレのレス数が超えた時の通知 */
    let notifyThreadResLimit: number;
    /** 自動スレ移動 */
    let moveThread: boolean;
    /**
     * 自動スレ立て。レス数が resThreshold に達したら現スレの内容を元に次スレを作成する。
     * タイトルは最後に出現する数字をインクリメント (無ければ現タイトルのまま)。
     * 作成のみ行い、移動は既存の自動スレ移動 (moveThread) に任せる。
     * 掲示板への書き込みを伴うため既定は無効。
     */
    let autoCreateThread: {
      enable: boolean;
      /** 発火するレス数 (既定 950) */
      resThreshold: number;
    };
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

    /** REST / WebSocket 経由の外部入力設定 */
    let external: {
      /** 受信を有効にする */
      enabled: boolean;
      /** 外部由来コメント (from が他の既知ソースに該当しない場合) のアイコンディレクトリ */
      iconDir: string;
    };

    /**
     * レス取得元別の出力先フィルタ。
     * 軸ごとに「true: 出力する / false: しない / undefined: 既定 (= true 扱い)」のマップを持つ。
     * 未知のキーは runtime で `!== false` 判定するため、軸/取得元を増やしても旧データの
     * マイグレーションは不要。
     */
    let sourceFilter: {
      /** 配信画面 (HTTP サーバが配信する OBS ブラウザソース) に表示するか */
      broadcast: {
        bbs?: boolean;
        jpnkn?: boolean;
        youtube?: boolean;
        twitch?: boolean;
        niconico?: boolean;
        twitcasting?: boolean;
        stt?: boolean;
        external?: boolean;
      };
    };

    /**
     * NG ワード設定。該当コメントは読み上げ・SE・配信画面で常に非表示。
     * チャット窓では displayType に応じて 'normal' は本文 + マーク、
     * 'transparent' は完全非表示。
     */
    let ngWords: {
      /** NG 判定の対象文字列。matchType=include なら部分一致、regexp なら正規表現ソース */
      word: string;
      /** マッチ方式。'include'=部分一致 (既定) / 'regexp'=正規表現 */
      matchType: 'include' | 'regexp';
      /** true=複数行をまとめて判定 / false=改行で分割し1行ずつ判定 (既定) */
      multiline: boolean;
      /** 判定対象。'text'=本文 (既定) / 'name'=名前 */
      target: 'text' | 'name';
      /**
       * 適用するコメント取得元。
       * 'all' = 全ソースに適用 (現状はこれのみ UI から選択可)。
       * 将来は CommentSource を直接指定して取得元別に切り替えられるよう型は広くしてある。
       */
      source: 'all' | CommentSource;
      /**
       * チャット窓での NG コメントの表示方式。
       * - 'normal' (既定): 本文を表示しつつ NG マークを付ける
       * - 'transparent': 完全に表示しない (痕跡なし)
       */
      displayType: 'normal' | 'transparent';
    }[];
  }
}

export {};
