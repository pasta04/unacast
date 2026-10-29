/**
 * YouTube Data API v3 (公式 API) でライブチャットを取得する。
 *
 * ページ解析 (LiveChat) が YouTube のボット確認で止まる場合の代わりの取得方法。
 * ユーザー自身の API キーを使う。1日の利用上限 (既定 10,000 ユニット) があり、コメント取得1回で 5 ユニット消費する。
 * イベントは LiveChat と同じ (start / end / firstComment / comment / error)。
 */
import axios from 'axios';
import electronlog from 'electron-log';
import { EventEmitter } from '../EventEmitter';
import { sleep } from '../util';
import type { AuthHeadersProvider, EventMap } from './live-chat';
import type { CommentItem } from './parser';
const log = electronlog.scope('Youtube-api-chat');

const RETRY_MIN_MS = 2 * 1000;
const RETRY_MAX_MS = 60 * 1000;
/** API の推奨間隔 (pollingIntervalMillis) が取れなかった時の下限 */
const MIN_INTERVAL_MS = 1000;

export const DEFAULT_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

/** liveChatMessages.list の1件 */
export type ApiLiveChatMessage = {
  id: string;
  snippet: {
    type: string;
    publishedAt?: string;
    hasDisplayContent?: boolean;
    displayMessage?: string;
    textMessageDetails?: { messageText?: string };
    superChatDetails?: { amountDisplayString?: string; userComment?: string; tier?: number };
    superStickerDetails?: { amountDisplayString?: string; tier?: number; superStickerMetadata?: { altText?: string } };
    memberMilestoneChatDetails?: { userComment?: string };
  };
  authorDetails?: {
    channelId?: string;
    displayName?: string;
    profileImageUrl?: string;
    isChatOwner?: boolean;
    isChatSponsor?: boolean;
  };
};

/** API のエラー応答 ({ error: { errors: [{ reason }] } }) の種類 */
export type ApiErrorKind = 'quota' | 'invalidKey' | 'ended' | 'other';

/** コメントとして表示しない種類 (削除・BAN の通知など) */
const IGNORED_TYPES = new Set(['messageDeletedEvent', 'userBannedEvent', 'chatEndedEvent', 'tombstone', 'pollEvent']);

/** liveChatMessages.list の1件を、ページ解析と同じ CommentItem に変換する。表示しないものは null */
export const toCommentItem = (item: ApiLiveChatMessage): CommentItem | null => {
  const { snippet, authorDetails } = item;
  if (IGNORED_TYPES.has(snippet.type) || snippet.hasDisplayContent === false) return null;

  let text: string | undefined;
  let superchat: CommentItem['superchat'];
  switch (snippet.type) {
    case 'textMessageEvent':
      text = snippet.textMessageDetails?.messageText ?? snippet.displayMessage;
      break;
    case 'superChatEvent':
      // コメント無しのスーパーチャットは空 (ページ解析と同じ)
      text = snippet.superChatDetails?.userComment ?? '';
      superchat = { amount: snippet.superChatDetails?.amountDisplayString ?? '', color: snippet.superChatDetails?.tier ?? 0 };
      break;
    case 'superStickerEvent':
      text = '';
      superchat = { amount: snippet.superStickerDetails?.amountDisplayString ?? '', color: snippet.superStickerDetails?.tier ?? 0 };
      break;
    case 'memberMilestoneChatEvent':
      text = snippet.memberMilestoneChatDetails?.userComment ?? snippet.displayMessage;
      break;
    default:
      // メンバー加入・ギフトなどは、API が用意した表示用の文言を使う
      text = snippet.displayMessage;
  }
  if (text === undefined) return null;

  const name = authorDetails?.displayName ?? '';
  const thumbnailUrl = authorDetails?.profileImageUrl;
  return {
    id: item.id,
    author: {
      name,
      thumbnail: thumbnailUrl ? { url: thumbnailUrl, width: 88, height: 88, alt: name } : undefined,
      channelId: authorDetails?.channelId ?? '',
    },
    message: text ? [{ text }] : [],
    superchat,
    membership: !!authorDetails?.isChatSponsor,
    isOwner: !!authorDetails?.isChatOwner,
    timestamp: snippet.publishedAt ? Date.parse(snippet.publishedAt) : Date.now(),
  };
};

