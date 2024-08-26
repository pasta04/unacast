import { EventEmitter } from '../EventEmitter';
import axios, { AxiosResponse } from 'axios';
import { actionToRenderer, CommentItem, getContinuation, parseData } from './parser';
import { sleep } from '../util';
import electronlog from 'electron-log';
const log = electronlog.scope('Youtube-chat');

type EventMap = {
  start: [message: string];
  end: [reason?: string];
  firstComment: [item: CommentItem];
  comment: [item: CommentItem];
  open: [obj: { liveId: string; number: number }]
  error: [error: Error];
  wait: [];
};

/**
 * YouTubeライブチャット取得イベント
 */
export class LiveChat extends EventEmitter<EventMap> {
  private static readonly headers = {
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36',
    'Content-Type': 'application/json',
  };
  /** チャンネルID */
  public readonly channelId?: string;
  /** 配信ID */
  public liveId?: string;
  /** コメントAPIKey */
  private commentApiKey = '';
  /** 自分の取得位置を表すID */
  private continuation = '';
  /** 表示済みのコメントID */
  private displayedId: { [commentId: string]: true } = {};
  private isFirst = true;
  private observer?: NodeJS.Timeout;
  /** 停止要求をされた */
  private isStop = false;

  constructor(options: { channelId: string } | { liveId: string }, private interval = 5000) {
    super();
    if ('channelId' in options) {
      this.channelId = options.channelId;
    } else if ('liveId' in options) {
      this.liveId = options.liveId;
    } else {
      throw TypeError('Required channelId or liveId.');
    }
  }

  public start() {
    this.isFirst = true;
    this.isStop = false;
    this.commentApiKey = '';
    this.continuation = '';
    this.fetchLiveId();
  }

