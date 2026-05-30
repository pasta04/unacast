/**
 * ニコ生コメント
 */
import { EventEmitter } from '../EventEmitter';
import axios from 'axios';
import electronlog from 'electron-log';
const log = electronlog.scope('niconama');
import { sleep } from '../util';
import WebSocket from 'ws';
import { NicoliveClient } from '@kikurage/nicolive-api';

type CommentItem = {
  number: string;
  name: string;
  comment: string;
};

type EventMap = {
  comment: [item: CommentItem];
  /** 接続直後に取得した過去コメント一覧 (1 度だけ発火) */
  firstComment: [items: CommentItem[]];
  start: [];
  end: [reason?: string];
  open: [obj: { liveId: string; number: number }];
  error: [error: Error];
  wait: [];
};

class NiconamaComment extends EventEmitter<EventMap> {
  /** ニコニコユーザID */
  userId?: string;
  /** 配信開始待ちのインターバル(ms) */
  waitBroadcastPollingInterval = 5000;
  /** 初期処理のコメントを受信し終わった */
  isFirstCommentReceived = false;
  /** 最新のコメント番号 */
  latestNo = NaN;
  /** コメント取得のWebSocket */
  commentSocket: WebSocket = null as any;
  threadSocket: WebSocket = null as any;
  /** ニコ生チャットWebSocketに対する定期ping */
  commentPingIntervalObj: NodeJS.Timeout = null as any;
  nicoliveClient?: NicoliveClient;
  /** stop() 済みなら true。polling/fetchComment の中断判定に使う */
  private isStop = false;

  constructor(options: { userId: string }) {
    super();
    if ('userId' in options) {
      this.userId = options.userId;
    } else {
      throw TypeError('Required channelId.');
    }
  }

  public async start() {
    if (this.userId) {
      this.isStop = false;
      this.emit('wait');
      this.pollingStartBroadcast();
    }
  }

  /** ニコ生の配信開始待ち */
  private pollingStartBroadcast = async () => {
    if (this.isStop) return;
    try {
      /** 配信情報 */
      const broadcastHisotoryUrl = `https://live.nicovideo.jp/front/api/v2/user-broadcast-history?providerId=${this.userId}&providerType=user&isIncludeNonPublic=false&offset=0&limit=100&withTotalCount=true`;
      const broadcastHisotory = (await axios.get(broadcastHisotoryUrl)).data;
      // 通信中に stop された可能性があるので再チェック
      if (this.isStop) return;
      if (broadcastHisotory.meta.status !== 200) {
        // たぶんサーバ側がエラーになってる
        log.error(JSON.stringify(broadcastHisotory));
        throw new Error(`user-broadcast-history request status code is ${broadcastHisotory.meta.status}`);
      }

      // ON AIRなprogramを探索
      let liveId = '';
      for (const program of broadcastHisotory.data.programsList) {
        if (program.program.schedule.status === 'ON_AIR') {
          liveId = program.id.value;
          break;
        }
      }
      if (!liveId) {
        log.info(`niconico live is not broadcasting. userId = ${this.userId}`);
        await sleep(this.waitBroadcastPollingInterval);
        if (this.isStop) return;
        this.pollingStartBroadcast();
      } else {
        this.emit('start');
        this.fetchComment(liveId);
      }
    } catch (e: any) {
      if (this.isStop) return;
      this.emit('error', new Error(`connection error`));
      log.error(JSON.stringify(e, null, '  '));
      await sleep(this.waitBroadcastPollingInterval * 2);
      if (this.isStop) return;
      this.pollingStartBroadcast();
    }
  };

  /**
   * コメント取得
   * @param liveId liveID
   */
  private fetchComment = async (liveId: string) => {
    if (this.isStop) return;
    log.info(`[fetchComment] liveId = ${liveId}`);

    this.nicoliveClient = new NicoliveClient({ liveId: liveId });

    this.nicoliveClient.on('chat', (chat) => {
      if (this.isStop) return;
      const item = this.chatToCommentItem(chat);
      if (!item) return;
      log.info(`[fetchComment]WS - content: ${item.comment}`);
      this.emit('comment', item);
    });

    // 接続直後に届く過去コメント (pastMessagesLimit に制限済み) を一度だけ受け取る
    this.nicoliveClient.on('pastChats', (chats) => {
      if (this.isStop) return;
      const items = chats.map((c) => this.chatToCommentItem(c)).filter((x): x is CommentItem => x !== null);
      if (items.length === 0) return;
      log.info(`[fetchComment] pastChats received: ${items.length}`);
      this.emit('firstComment', items);
    });

    this.nicoliveClient.connect();
  };

  /** Chat → CommentItem 変換。空コメントやコマンド (/xxx ...) は null を返す */
  private chatToCommentItem = (chat: { content: string; no: number }): CommentItem | null => {
    const comment = chat.content;
    if (!comment) return null;
    if (comment.match(/^\/[a-z]+ /)) return null;
    return {
      number: chat.no.toString(),
      name: '',
      comment,
    };
  };

  /** コメント取得の停止 */
  public stop = () => {
    this.isStop = true;
    // start() 直後で polling 中の場合 nicoliveClient は null なので null チェックする
    if (this.nicoliveClient) {
      this.nicoliveClient.disconnect();
      delete this.nicoliveClient;
    }
    this.isFirstCommentReceived = false;
    this.latestNo = NaN;
    if (this.commentPingIntervalObj) {
      clearInterval(this.commentPingIntervalObj);
      this.commentPingIntervalObj = null as any;
    }
    if (this.commentSocket) this.commentSocket.close();
    if (this.threadSocket) this.threadSocket.close();
    this.emit('end');
  };

  // イベント
  public on(event: 'comment', listener: (comment: CommentItem) => void): this;
  // 接続直後に取得した過去コメント (1 度だけ発火)
  public on(event: 'firstComment', listener: (comments: CommentItem[]) => void): this;
  // コミュニティIDは正常だが配信が開始していない時
  public on(event: 'wait', listener: () => void): this;
  // liveIDが取得できた時
  public on(event: 'start', listener: () => void): this;
  // コメントサーバに接続できた時
  public on(event: 'open', listener: (obj: { liveId: string; number: number }) => void): this;
  // 停止した時
  public on(event: 'end', listener: (reason?: string) => void): this;
  // 何かエラーあった時
  public on(event: 'error', listener: (err: Error) => void): this;
  public on(event: keyof EventMap, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }
}

export default NiconamaComment;
