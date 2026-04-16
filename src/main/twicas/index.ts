/**
 * ニコ生コメント
 */
import { EventEmitter } from '../EventEmitter';
import axios from 'axios';
import electronlog from 'electron-log';
const log = electronlog.scope('twicas');
import { sleep } from '../util';
import WebSocket from 'ws';

type CommentItem = {
  /** コメント番号 */
  number: string;
  /** ユーザ名 */
  name: string;
  /** ユーザ画像 */
  imgUrl: string;
  /** コメント */
  comment: string;
};

type GiftItem = {
  name: string;
  /** ユーザ画像 */
  imgUrl: string;
  comment: string;
  gift: {
    name: string;
    image: string;
  };
};

type Author = {
  id: string;
  name: string;
  screenName: string;
  profileImage: string;
  grade: number;
};

type CommentEvent = {
  type: 'comment';
  id: number;
  message: string;
  createdAt: number;
  author: Author;
  numComments: number;
};

type GiftSender = {
  id: string;
  name: string;
  screenName: string;
  profileImage: string;
  grade: number;
};

type GiftEvent = {
  type: 'gift';
  id: string;
  message: string;
  plainMessage: string;
  isPaidGift: boolean;
  item: {
    detailImage: string;
    effectCommand: string;
    image: string;
    name: string;
    showsSenderInfo: boolean;
  };
  createdAt: number;
  sender: GiftSender;
};

type EventData = CommentEvent | GiftEvent | Record<string, any>;

type EventMap = {
  firstComment: [item: CommentItem[]];
  comment: [item: CommentItem];
  gift: [item: GiftItem];
  start: [];
  end: [reason?: string];
  open: [obj: { liveId: string; number: number }];
  error: [error: Error];
  wait: [];
};

