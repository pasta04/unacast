/**
 * ニコ生コメント
 */
import { EventEmitter } from '../EventEmitter';
import axios from 'axios';
import electronlog from 'electron-log';
const log = electronlog.scope('niconama');
import { sleep } from '../util';
import WebSocket from 'ws';
const NicoliveApi = require('./node.js');

type CommentItem = {
  number: string;
  name: string;
  comment: string;
};

type EventMap = {
  comment: [item: CommentItem];
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
  nicoliveClient: typeof NicoliveApi.NicoliveClient = null as any;

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
      this.emit('wait');
      this.pollingStartBroadcast();
    }
  }

  /** ニコ生の配信開始待ち */
  private pollingStartBroadcast = async () => {
    try {
      /** 配信情報 */
      const broadcastHisotoryUrl = `https://live.nicovideo.jp/front/api/v1/user-broadcast-history?providerId=${this.userId}&providerType=user&isIncludeNonPublic=false&offset=0&limit=100&withTotalCount=true`;
      const broadcastHisotory = (await axios.get(broadcastHisotoryUrl)).data;
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
        this.pollingStartBroadcast();
      } else {
        this.emit('start');
        this.fetchComment(liveId);
      }
    } catch (e: any) {
      this.emit('error', new Error(`connection error`));
      log.error(JSON.stringify(e, null, '  '));
      await sleep(this.waitBroadcastPollingInterval * 2);
      this.pollingStartBroadcast();
    }
  };

  /**
   * コメント取得
   * @param liveId liveID
   */
  private fetchComment = async (liveId: string) => {
    log.info(`[fetchComment] liveId = ${liveId}`);

    this.nicoliveClient = new NicoliveApi.NicoliveClient({ liveId: liveId });

    this.nicoliveClient.on('chat', (chat: any) => {
      const comment = chat.content;
      if (!comment) return;

      log.info(`[fetchComment]WS - content: ${comment}`);

      // /で始まるのはなんかコマンドなので除外する
      if (comment.match(/^\/[a-z]+ /)) return;

      const item: CommentItem = {
        number: chat.no.toString(),
        name: '',
        comment: comment,
      };
      this.emit('comment', item);
    });

    this.nicoliveClient.connect();
  };

  /** コメント取得の停止 */
  public stop = () => {
    this.nicoliveClient.disconnect();
    delete this.nicoliveClient;
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
