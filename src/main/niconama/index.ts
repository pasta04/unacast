/**
 * ニコ生コメント
 */
import { EventEmitter } from 'events';
import axios from 'axios';
import cheerio from 'cheerio';
import electronlog from 'electron-log';
const log = electronlog.scope('niconama');
import { sleep } from '../util';
import WebSocket from 'ws';

type CommentItem = {
  number: string;
  name: string;
  comment: string;
};

type NiconamaApiV2DataTypeRoom = {
  isFirst: boolean;
  messageServer: {
    type: string;
    uri: string;
  };
  name: string;
  threadId: string;
  waybackkey: string;
};

type NiconamaApiV2DataTypeAkashic = {
  contentUrl: string;
  logServerUrl: string;
  playId: string;
  playerId: string;
  status: string;
  token: string;
};

type NiconamaCommentThread = {
  thread: {
    last_res: number;
    resultcode: number;
    revision: number;
    server_time: number;
    thread: string;
    ticket: string;
  };
};

type NiconamaCommentChat = {
  chat: {
    anonymity?: number;
    /** チャットコメント */
    content: string;
    /** Dateを数値化したやつ */
    date: number;
    date_usec: number;
    /** 匿名の時は184が入ってる */
    mail?: string;
    /** コメント番号 */
    no: number;
    /**
     *  謎のフラグ
     * - 1: プレミアム会員
     * - 3: 配信者自身
     */
    premium?: number;
    score?: number;
    thread: string;
    user_id: string;
    vpos: number;
  };
};

