/**
 * jpnkn fast
 */
import { EventEmitter } from '../EventEmitter';
import pahoMqtt from 'paho-mqtt';
import electronlog from 'electron-log';
const log = electronlog.scope('jpnkn');
import WebSocket from 'ws';

(global as any).WebSocket = WebSocket;

type EventMap = {
  comment: [item: UserComment];
  start: [];
  open: [];
  end: [reason?: string];
  error: [error: Error];
};

class JpnknFast extends EventEmitter<EventMap> {
  /** ニコニココミュニティID */
  boardId: string;
  /** コメント取得のWebSocket */
  // commentSocket: mqtt.Client = null as any;
  commentSocket: pahoMqtt.Client = null as any;
  /** WebSocketに対する定期ping */
  commentPingIntervalObj: NodeJS.Timeout = null as any;
  /** 再接続待ちのタイマー */
  private reconnectTimer: NodeJS.Timeout | null = null;
  /** 再接続待機時間 (ms) */
  private readonly reconnectIntervalMs = 5000;
  /** stop() 済みなら true。再接続を抑制する */
  private isStopped = false;

  constructor(boardId: string) {
    super();
    if (!boardId) throw TypeError('Required channelId.');
    this.boardId = boardId;
  }

  public async start() {
    if (this.boardId) {
      this.isStopped = false;
      this.emit('start');
      this.fetchComment();
    }
  }

  /** 再接続を一定時間後に予約する */
  private scheduleReconnect = () => {
    if (this.isStopped) return;
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.isStopped) return;
      this.fetchComment();
    }, this.reconnectIntervalMs);
  };

  private fetchComment = async () => {
    log.info(`[fetchComment] boardId = ${this.boardId}`);

    // const client2 = mqtt.connect('mqtt://a.mq.jpnkn.com', { port: 9090, clientId: 'peca' + new Date().getTime() });
    // client2.on('connect', () => {
    //   client2.subscribe(`bbs/${this.boardId}`);
    //   this.emit('open');
    // });
    // client2.on('message', (e) => {
    //   const response: {
    //     bbsid: string;
    //     body: string;
    //     no: string;
    //     threadkey: string;
    //   } = JSON.parse(e);
    //   const res = response.body.split('<>');

    //   const item: UserComment = {
    //     number: response.no,
    //     name: res[0],
    //     date: res[2],
    //     text: res[3],
    //     imgUrl: readIcons.getRandomIcons(),
    //     threadTitle: '',
    //     id: '',
    //     email: res[1],
    //   };
    //   this.emit('comment', item);
    // });
    // client2.on('error', (e) => {
    //   this.emit('error', `${e.name} ${e.message} ${e.stack}`);
    // });

    const client = new pahoMqtt.Client('a.mq.jpnkn.com', 9091, 'peca' + new Date().getTime());

    const onConnect = (_o: pahoMqtt.WithInvocationContext): ReturnType<pahoMqtt.OnSuccessCallback> => {
      client.subscribe(`bbs/${this.boardId}`);
      this.emit('open');
    };
    const onConnectionLost = (e: pahoMqtt.MQTTError) => {
      log.error('[fetchComment] connection lost');
      log.error(JSON.stringify(e, null, '  '));
      this.emit('error', new Error(`jpnknのWebSocketでError: [${e.errorCode}] ${e.errorMessage}`));
      // 即時再接続だと相手側が復旧していない時にループするので、一定時間空けてから再試行
      this.scheduleReconnect();
    };
    // 初回接続失敗 (TLS ハンドシェイク失敗・名前解決失敗等)。
    // onFailure を設定しないと paho-mqtt 側で握り潰され、onConnectionLost も呼ばれずに
    // 黙って死ぬ経路がある (= jpnkn 復旧後も unacast 側が復帰しない事象の原因)。
    const onFailure: pahoMqtt.OnFailureCallback = (e) => {
      log.error('[fetchComment] connect failure');
      log.error(JSON.stringify(e, null, '  '));
      this.emit('error', new Error(`jpnknの接続に失敗: [${e.errorCode}] ${e.errorMessage}`));
      this.scheduleReconnect();
    };
    const onMessageArrived = (e: pahoMqtt.Message) => {
      const response: {
        bbsid: string;
        body: string;
        no: string;
        threadkey: string;
      } = JSON.parse(e.payloadString);
      const res = response.body.split('<>');

      const item: UserComment = {
        number: response.no,
        name: res[0],
        date: res[2],
        text: res[3],
        imgUrl: globalThis.electron.iconList.getBbs(),
        threadTitle: '',
        id: '',
        email: res[1],
        type: 'comment',
        from: 'jpnkn',
      };
      this.emit('comment', item);
    };
    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;
    try {
      client.connect({ userName: 'genkai', password: '7144', onSuccess: onConnect, onFailure, useSSL: true });
    } catch (err) {
      // connect() 自体が同期 throw するケースに備える (ネットワーク初期化失敗等)
      log.error('[fetchComment] connect() threw');
      log.error(err);
      this.emit('error', err instanceof Error ? err : new Error(String(err)));
      this.scheduleReconnect();
      return;
    }

    // // 定期的にping打つ
    // this.commentPingIntervalObj = setInterval(() => {
    //   if (ws.OPEN) {
    //     ws.ping();
    //   } else {
    //     clearInterval(this.commentPingIntervalObj);
    //   }
    // }, 30 * 1000);

    this.commentSocket = client;
  };

  /** コメント取得の停止 */
  public stop = () => {
    this.isStopped = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.commentPingIntervalObj) {
      clearInterval(this.commentPingIntervalObj);
      this.commentPingIntervalObj = null as any;
    }
    if (this.commentSocket && this.commentSocket.isConnected()) this.commentSocket.disconnect();
    // if (this.commentSocket && this.commentSocket.connected) this.commentSocket.end();
    this.emit('end');
  };

  // イベント
  public on(event: 'comment', listener: (comment: UserComment) => void): this;
  // 接続開始時
  public on(event: 'start', listener: () => void): this;
  // サーバに接続できた時
  public on(event: 'open', listener: () => void): this;
  // 停止した時
  public on(event: 'end', listener: (reason?: string) => void): this;
  // 何かエラーあった時
  public on(event: 'error', listener: (err: Error) => void): this;
  public on(event: keyof EventMap, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }
}

export default JpnknFast;