/** API のエラー応答の種類を判定する */
export const classifyApiError = (data: any): ApiErrorKind => {
  const error = data?.error;
  const reasons: string[] = [...(error?.errors ?? []).map((e: any) => e?.reason), ...(error?.details ?? []).map((d: any) => d?.reason)].filter(Boolean);
  if (reasons.some((r) => r === 'quotaExceeded' || r === 'dailyLimitExceeded')) return 'quota';
  if (reasons.some((r) => ['keyInvalid', 'API_KEY_INVALID', 'accessNotConfigured', 'SERVICE_DISABLED'].includes(r)) || /API key not valid/i.test(error?.message ?? ''))
    return 'invalidKey';
  if (reasons.some((r) => r === 'liveChatEnded')) return 'ended';
  return 'other';
};

/** 停止させるエラー (再試行しても直らない) */
class FatalApiError extends Error {}

export class ApiLiveChat extends EventEmitter<EventMap> {
  public readonly channelId?: string;
  public liveId?: string;
  private liveChatId = '';
  private pageToken: string | undefined;
  private displayedId: { [commentId: string]: true } = {};
  private isFirst = true;
  private isStop = true;
  private timer?: NodeJS.Timeout;
  private retryDelayMs = RETRY_MIN_MS;
  /** 停止・再開をまたいで古いループが動き続けないための世代番号 */
  private generation = 0;
  private readonly apiKey: string;
  private readonly intervalMs: number;
  private readonly baseUrl: string;
  private readonly getAuthHeaders: AuthHeadersProvider;

  /**
   * @param options.intervalSec コメントの取得間隔 (秒)。API が指示する間隔の方が長ければそちらに従う
   * @param options.baseUrl API の URL (確認用に差し替えられるようにしている)
   * @param options.getAuthHeaders チャンネル ID から配信を探す時のページ取得に付けるヘッダ
   */
  constructor(
    options: ({ channelId: string } | { liveId: string }) & {
      apiKey: string;
      intervalSec: number;
      baseUrl?: string;
      getAuthHeaders?: AuthHeadersProvider;
    },
  ) {
    super();
    if ('liveId' in options && options.liveId) {
      this.liveId = options.liveId;
    } else if ('channelId' in options && options.channelId) {
      this.channelId = options.channelId;
    } else {
      throw TypeError('Required channelId or liveId.');
    }
    this.apiKey = options.apiKey;
    this.intervalMs = Math.max(MIN_INTERVAL_MS, (Number(options.intervalSec) || 10) * 1000);
    this.baseUrl = options.baseUrl ?? DEFAULT_API_BASE_URL;
    this.getAuthHeaders = options.getAuthHeaders ?? (async () => ({}));
  }

  public start() {
    this.generation++;
    this.isStop = false;
    this.isFirst = true;
    this.liveChatId = '';
    this.pageToken = undefined;
    this.retryDelayMs = RETRY_MIN_MS;
    if (this.channelId) this.liveId = undefined;
    void this.connect(this.generation);
  }

  public stop(reason?: string) {
    const wasRunning = !!this.liveChatId;
    this.isStop = true;
    this.generation++;
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    if (wasRunning) this.emit('end', reason);
    this.liveChatId = '';
    this.displayedId = {};
  }

  private isCurrent(generation: number) {
    return !this.isStop && generation === this.generation;
  }

  /** 配信と、そのチャットの ID を特定してコメント取得を始める */
  private async connect(generation: number) {
    while (this.isCurrent(generation)) {
      try {
        if (!this.liveId && this.channelId) this.liveId = await this.findLiveIdFromChannel(this.channelId);
        if (!this.liveId) {
          this.emit('error', new Error('Live stream not found'));
        } else {
          const liveChatId = await this.fetchActiveLiveChatId(this.liveId);
          if (!this.isCurrent(generation)) return;
          if (liveChatId) {
            this.liveChatId = liveChatId;
            this.retryDelayMs = RETRY_MIN_MS;
            this.emit('start', this.liveId);
            void this.poll(generation);
            return;
          }
          this.emit('error', new Error(`liveId = ${this.liveId} is not Live Now`));
          if (this.channelId) this.liveId = undefined;
        }
      } catch (e: any) {
        if (e instanceof FatalApiError) {
          this.emit('error', e);
          this.stop();
          return;
        }
        this.emit('error', new Error(e.message));
      }
      await this.waitBeforeRetry();
    }
  }