class NiconamaComment extends EventEmitter {
  /** ニコニコユーザID */
  userId?: string;
  /** 配信URL */
  liveUrl: string = '';
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
        if (program.program.schedule.status === 'ON AIR') {
          liveId = program.id.value;
          break;
        }
      }
      if (!liveId) {
        await sleep(this.waitBroadcastPollingInterval);
        this.pollingStartBroadcast();
      } else {
        this.emit('start');
        this.liveUrl = `https://live.nicovideo.jp/watch/${liveId}`;
        this.fetchCommentServerThread();
      }
    } catch (e: any) {
      this.emit('error', new Error(`connection error`));
      log.error(JSON.stringify(e, null, '  '));
      await sleep(this.waitBroadcastPollingInterval * 2);
      this.pollingStartBroadcast();
    }
  };

  /**
   * ニコ生のコメントを取得
   */
  private fetchCommentServerThread = async () => {
    log.info(`[fetchCommentServerThread]`);
    // ニコ生の配信ページにアクセス
    const res = await axios.get(this.liveUrl);
    const $ = cheerio.load(res.data);

    // 放送情報を取得
    const embeddedData = JSON.parse($('#embedded-data').attr('data-props') ?? '');
    // log.info(JSON.stringify(embeddedData, null, '  '));

    let broadcastId: string = embeddedData.program.broadcastId || embeddedData.program.reliveProgramId;
    const audienceToken: string = embeddedData.player.audienceToken;
    if (!broadcastId) {
      broadcastId = audienceToken.match(/^\d+/)?.[0] || '';
    }
    const frontendId: string = embeddedData.site.frontendId;

    // スレッドURLを取得
    const threadWssUrl = `wss://a.live2.nicovideo.jp/unama/wsapi/v2/watch/${broadcastId}?audience_token=${audienceToken}&frontend_id=${frontendId}`;
    log.info(threadWssUrl);
    const tWs = new WebSocket(threadWssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36',
      },
    });
    tWs.onmessage = (event) => {
      const obj = JSON.parse(event.data.toString());
      // log.info(JSON.stringify(obj, null, '  '));
      log.info(`[fetchCommentServerThread] WS received - type: ${obj.type}`);
      switch (obj.type) {
        case 'serverTime': {
          // currentMs
          break;
        }
        case 'seat': {
          // keepIntervalSec
          break;
        }
        case 'stream': {
          // hlsのURLとか
          break;
        }
        case 'room': {
          const data = obj.data as NiconamaApiV2DataTypeRoom;
          this.fetchComment(data.messageServer.uri, data.threadId);
          break;
        }
        case 'statistics': {
          // 視聴者数とか
          break;
        }
        case 'schedule': {
          // 開始、終了時刻
          break;
        }
        case 'akashic': {
          const data = obj.data as NiconamaApiV2DataTypeAkashic;
          break;
        }
        case 'ping': {
          tWs.send(JSON.stringify({ type: 'pong' }));
          break;
        }
        // 切断。枠が終了した時もここ。
        case 'disconnect': {
          const data = obj.data;
          this.stop();
          this.start();
          break;
        }
      }
    };
    tWs.on('open', () => {
      log.info('startWatching');
      tWs.send(
        JSON.stringify({
          type: 'startWatching',
          data: { stream: { quality: 'high', protocol: 'hls', latency: 'low', chasePlay: false }, room: { protocol: 'webSocket', commentable: true }, reconnect: false },
        }),
      );

      log.info('getAkashic');
      tWs.send(JSON.stringify({ type: 'getAkashic', data: { chasePlay: false } }));
    });
    tWs.on('error', (event) => {
      log.error('[fetchCommentServerThread] スレッドID取得のWebSocketでエラー。再接続を実施。');
      log.error(JSON.stringify(event, null, '  '));
      this.emit('error', new Error(`スレッドID取得のWebSocketでError`));
      if (tWs.OPEN) tWs.close();
      this.fetchCommentServerThread();
    });
    this.threadSocket = tWs;
  };

  /**
   *
   * @param wsUrl コメントサーバのWebSocket URL
   * @param threadId threadID
   */
  private fetchComment = async (wsUrl: string, threadId: string) => {
    log.info(`[fetchComment] threadId = ${threadId}`);
    const ws = new WebSocket(wsUrl, 'niconama', {
      headers: {
        'Sec-WebSocket-Extensions': 'permessage-deflate; client_max_window_bits',
        'Sec-WebSocket-Protocol': 'msg.nicovideo.jp#json',
      },
    });

    ws.on('message', (event) => {
      const obj = JSON.parse(event.toString());
      // 初回取得時は ping, ping, thread, chat, chat..., ping, pingの順で受け取る

      // log.info(`[fetchComment] WS received  - ${JSON.stringify(obj)}`);

      // コメント番号更新
      if (obj?.chat?.no) {
        this.latestNo = obj.chat.no;
      }

      if (obj?.ping?.content === 'rf:0') {
        this.isFirstCommentReceived = true;
        this.emit('open', { liveId: '', number: this.latestNo });
      }

      if (!this.isFirstCommentReceived) return;
      const chat = obj as NiconamaCommentChat;

      const comment = chat.chat?.content;
      if (!comment) return;

      log.info(`[fetchComment]WS - content: ${comment}`);

      // /で始まるのはなんかコマンドなので除外する
      if (comment.match(/^\/[a-z]+ /)) return;

      const item: CommentItem = {
        number: chat.chat.no.toString(),
        name: '',
        comment: comment,
      };
      this.emit('comment', item);
    });

    ws.on('error', (event) => {
      log.error('[fetchComment]なんかエラーだ');
      log.error(JSON.stringify(event, null, '  '));
      this.emit('error', new Error(`ニコ生チャットのWebSocketでError`));
      if (ws.OPEN) ws.close();
      this.fetchComment(wsUrl, threadId);
    });

    ws.on('open', () => {
      log.info('[fetchComment] connected');
      ws.send(
        JSON.stringify([
          { ping: { content: 'rs:0' } },
          { ping: { content: 'ps:0' } },
          { thread: { thread: threadId, version: '20061206', user_id: 'guest', res_from: -150, with_global: 1, scores: 1, nicoru: 0 } },
          { ping: { content: 'pf:0' } },
          { ping: { content: 'rf:0' } },
        ]),
      );
    });

    // 定期的にping打つ
    this.commentPingIntervalObj = setInterval(() => {
      if (ws.OPEN) {
        ws.ping();
      } else {
        clearInterval(this.commentPingIntervalObj);
      }
    }, 30 * 1000);

    this.commentSocket = ws;
  };

  /** コメント取得の停止 */
  public stop = () => {
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
  public on(event: string | symbol, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }
}

export default NiconamaComment;