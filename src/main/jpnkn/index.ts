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

  constructor(boardId: string) {
    super();
    if (!boardId) throw TypeError('Required channelId.');
    this.boardId = boardId;
  }

  public async start() {
    if (this.boardId) {
      this.emit('start');
      this.fetchComment();
    }
  }

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

    const onConnect = (o: pahoMqtt.WithInvocationContext): ReturnType<pahoMqtt.OnSuccessCallback> => {
      client.subscribe(`bbs/${this.boardId}`);
      this.emit('open');
    };
    const onConnectionLost = (e: pahoMqtt.MQTTError) => {
      log.error('[fetchComment] なんかエラーだ');
      log.error(JSON.stringify(e, null, '  '));
      this.emit('error', new Error(`jpnknのWebSocketでError: [${e.errorCode}] ${e.errorMessage}`));
      this.fetchComment();
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
        from: 'jpnkn',
      };
      this.emit('comment', item);
    };
    client.connect({ userName: 'genkai', password: '7144', onSuccess: onConnect, useSSL: true });
    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;

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
