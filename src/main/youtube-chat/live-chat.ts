import { EventEmitter } from '../EventEmitter';
import axios, { AxiosResponse } from 'axios';
import { actionToRenderer, CommentItem, getContinuation, parseData } from './parser';
import { FALLBACK_CLIENT_VERSION, parseWatchPage } from './watchPage';
import { sleep } from '../util';
import electronlog from 'electron-log';
const log = electronlog.scope('Youtube-chat');

/**
 * 接続を始められなかった時の再試行間隔。失敗が続くほど倍にしていき、上限で止める。
 * YouTube にボット確認を求められている時などに、短い間隔で取り直し続けて確認を長引かせないため。
 * 接続できたら最小値に戻す。
 */
const RETRY_MIN_MS = 2 * 1000;
const RETRY_MAX_MS = 60 * 1000;

/** リクエストに追加するヘッダ (YouTube にログイン中なら Cookie・認証ヘッダ) を返す */
export type AuthHeadersProvider = () => Promise<Record<string, string>>;

type EventMap = {
  start: [message: string];
  end: [reason?: string];
  firstComment: [item: CommentItem];
  comment: [item: CommentItem];
  open: [obj: { liveId: string; number: number }];
  error: [error: Error];
  wait: [];
};

/**
 * YouTubeライブチャット取得イベント
 */
export class LiveChat extends EventEmitter<EventMap> {
  private static readonly baseHeaders = {
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
  /** 次に接続を再試行するまでの待ち時間 */
  private retryDelayMs = RETRY_MIN_MS;
  /** コメント取得 API に送るクライアントバージョン (配信ページから取得した現在の値) */
  private clientVersion = FALLBACK_CLIENT_VERSION;
  private readonly getAuthHeaders: AuthHeadersProvider;

  constructor(
    options: ({ channelId: string } | { liveId: string }) & { getAuthHeaders?: AuthHeadersProvider },
    private interval = 5000,
  ) {
    super();
    this.getAuthHeaders = options.getAuthHeaders ?? (async () => ({}));
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
    this.retryDelayMs = RETRY_MIN_MS;
    this.fetchLiveId();
  }

  private async fetchLiveId() {
    if (this.isStop) return;
    if (this.channelId) {
      const url = `https://www.youtube.com/channel/${this.channelId}/live`;
      try {
        const liveRes = await axios.get(url, { headers: await this.headers() });

        // ライブが始まってなくて、チャンネルのトップに飛ばされているケース
        if (!liveRes.data.match(/liveChatHeaderRenderer/)) {
          // 配信が開始してないパターンが考えられるのでリトライ
          this.emit('error', new Error('Live stream not found'));
          await this.waitBeforeRetry();
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
          this.retryDelayMs = RETRY_MIN_MS;
          this.observer = setInterval(() => this.fetchChat(), this.interval);
          this.emit('start', this.liveId);
        } else {
          // 配信ページはあるのに何らかの理由でAPIKeyが取れなかった
          this.emit('error', new Error(`failed fetch apikey liveId=${this.liveId}`));
          await this.waitBeforeRetry();
          this.fetchLiveId();
        }
      } catch (e: any) {
        // 考えられるのは、LiveIdを指定していて、ページが取れたが、isLiveNowがfalseだった時
        this.emit('error', new Error(e.message));
        await this.waitBeforeRetry();
        this.fetchLiveId();
      }
    } else {
      // 配信が開始してないパターンが考えられるのでリトライ
      this.emit('error', new Error('Live stream not found'));
      await this.waitBeforeRetry();
      this.fetchLiveId();
    }
  }

  /** リクエストヘッダ。ログイン中なら Cookie・認証ヘッダを加える */
  private async headers(): Promise<Record<string, string>> {
    return { ...LiveChat.baseHeaders, ...(await this.getAuthHeaders()) };
  }

  /** 再試行の前に待つ。待つたびに次の待ち時間を倍にする (上限 RETRY_MAX_MS) */
  private async waitBeforeRetry() {
    const delay = this.retryDelayMs;
    this.retryDelayMs = Math.min(delay * 2, RETRY_MAX_MS);
    if (delay > RETRY_MIN_MS) log.info(`retry in ${delay / 1000}s`);
    await sleep(delay);
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
    // 配信ページは従来ヘッダ無しで取得している。ログイン中のみ Cookie などを付ける
    const auth = await this.getAuthHeaders();
    const res = await axios.get<string>(url, { headers: auth });
    const page = parseWatchPage(res.data);

    // ボット確認 (「ログインして bot ではないことを確認してください」) などでログインを求められると、
    // 配信ページの代わりに確認画面が返り、コメント取得に必要な情報が入っていない
    if (page.loginRequiredReason) {
      throw new Error(`YouTube にボット確認を求められています (${page.loginRequiredReason})。設定の Youtube で「YouTube にログイン」してください。このまま自動で再接続を続けます`);
    }
    // 配信中か確認。配信中でなければエラーとみなす
    if (page.isLiveNow === false) throw new Error(`liveId = ${this.liveId} is not Live Now`);

    log.debug(`key is ${page.apiKey}`);
    log.debug(`initial continuation is ${page.continuation}`);
    if (page.clientVersion) {
      this.clientVersion = page.clientVersion;
      log.debug(`clientVersion is ${page.clientVersion}`);
    }
    return { api: page.apiKey ?? '', continuation: page.continuation ?? '' };
  }

  private async fetchChat() {
    const url = `https://www.youtube.com/youtubei/v1/live_chat/get_live_chat?key=${this.commentApiKey}`;
    let res: AxiosResponse<GetLiveChatResponse>;
    try {
      const reqBody: GetLiveChageRequestBody = {
        context: {
          client: {
            clientName: 'WEB',
            clientVersion: this.clientVersion,
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
        .post<GetLiveChatResponse>(url, JSON.stringify(reqBody), { headers: await this.headers() })
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