  private async fetchLiveId() {
    if (this.isStop) return;
    if (this.channelId) {
      const url = `https://www.youtube.com/channel/${this.channelId}/live`;
      try {
        const liveRes = await axios.get(url, { headers: LiveChat.headers });

        // ライブが始まってなくて、チャンネルのトップに飛ばされているケース
        if (!liveRes.data.match(/liveChatHeaderRenderer/)) {
          // 配信が開始してないパターンが考えられるのでリトライ
          this.emit('error', new Error('Live stream not found'));
          await sleep(2000);
          this.fetchLiveId();
          return;
        }
        this.liveId = liveRes.data.match(/videoId":"(.+?)"/)?.[1] as string;
      } catch (e) {
        // チャンネルID自体が違うのはもうどうしようもないので止める
        this.emit('error', new Error(`connection error url = ${url}`));
        return;
      }
    }

    if (this.liveId) {
      try {
        const init = await this.getInitParam();
        if (init.api && init.continuation) {
          this.commentApiKey = init.api;
          this.continuation = init.continuation;
          this.observer = setInterval(() => this.fetchChat(), this.interval);
          this.emit('start', this.liveId);
        } else {
          // 配信ページはあるのに何らかの理由でAPIKeyが取れなかった
          this.emit('error', new Error(`failed fetch apikey liveId=${this.liveId}`));
          await sleep(2000);
          this.fetchLiveId();
        }
      } catch (e: any) {
        // 考えられるのは、LiveIdを指定していて、ページが取れたが、isLiveNowがfalseだった時
        this.emit('error', new Error(e.message));
        await sleep(2000);
        this.fetchLiveId();
      }
    } else {
      // 配信が開始してないパターンが考えられるのでリトライ
      this.emit('error', new Error('Live stream not found'));
      await sleep(2000);
      this.fetchLiveId();
    }
  }

  public stop(reason?: string) {
    this.isStop = true;
    if (this.observer) {
      clearInterval(this.observer);
      this.emit('end', reason);
    }
    this.displayedId = {};
  }

  private async getInitParam(): Promise<{ api: string; continuation: string }> {
    const url = `https://www.youtube.com/watch?v=${this.liveId}`;
    const res = await axios.get<string>(url);

    let isLiveNow: string | undefined;
    try {
      // 配信中か確認。配信中でなければエラーとみなす
      isLiveNow = res.data
        .match(/isLiveNow":.*?,/)?.[0]
        .split(':')[1]
        .replace(/"/g, '')
        .replace(/,/g, '');
      log.debug(isLiveNow);
    } catch (e: any) {
      log.error(e.message);
      return { api: '', continuation: '' };
    }
    if (isLiveNow === 'false') throw new Error(`liveId = ${this.liveId} is not Live Now`);

    try {
      const key = res.data
        .match(/innertubeApiKey":".*?"/)?.[0]
        .split(':')[1]
        .replace(/"/g, '');

      log.debug(`key is ${key}`);

      const continuation = res.data
        .match(/continuation":".*?"/)?.[0]
        .split(':')[1]
        .replace(/"/g, '');

      log.debug(`initial continuation is ${continuation}`);

      return { api: key as string, continuation: continuation as string };
    } catch (e: any) {
      log.error(e.message);
      return { api: '', continuation: '' };
    }
  }

  private async fetchChat() {
    const url = `https://www.youtube.com/youtubei/v1/live_chat/get_live_chat?key=${this.commentApiKey}`;
    let res: AxiosResponse<GetLiveChatResponse>;
    try {
      const reqBody: GetLiveChageRequestBody = {
        context: {
          client: {
            clientName: 'WEB',
            clientVersion: '2.20210126.08.02',
            timeZone: 'Asia/Tokyo',
            utcOffsetMinutes: 540,
            mainAppWebInfo: {
              graftUrl: `https://www.youtube.com/live_chat?continuation=`, // なんとcontinuationパラメータが空でも通る
            },
          },
          request: {
            useSsl: true,
          },
        },
        continuation: this.continuation,
      };
      log.debug(`POST ${url}`);
      res = await axios
        .post<GetLiveChatResponse>(url, JSON.stringify(reqBody), { headers: LiveChat.headers })
        .then((data) => {
          return data;
        })
        .catch((error: any) => {
          throw new Error(error.message);
        });
      // log.debug(JSON.stringify(res.data.continuationContents));

      const con = getContinuation(res.data);
      if (!con) throw new Error('getContinuation error');
      log.debug(`next continuation is ${con}`);
      this.continuation = con;

      let temp = res.data.continuationContents.liveChatContinuation.actions ?? [];
      if (temp.length === 0) return;

      if (this.isFirst) {
        // 初回のみ、actions配列の末尾は入室メッセージみたいなやつなので除外する
        temp = temp.slice(0, -1);
      }
      temp = temp.filter((v: Action) => {
        const messageRenderer = actionToRenderer(v);
        return messageRenderer !== null && messageRenderer;
      });

      const items = temp.map((v: Action) => parseData(v));

      // 初回取得の場合は初期データとして出力
      items.forEach((v) => {
        if (v) {
          if (this.isFirst) {
            this.emit('firstComment', v);
          } else {
            // 表示済みならスキップ
            if (!this.displayedId[v.id]) {
              this.emit('comment', v);
            }
          }
        }
      });
      this.isFirst = false;

      // 末尾のidを取得
      log.info(`items = ${items.length}`);
      items.forEach((v) => {
        const id = v?.id;
        if (id) this.displayedId[id] = true;
      });
    } catch (e) {
      log.error(e);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      if (res!) {
        log.error(JSON.stringify(res.data));
      }
      this.emit('error', new Error(`Error occured at fetchchat url=${url}`));
    }
  }

  public on(event: 'firstComment', listener: (comment: CommentItem) => void): this;
  public on(event: 'comment', listener: (comment: CommentItem) => void): this;
  public on(event: 'start', listener: (liveId: string) => void): this;
  public on(event: 'end', listener: (reason?: string) => void): this;
  public on(event: 'error', listener: (err: Error) => void): this;
  public on(event: keyof EventMap, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }
}