  private async poll(generation: number) {
    if (!this.isCurrent(generation)) return;
    let wait: number;
    try {
      const res = await this.callApi('liveChat/messages', {
        liveChatId: this.liveChatId,
        part: 'snippet,authorDetails',
        maxResults: '200',
        ...(this.pageToken ? { pageToken: this.pageToken } : {}),
      });
      if (!this.isCurrent(generation)) return;
      this.pageToken = res.nextPageToken ?? this.pageToken;
      wait = Math.max(this.intervalMs, Number(res.pollingIntervalMillis) || 0);
      this.retryDelayMs = RETRY_MIN_MS;

      const items = ((res.items ?? []) as ApiLiveChatMessage[]).map(toCommentItem).filter((v): v is CommentItem => !!v);
      for (const item of items) {
        if (this.isFirst) {
          this.emit('firstComment', item);
        } else if (!this.displayedId[item.id]) {
          this.emit('comment', item);
        }
        this.displayedId[item.id] = true;
      }
      if (items.length > 0) log.info(`items = ${items.length}`);
      this.isFirst = false;

      if (res.offlineAt) {
        this.stop('offline');
        return;
      }
    } catch (e: any) {
      if (!this.isCurrent(generation)) return;
      if (e instanceof FatalApiError) {
        this.emit('error', e);
        this.stop();
        return;
      }
      if (e.message === 'liveChatEnded') {
        this.stop('liveChatEnded');
        return;
      }
      this.emit('error', new Error(e.message));
      wait = this.retryDelayMs;
      this.retryDelayMs = Math.min(this.retryDelayMs * 2, RETRY_MAX_MS);
    }
    if (!this.isCurrent(generation)) return;
    this.timer = setTimeout(() => void this.poll(generation), wait);
  }

  /** videos.list で配信中のチャット ID を取る。配信中でなければ undefined */
  private async fetchActiveLiveChatId(videoId: string): Promise<string | undefined> {
    const res = await this.callApi('videos', { part: 'liveStreamingDetails', id: videoId });
    return res.items?.[0]?.liveStreamingDetails?.activeLiveChatId;
  }

  /**
   * チャンネルの配信中の動画 ID を、ページ解析と同じくチャンネルの /live ページから取る。
   * (API の search.list は1回 100 ユニットと高いため使わない)
   */
  private async findLiveIdFromChannel(channelId: string): Promise<string | undefined> {
    const url = `https://www.youtube.com/channel/${channelId}/live`;
    const res = await axios.get<string>(url, { headers: await this.getAuthHeaders() });
    if (!/liveChatHeaderRenderer/.test(res.data)) return undefined;
    return res.data.match(/videoId":"(.+?)"/)?.[1];
  }

  private async callApi(path: string, params: Record<string, string>): Promise<any> {
    const url = `${this.baseUrl}/${path}`;
    log.debug(`GET ${url}`);
    try {
      const res = await axios.get(url, { params: { ...params, key: this.apiKey } });
      return res.data;
    } catch (e: any) {
      const data = e?.response?.data;
      if (!data) throw new Error(`YouTube API への接続に失敗しました (${e?.message})`, { cause: e });
      log.error(JSON.stringify(data));
      switch (classifyApiError(data)) {
        case 'quota':
          throw new FatalApiError('YouTube API の1日の利用上限に達しました。取得間隔を長くするか、翌日 (太平洋時間の0時以降) に再接続してください', { cause: e });
        case 'invalidKey':
          throw new FatalApiError('YouTube API の API キーが正しくないか、YouTube Data API v3 が有効になっていません', { cause: e });
        case 'ended':
          throw new Error('liveChatEnded', { cause: e });
        default:
          throw new Error(`YouTube API エラー: ${data?.error?.message ?? e.message}`, { cause: e });
      }
    }
  }

  private async waitBeforeRetry() {
    const delay = this.retryDelayMs;
    this.retryDelayMs = Math.min(delay * 2, RETRY_MAX_MS);
    if (delay > RETRY_MIN_MS) log.info(`retry in ${delay / 1000}s`);
    await sleep(delay);
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