class TwicasComment extends EventEmitter<EventMap> {
  /** TwicasユーザID */
  userId: string = '';
  /** 配信開始待ちのインターバル(ms) */
  waitBroadcastPollingInterval = 5000;
  /** 初期処理のコメントを受信し終わった */
  isFirstCommentReceived = false;
  /** 最新のコメント番号 */
  latestNo = NaN;
  liveId = '';
  status: 'wait' | 'polling' | 'start' = 'wait';
  /** コメント取得のWebSocket */
  commentSocket: WebSocket = null as any;
  /** コメントサーバ再接続のタイマー */
  reconnectTimer?: NodeJS.Timeout;

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
      this.status = 'polling';
      this.pollingStartBroadcast();
    }
  }

  private fetchLatestMovie = async (userid: string) => {
    const url = `https://twitcasting.tv/streamserver.php?target=${userid}&mode=client`;
    try {
      log.info(url);
      const res = (await axios.get(url)).data as { movie: { id: number; live: boolean } };
      log.info(JSON.stringify(res.movie));
      if (res.movie) {
        return res.movie;
      } else {
        // 配信履歴が無いパターン
        return { id: '', live: false };
      }
    } catch (e) {
      return { id: '', live: false };
    }
  };

  private fetchEventpubsuburl = async (movie_id: string, password: string = '') => {
    const url = `https://twitcasting.tv/eventpubsuburl.php`;
    const formdata = new FormData();
    formdata.append('movie_id', movie_id);
    formdata.append('__n', new Date().getTime().toString());
    formdata.append('password', password);

    try {
      log.info(`${url} movie_id = ${movie_id}`);
      const res = (await axios.post(url, formdata)).data as { url: string };
      log.info(res);
      return res.url;
    } catch (e) {
      log.error(e);
      return '';
    }
  };

  /** 配信開始待ち */
  private pollingStartBroadcast = async () => {
    if (this.status !== 'polling') return;
    try {
      // 動画IDの取得
      const movie = await this.fetchLatestMovie(this.userId);

      if (!movie.id || !movie.live) {
        log.info(`Twicas live is not broadcasting. userId = ${this.userId}`);
        await sleep(this.waitBroadcastPollingInterval);
        this.pollingStartBroadcast();
      } else {
        this.emit('start');
        this.status = 'start';
        this.liveId = movie.id.toString();
        this.fetchComment();
      }
    } catch (e: any) {
      this.emit('error', new Error(`connection error`));
      log.error(JSON.stringify(e, null, '  '));
      await sleep(this.waitBroadcastPollingInterval * 2);
      this.pollingStartBroadcast();
    }
  };

  private reconnect() {
    clearTimeout(this.reconnectTimer);
    if (this.status === 'wait') return;

    this.status = 'polling';
    this.reconnectTimer = setTimeout(() => {
      this.pollingStartBroadcast();
    }, 5000);
  }

  /**
   * 初期コメント取得
   */
  private fetchInitComment = async () => {
    const time = new Date().getTime();
    const commentNum = 50;
    const url = `https://twitcasting.tv/${this.userId}/userajax.php?c=listall&m=${this.liveId}&n=${commentNum}&f=0&k=0&format=json&__n=${time}`;
    log.info(url);

    try {
      const res = (await axios.get(url)).data as { comments: (CommentEvent | GiftEvent)[] };
      const list: CommentItem[] = res.comments.flatMap((item) => {
        switch (item.type) {
          case 'comment': {
            return [
              {
                name: item.author.name ?? '',
                imgUrl: item.author.profileImage ?? '',
                comment: item.message ?? '',
                number: '',
              },
            ];
          }
          case 'gift': {
            return [
              {
                name: item.sender.name ?? '',
                imgUrl: item.sender.profileImage ?? '',
                comment: `${item.item.name}\n${item.message}`,
                number: '',
              },
            ];
          }
          default:
            return [];
        }
      });

      return list;
    } catch (e) {
      log.error(e);
      return [];
    }
  };

  /**
   * コメント取得
   * @param liveId liveID
   */
  private fetchComment = async () => {
    if (!this.liveId) return;
    log.info(`[fetchComment] liveId = ${this.liveId}`);

    /** コメントサーバのURL */
    const url = await this.fetchEventpubsuburl(this.liveId);
    if (!url) throw new Error('failed to fetch comment server URL');

    // 初期コメント取得
    if (!this.isFirstCommentReceived) {
      const list = await this.fetchInitComment();
      this.emit('firstComment', list);
      this.isFirstCommentReceived = true;
    }

    this.commentSocket = new WebSocket(url);
    this.commentSocket.on('open', () => {
      log.info('接続成功');
      this.emit('open', { liveId: this.liveId, number: -1 });
    });

    this.commentSocket.on('message', (data) => {
      this.handleMessage(data.toString());
    });

    this.commentSocket.on('close', () => {
      log.info('切断されました。5秒後に再接続します...');
      this.reconnect();
    });

    this.commentSocket.on('error', (err) => {
      log.error('WebSocketエラー:', err);
      this.emit('error', new Error('コメントサーバの接続でエラー'));
    });
  };

  private handleMessage(raw: string) {
    try {
      const parsed: EventData[] = JSON.parse(raw);

      for (const event of parsed) {
        switch (event.type) {
          case 'comment':
            this.handleComment(event as CommentEvent);
            break;

          case 'gift':
            this.handleGift(event as GiftEvent);
            break;

          default:
            log.info('その他イベント:', event);
        }
      }
    } catch (err) {
      log.error('JSON解析失敗:', raw);
    }
  }

  private handleComment(comment: CommentEvent) {
    const time = new Date(comment.createdAt).toLocaleString('ja-JP');
    const name = comment.author.name;
    const message = comment.message;
    const num = comment.numComments;
    const icon = comment.author.profileImage;

    const payload: CommentItem = {
      name: name,
      imgUrl: icon,
      comment: message,
      number: num.toString(),
    };
    this.emit('comment', payload);
  }

  private handleGift(gift: GiftEvent) {
    const time = new Date(gift.createdAt).toLocaleString('ja-JP');
    const name = gift.sender.name;
    const icon = gift.sender.profileImage;
    const message = gift.message;
    const payload: GiftItem = {
      name: name,
      imgUrl: icon,
      comment: message,
      gift: {
        name: gift.item.name,
        image: gift.item.image,
      },
    };

    this.emit('gift', payload);
  }

  /** コメント取得の停止 */
  public stop = () => {
    this.status = 'wait';
    this.isFirstCommentReceived = false;
    this.latestNo = NaN;
    this.liveId = '';
    this.commentSocket?.close();
    this.emit('end');
    clearTimeout(this.reconnectTimer);
  };

  // イベント
  public on(event: 'comment', listener: (comment: CommentItem) => void): this;
  public on(event: 'firstComment', listener: (comment: CommentItem[]) => void): this;
  public on(event: 'gift', listener: (comment: GiftItem) => void): this;
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

export default TwicasComment;
