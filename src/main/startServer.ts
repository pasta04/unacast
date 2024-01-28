/* eslint-disable @typescript-eslint/camelcase */
import http from 'http';
import path from 'path';
import express, { Request, Response } from 'express';
import axios from 'axios';
import cors from 'cors';
import log from 'electron-log';
import { ChatClient } from 'dank-twitch-irc';
import { LiveChat } from './youtube-chat';
import { ipcMain } from 'electron';
import expressWs from 'express-ws';
import { readWavFiles, sleep, escapeHtml, unescapeHtml, judgeAaMessage, isNihongo } from './util';
// レス取得APIをセット
import getRes, { getRes as getBbsResponse, getThreadList, threadUrlToBoardInfo } from './getRes';
import { CommentItem, ImageItem } from './youtube-chat/parser';
import bouyomiChan from './bouyomi-chan';
import VoiceVoxClient from './voicevox';
import { spawn } from 'child_process';
import { electronEvent } from './const';
import NiconamaComment from './niconama';
import JpnknFast from './jpnkn';
import AzureSpeechToText from './azureStt';
import tr from 'googletrans';
import CommentIcons from './CommentIcons';

let app: expressWs.Instance['app'];

// サーバーをグローバル変数にセットできるようにする（サーバー停止処理のため）
let server: http.Server;

/** 棒読みちゃんインスタンス */
let bouyomi: bouyomiChan;

/** VoiceVoxインスタンス */
let voiceVox: VoiceVoxClient;

/** スレッド定期取得実行するか */
let threadIntervalEvent = false;

/** キュー処理実行するか */
let isExecuteQue = false;

/** 接続中の全WebSocket */
let aWss: ReturnType<expressWs.Instance['getWss']>;

let serverId = 0;

/**
 * VOICEVOX の読み込み(Rendererからの要求による)
 */
const loadVoiceVox = async (config_voicevox: typeof config['voicevox'], force = false) => {
  if (!voiceVox?.available || force) {
    voiceVox = new VoiceVoxClient({ path: config_voicevox.path });
  }
  const configuration = {
    path: voiceVox.path,
    available: voiceVox.available,
    speakerAndStyle: config_voicevox.speakerAndStyle,
    speakers: voiceVox.speakers.reduce((state: { speaker: string; style: string }[], speaker) => {
      return state.concat(
        speaker.styles.map((style) => {
          return { speaker: speaker.name, style: style.name };
        }),
      );
    }, []),
  };
  globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_VOICEVOX_CONFIG, configuration);
};

ipcMain.on(electronEvent.LOAD_VOICEVOX, async (event: any, config_voicevox: typeof config['voicevox']) => {
  loadVoiceVox(config_voicevox, false);
});

/**
 * 設定の適用
 */
ipcMain.on(electronEvent.APPLY_CONFIG, async (event: any, config: typeof globalThis['config']) => {
  log.info('[apply-config] start');
  log.info(config);

  // Configの変更内容に応じて何かする
  const oldConfig = globalThis.config;
  const isChangedUrl = globalThis.config.url !== config.url;
  const isChangeSePath = globalThis.config.sePath !== config.sePath;
  globalThis.config = config;

  // 着信音のパス
  if (isChangeSePath) {
    await findSeList();
  }

  // initメッセージ
  resetInitMessage();

  // iconを設定
  globalThis.electron.iconList = new CommentIcons({
    bbs: config.iconDirBbs,
    youtube: config.iconDirYoutube,
    twitch: config.iconDirTwitch,
    niconico: config.iconDirNiconico,
    stt: config.iconDirStt,
  });

  // スレのURLが変わった
  if (isChangedUrl && config.url) {
    // 新スレを取得
    const ret = await getBbsResponse(globalThis.config.url, NaN);
    log.debug(ret);
    if (ret.length === 0) {
      globalThis.electron.mainWindow.webContents.send(electronEvent.SHOW_ALERT, '掲示板URLがおかしそうです');
      return;
    }
    globalThis.electron.threadNumber = Number(ret[ret.length - 1].number);
    log.info(`[apply-config] new res num is ${globalThis.electron.threadNumber}`);
    // チャットウィンドウとブラウザに、末尾のスレだけ反映する
    sendDom([ret[ret.length - 1]]);

    // スレタイ更新
    globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, { commentType: 'bbs', category: 'title', message: ret[0].threadTitle });
  }

  // VOICE VOX 関連
  if (config.typeYomiko === 'voicevox' || config.typeYomikoStt === 'voicevox') {
    // VOICEVOX 利用の場合のみ
    if (oldConfig.voicevox?.path !== config.voicevox?.path) {
      // VOICEVOX 読み込み先パスが変わっていれば強制読み込み直し
      loadVoiceVox(config.voicevox, true);
    } else {
      // パスが変わっていない場合は未読み込みの時だけ読み込む
      loadVoiceVox(config.voicevox, false);
    }
  }
  if (voiceVox) {
    voiceVox.speaker = config.voicevox?.speakerAndStyle || '';
    voiceVox.prefix = config.bouyomiPrefix;
    voiceVox.volume = config.bouyomiVolume;
  }
});

/**
 * サーバー起動
 */
ipcMain.on(electronEvent.START_SERVER, async (event: any, config: typeof globalThis['config']) => {
  globalThis.electron.chatWindow.webContents.send(electronEvent.CLEAR_COMMENT);
  globalThis.electron.translateWindow.webContents.send(electronEvent.CLEAR_COMMENT);
  globalThis.electron.threadNumber = 0;
  globalThis.electron.commentQueueList = [];
  globalThis.electron.threadConnectionError = 0;
  serverId = new Date().getTime();

  const expressApp = express();
  expressApp.use(cors());
  const expressInstance = expressWs(expressApp);
  app = expressInstance.app;
  aWss = expressInstance.getWss();

  app.set('view engine', 'ejs');
  // viewディレクトリの指定
  app.set('views', path.resolve(__dirname, '../views'));

  // 設定情報をグローバル変数へセットする
  globalThis.config = config;

  log.debug('[startServer]設定値 = ');
  log.debug(globalThis.config);

  app.get('/', (req: Request, res: Response, next) => {
    res.render('server', config);
    req.connection.end();
  });

  // サーバー設定のIF
  app.get('/config', (req: Request, res: Response, next) => {
    res.send(JSON.stringify(globalThis.config));
  });

  // 静的コンテンツはpublicディレクトリの中身を使用するという宣言
  app.use(express.static(path.resolve(__dirname, '../public')));

  // 2ch互換掲示板の取得
  app.use('/getRes', getRes);

  // iconを設定
  globalThis.electron.iconList = new CommentIcons({
    bbs: globalThis.config.iconDirBbs,
    youtube: globalThis.config.iconDirYoutube,
    twitch: globalThis.config.iconDirTwitch,
    niconico: globalThis.config.iconDirNiconico,
    stt: globalThis.config.iconDirStt,
  });

  // SEを取得する
  if (globalThis.config.sePath) {
    findSeList();
  }

  // Twitchに接続
  if (globalThis.config.twitchId) {
    startTwitchChat();
  }

  // Youtubeチャット
  if (globalThis.config.youtubeId || globalThis.config.youtubeLiveId) {
    startYoutubeChat();
  }

  // ニコ生
  if (globalThis.config.niconicoId) {
    const nico = new NiconamaComment({ communityId: globalThis.config.niconicoId });
    globalThis.electron.niconicoChat = nico;
    nico.on('start', () => {
      globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, { commentType: 'niconico', category: 'status', message: `connection waiting` });
    });

    nico.on('wait', () => {
      globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, { commentType: 'niconico', category: 'status', message: `wait for starting boradcast` });
    });

    nico.on('open', (event) => {
      globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, {
        commentType: 'niconico',
        category: 'status',
        message: `ok No=${event.number}`,
      });
      globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, {
        commentType: 'niconico',
        category: 'liveId',
        message: `${event.liveId}`,
      });
    });

    nico.on('comment', (event) => {
      globalThis.electron.commentQueueList.push({
        imgUrl: globalThis.electron.iconList.getNiconico(),
        number: event.number,
        name: event.name,
        text: event.comment,
        from: 'niconico',
      });
      globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, {
        commentType: 'niconico',
        category: 'status',
        message: `ok No=${event.number}`,
      });
    });
    // 切断とか枠終了とか
    nico.on('end', () => {
      globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, {
        commentType: 'niconico',
        category: 'status',
        message: `disconnect`,
      });
    });
    nico.on('error', () => {
      globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, { commentType: 'niconico', category: 'status', message: `error` });
    });
    nico.start();
  }

  // jpnkn
  if (globalThis.config.jpnknFastBoardId) {
    const jpn = new JpnknFast(globalThis.config.jpnknFastBoardId);
    globalThis.electron.jpnknFast = jpn;
    jpn.on('start', () => {
      globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, { commentType: 'jpnkn', category: 'status', message: `connection waiting` });
    });

    jpn.on('open', () => {
      globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, {
        commentType: 'jpnkn',
        category: 'status',
        message: `ok`,
      });
    });

    jpn.on('comment', (event) => {
      globalThis.electron.commentQueueList.push({ ...event, imgUrl: globalThis.electron.iconList.getBbs() });
      globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, {
        commentType: 'jpnkn',
        category: 'status',
        message: `ok No=${event.number}`,
      });
    });
    // 切断とか枠終了とか
    jpn.on('end', () => {
      globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, {
        commentType: 'jpnkn',
        category: 'status',
        message: `disconnect`,
      });
    });
    jpn.on('error', () => {
      globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, { commentType: 'jpnkn', category: 'status', message: `error` });
    });
    jpn.start();
  }

  // 棒読みちゃん接続
  if (config.typeYomiko === 'bouyomi' || config.typeYomikoStt === 'bouyomi') {
    if (config.bouyomiPort) {
      bouyomi = new bouyomiChan({ port: config.bouyomiPort, volume: config.bouyomiVolume, prefix: config.bouyomiPrefix });
    }
  }

  // VoiceVox 接続
  if (config.typeYomiko === 'voicevox' || config.typeYomikoStt === 'voicevox') {
    if (config.voicevox) {
      if (!voiceVox?.available) {
        voiceVox = new VoiceVoxClient({
          path: config.voicevox.path,
          speaker: config.voicevox.speakerAndStyle,
          volume: config.bouyomiVolume,
          prefix: config.bouyomiPrefix,
        });
      } else {
        voiceVox.speaker = config.voicevox.speakerAndStyle;
        voiceVox.volume = config.bouyomiVolume;
        voiceVox.prefix = config.bouyomiPrefix;
      }
    }
  }

  // Azure SpeechToText
  if (globalThis.config.azureStt && globalThis.config.azureStt.enable && globalThis.config.azureStt.key && globalThis.config.azureStt.region) {
    const stt = new AzureSpeechToText(
      globalThis.config.azureStt.name || '',
      globalThis.config.azureStt.key,
      globalThis.config.azureStt.region,
      globalThis.config.azureStt.language || 'ja-JP',
      globalThis.config.azureStt.inputDevice,
    );
    globalThis.electron.azureStt = stt;
    stt.on('start', () => {
      globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, {
        commentType: 'stt',
        category: 'status',
        message: `started`,
      });
    });

    stt.on('comment', (event) => {
      globalThis.electron.commentQueueList.push({ ...event, imgUrl: globalThis.electron.iconList.getStt() });
      globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, {
        commentType: 'stt',
        category: 'status',
        message: `ok`,
      });
    });
    // 読み取り終了
    stt.on('end', () => {
      globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, {
        commentType: 'stt',
        category: 'status',
        message: `stopped`,
      });
    });
    stt.on('error', () => {
      globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, {
        commentType: 'stt',
        category: 'status',
        message: `error`,
      });
    });
    stt.start();
  }

  // レス取得定期実行
  threadIntervalEvent = true;
  getResInterval(serverId);

  // キュー処理の開始
  isExecuteQue = true;
  taskScheduler(serverId);
  if (globalThis.config.translate.enable) {
    globalThis.electron.translateWindow.focus();
    translateTaskScheduler(serverId);
  }

  // WebSocketを立てる
  app.ws('/ws', (ws, req) => {
    ws.on('message', (message) => {
      log.debug('Received: ' + message.toString());
      if (message.toString() === 'ping') {
        ws.send('pong');
      }
    });

    ws.on('close', () => {
      log.debug('I lost a client');
    });
  });

  // 指定したポートで待ち受け開始
  server = app.listen(config.port, () => {
    log.debug('[startServer] start server on port:' + config.port);
  });
  // 成功メッセージ返却
  event.returnValue = 'success';
});

ipcMain.on(electronEvent.COMMENT_TEST, async (event: any, config: typeof globalThis['config']) => {
  globalThis.config = config;
  return commentTest();
});

const commentTest = async () => {
  // コメントテスト
  try {
    const textList = [
      'ﾃｽﾃｽｗｗｗｗｗｗｗｗｗｗｗｗｗｗｗｗｗｗｗ',
      '∈(･ω･)∋ ﾀﾞﾑｰ',
      'おめーらいつまで経っても<br/>ピアキャストかよ',
      "Hello everyone!<br/>I'm Unacast<br/><br/>Yes.",
    ];
    const text = textList[Math.floor(Math.random() * textList.length)];
    sendDom([
      {
        id: '100',
        name: 'ななしさん',
        text: text,
        imgUrl: './img/unacast.png',
        from: 'bbs',
      },
    ]);
  } catch (e) {
    log.debug(e);
  }
};

export const findSeList = async () => {
  try {
    if (globalThis.config.sePath) {
      const list = await readWavFiles(globalThis.config.sePath);
      globalThis.electron.seList = list.map((file) => `${globalThis.config.sePath}/${file}`);
      log.debug(`SE files = ${globalThis.electron.seList.length}`);
    } else {
      globalThis.electron.seList = [];
    }
  } catch (e) {
    globalThis.electron.mainWindow.webContents.send(electronEvent.SHOW_ALERT, '着信音のパスがおかしそうです');
  }
};

/**
 * Twitchチャットに接続
 * @description 再接続処理はライブラリが勝手にやってくれる
 */
const startTwitchChat = async () => {
  try {
    const twitchChat = new ChatClient();
    twitchChat.connect();
    twitchChat.join(globalThis.config.twitchId);
    globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, { commentType: 'twitch', category: 'status', message: 'wait live' });

    // 接続完了
    twitchChat.on('ready', () => {
      log.debug('[Twitch] Successfully connected to chat');
      globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, { commentType: 'twitch', category: 'status', message: 'ok' });
    });

    // チャット受信
    twitchChat.on('PRIVMSG', (msg) => {
      log.info('[Twitch] comment received');
      globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, { commentType: 'twitch', category: 'status', message: 'ok' });

      // log.info(JSON.stringify(msg, null, '  '));
      const imgUrl = globalThis.electron.iconList.getTwitch();
      const name = escapeHtml(msg.displayName);
      let text = escapeHtml(msg.messageText);
      // エモートを画像タグにする
      if (globalThis.config.emoteAnimation) {
        msg.emotes.map((emote) => {
          text = text.replace(emote.code, `<img src="https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/light/${globalThis.config.emoteSize}.0" />`);
        });
      } else {
        msg.emotes.map((emote) => {
          text = text.replace(emote.code, `<img src="https://static-cdn.jtvnw.net/emoticons/v1/${emote.id}/${globalThis.config.emoteSize}.0" />`);
        });
      }

      globalThis.electron.commentQueueList.push({ imgUrl, name, text, from: 'twitch' });
    });
    globalThis.electron.twitchChat = twitchChat;

    // なんかエラーがあった
    twitchChat.on('error', (event) => {
      log.error(`[Twitch] ${JSON.stringify(event)}`);
      globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, { commentType: 'twitch', category: 'status', message: 'error!' });
    });

    twitchChat.on('close', (event) => {
      globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, { commentType: 'twitch', category: 'status', message: 'connection end' });
    });
  } catch (e) {
    log.error(e);
    globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, { commentType: 'twitch', category: 'status', message: 'error!' });
  }
};

/** Youtubeチャットに接続 */
const startYoutubeChat = async () => {
  try {
    log.info('[Youtube Chat] connect started');
    if (globalThis.config.youtubeLiveId) {
      globalThis.electron.youtubeChat = new LiveChat({ liveId: globalThis.config.youtubeLiveId });
    } else {
      globalThis.electron.youtubeChat = new LiveChat({ channelId: globalThis.config.youtubeId });
    }
    globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, { commentType: 'youtube', category: 'status', message: 'wait live' });

    // 接続開始イベント
    globalThis.electron.youtubeChat.on('start', (liveId: string) => {
      log.info(`[Youtube Chat] connected liveId = ${liveId}`);
      globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, { commentType: 'youtube', category: 'liveid', message: liveId });
      globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, { commentType: 'youtube', category: 'status', message: 'ok' });
    });
    // 接続終了イベント
    globalThis.electron.youtubeChat.on('end', (reason?: string) => {
      log.info('[Youtube Chat] disconnect');
      globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, { commentType: 'youtube', category: 'status', message: 'connection end' });
    });

    const createYoutubeComment = async (comment: CommentItem): Promise<UserComment> => {
      // log.info(JSON.stringify(comment, null, '  '));
      let icon: string = globalThis.electron.iconList.getYoutube();
      const thumbnail = comment.author.thumbnail?.url ?? '';
      if (!icon && thumbnail) {
        try {
          const thumbnailImgBuf = await axios.get<ArrayBuffer>(thumbnail, { responseType: 'arraybuffer' });
          const b64 = Buffer.from(thumbnailImgBuf.data).toString('base64');
          icon = b64;
        } catch (e) {
          log.warn(e);
        }
      }
      if (!icon) {
        icon = globalThis.electron.iconList.getYoutubeLogo();
      }
      const imgUrl = icon;
      const name = escapeHtml(comment.author.name);
      // 絵文字と結合する
      let text = '';
      for (const message of comment.message) {
        const txtItem = (message as { text: string }).text;
        if (txtItem) {
          text += escapeHtml(txtItem);
        } else {
          const imageItem = message as ImageItem;
          text += `<img src="${imageItem.url}" width="${24}" height="${24}" />`;
        }
      }
      // const text = escapeHtml((comment.message[0] as any).text);
      return { imgUrl, name, text, from: 'youtube' };
    };
    // 初期チャット受信
    globalThis.electron.youtubeChat.on('firstComment', (comment: CommentItem) => {
      log.info('[Youtube] comment received');
      globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, { commentType: 'youtube', category: 'status', message: 'ok' });
      // チャットウィンドウだけに出力
      createYoutubeComment(comment).then((data) => sendDomForChatWindow([data]));
    });

    // チャット受信
    globalThis.electron.youtubeChat.on('comment', (comment: CommentItem) => {
      log.info('[Youtube] comment received');
      globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, { commentType: 'youtube', category: 'status', message: 'ok' });
      createYoutubeComment(comment).then((data) => globalThis.electron.commentQueueList.push(data));
    });

    // 何かエラーがあった
    globalThis.electron.youtubeChat.on('error', (err: Error) => {
      log.error(`[Youtube Chat] ${err.message}`);
      globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, { commentType: 'youtube', category: 'status', message: `error! ${err.message}` });
    });

    globalThis.electron.youtubeChat.start();
  } catch (e) {
    // たぶんここには来ない
    log.error(e);
  }
};

/**
 * サーバー停止
 */
ipcMain.on(electronEvent.STOP_SERVER, (event) => {
  log.debug('[startServer] server stop');
  server.close();
  aWss.close();
  app = null as any;
  event.returnValue = 'stop';

  // キュー処理停止
  isExecuteQue = false;
  globalThis.electron.commentQueueList = [];

  // レス取得の停止
  threadIntervalEvent = false;
  globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, { commentType: 'bbs', category: 'title', message: `` });
  globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, { commentType: 'bbs', category: 'status', message: `connection end` });

  // Twitchチャットの停止
  if (globalThis.electron.twitchChat) {
    globalThis.electron.twitchChat.close();
    globalThis.electron.twitchChat.removeAllListeners();
    globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, { commentType: 'twitch', category: 'status', message: `connection end` });
  }

  // Youtubeチャットの停止
  if (globalThis.electron.youtubeChat) {
    globalThis.electron.youtubeChat.stop();
    globalThis.electron.youtubeChat.removeAllListeners();
    globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, { commentType: 'youtube', category: 'status', message: `connection end` });
    globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, { commentType: 'youtube', category: 'liveId', message: `none` });
  }

  // ニコ生チャットの停止
  if (globalThis.electron.niconicoChat) {
    globalThis.electron.niconicoChat.stop();
    globalThis.electron.niconicoChat.removeAllListeners();
    globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, { commentType: 'niconico', category: 'status', message: `connection end` });
    globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, { commentType: 'niconico', category: 'liveId', message: `none` });
  }
  // jpnkn Fastインターフェース
  if (globalThis.electron.jpnknFast) {
    globalThis.electron.jpnknFast.stop();
    globalThis.electron.jpnknFast.removeAllListeners();
    globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, { commentType: 'jpnkn', category: 'status', message: `connection end` });
  }

  // Azure Speech To Textインターフェース
  if (globalThis.electron.azureStt) {
    globalThis.electron.azureStt.stop();
    globalThis.electron.azureStt.removeAllListeners();
    globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, { commentType: 'stt', category: 'status', message: `connection end` });
  }
});

const getResInterval = async (exeId: number) => {
  let resNum: number;
  let isfirst = false;

  // 板URLが未指定ならスキップ
  if (!globalThis.config.url && threadIntervalEvent && exeId === serverId) {
    await sleep(globalThis.config.interval * 1000);
    getResInterval(exeId);
    return;
  }

  if (!globalThis.electron.threadNumber) {
    // 初回
    isfirst = true;
    resNum = NaN;
  } else {
    // 2回目以降
    resNum = globalThis.electron.threadNumber;
  }

  let result = await getBbsResponse(globalThis.config.url, resNum);
  if (isfirst && result.length > 0) {
    const threadTitle = result[0].threadTitle as string;
    globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, { commentType: 'bbs', category: 'title', message: threadTitle });
  }

  // 指定したレス番以下は除外対象
  if (resNum) {
    result = result.filter((res) => (res.number ? Number(res.number) > resNum : true));
  }

  if (result.length > 0 && result[result.length - 1].number) {
    globalThis.electron.threadNumber = Number(result[result.length - 1].number);

    if (isfirst) {
      // 初回取得の時はチャットウィンドウにだけ表示
      let temp = result;
      if (!globalThis.config.dispSort) {
        temp = temp.reverse();
      }
      sendDomForChatWindow(temp);
    } else {
      for (const item of result) {
        // リストに同じレス番があったら追加しない
        if (!globalThis.electron.commentQueueList.find((comment) => comment.number === item.number)) {
          globalThis.electron.commentQueueList.push(item);
        }
      }
    }

    globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, { commentType: 'bbs', category: 'status', message: `ok res=${globalThis.electron.threadNumber}` });
  } else if (result.length > 0) {
    globalThis.electron.mainWindow.webContents.send(electronEvent.UPDATE_STATUS, { commentType: 'bbs', category: 'status', message: 'error!' });
    // 番号が無くて結果が入ってるのは通信エラーメッセージ
    sendDomForChatWindow(result);
  }

  await checkAutoMoveThread();

  await notifyThreadResLimit();

  if (threadIntervalEvent && exeId === serverId) {
    await sleep(globalThis.config.interval * 1000);
    getResInterval(exeId);
  }
};

/** レス番が上限かチェックして、超えてたら通知する */
const notifyThreadResLimit = async () => {
  if (globalThis.config.notifyThreadResLimit > 0 && globalThis.electron.threadNumber >= globalThis.config.notifyThreadResLimit) {
    sendDomForChatWindow([
      {
        name: 'unacastより',
        imgUrl: './img/unacast.png',
        text: `レスが${globalThis.config.notifyThreadResLimit}を超えました。次スレを立ててください。`,
        from: 'system',
      },
    ]);
    // スレ立て中だと思うのでちょっと待つ
    await sleep(10 * 1000);
  }
};

const checkAutoMoveThread = async () => {
  if (!globalThis.config.moveThread) return;
  if (globalThis.electron.threadNumber < 1000) return;

  const threadUrl = globalThis.config.url;

  // スレ一覧を取得
  const boardInfo = await threadUrlToBoardInfo(threadUrl);
  const threadList = await getThreadList(boardInfo.boardUrl);
  const target = threadList.find((item) => item.url !== threadUrl && item.resNum < 1000);
  if (!target) return;

  // 次スレが見つかったので移動する
  globalThis.electron.commentQueueList.push({
    name: 'unacastより',
    imgUrl: './img/unacast.png',
    text: `レス1000を超えました。次スレ候補 「${target.name}」 に移動します`,
    from: 'system',
  });

  globalThis.config.url = target.url;
  globalThis.electron.threadNumber = 0;

  globalThis.electron.mainWindow.webContents.send(electronEvent.SAVE_CONFIG, globalThis.config);
};

/**
 * キューに溜まったコメントをブラウザに表示する
 */
const taskScheduler = async (exeId: number) => {
  if (globalThis.electron?.commentQueueList?.length > 0) {
    log.info(`[taskScheduler] ${globalThis.electron?.commentQueueList?.length}`);
    if (globalThis.config.commentProcessType === 0) {
      // 一括
      let temp = [...globalThis.electron.commentQueueList];
      globalThis.electron.commentQueueList = [];
      // 新着が上の場合は逆順にする
      if (!globalThis.config.dispSort) {
        temp = temp.reverse();
      }
      sendDom(temp);

      if (globalThis.config.translate.enable) {
        globalThis.electron.translateQueueList.push(...temp);
      }
    } else {
      // 1個ずつ
      const comment = globalThis.electron.commentQueueList.shift() as UserComment;
      await sendDom([comment]);

      if (globalThis.config.translate.enable) {
        globalThis.electron.translateQueueList.push(comment);
      }
    }
  }

  if (isExecuteQue && exeId === serverId) {
    await sleep(100);
    taskScheduler(exeId);
  }
};

/**
 * キューに溜まったコメントをブラウザに表示する
 */
const translateTaskScheduler = async (exeId: number) => {
  if (globalThis.electron?.translateQueueList?.length > 0) {
    log.info(`[translateTaskScheduler] ${globalThis.electron?.translateQueueList?.length}`);
    // 1個ずつ
    const comment = globalThis.electron.translateQueueList.shift() as UserComment;
    if (globalThis.config.translate.targetLang === 'ja' && !isNihongo(comment.text)) {
      // 日本語が1文字も入ってなければ翻訳する
      await sendDomForTranslateWindow(comment);
    } else if (globalThis.config.translate.targetLang === 'en') {
      // 英語オンリーってどうやって簡易的に判断するのかよくわからないので全部翻訳する
      await sendDomForTranslateWindow(comment);
    }
  }

  if (isExecuteQue && exeId === serverId) {
    await sleep(500);
    translateTaskScheduler(exeId);
  }
};

/** 読み子によって発話中であるか */
let isSpeaking = false;
/** 読み子を再生する */
const playYomiko = async (typeYomiko: typeof config.typeYomiko, msg: string) => {
  // log.info('[playYomiko] start');
  if (isSpeaking) {
    // 以前の読み子がまだ読んでいる
    switch (typeYomiko) {
      case 'tamiyasu': {
        // TODO:強制的に発話を終了する
        break;
      }
      case 'bouyomi': {
        // TODO:強制的に発話を終了する
        break;
      }
      case 'voicevox': {
        // 強制的に発話を終了する
        if (voiceVox) voiceVox.abort();
        break;
      }
    }
  }
  isSpeaking = true;

  // 読み子呼び出し
  switch (typeYomiko) {
    case 'tamiyasu': {
      log.debug(`${config.tamiyasuPath} "${msg}"`);
      spawn(config.tamiyasuPath, [msg]);
      // 読み子が読んでる時間分相当待つ
      globalThis.electron.mainWindow.webContents.send(electronEvent.WAIT_YOMIKO_TIME, msg);
      break;
    }
    case 'bouyomi': {
      if (bouyomi) {
        bouyomi.speak(msg);
        // 読み子が読んでる時間分相当待つ
        globalThis.electron.mainWindow.webContents.send(electronEvent.WAIT_YOMIKO_TIME, msg);
      } else {
        isSpeaking = false;
      }
      break;
    }
    case 'voicevox': {
      if (voiceVox) {
        voiceVox.speak(msg);
      } else {
        isSpeaking = false;
      }
      break;
    }
    default:
      isSpeaking = false;
      break;
  }
  // 読み子がまだ読んでたら待つ
  while (isSpeaking) {
    await sleep(50);
  }
  // log.info('[playYomiko] end');
};
ipcMain.on(electronEvent.SPEAKING_END, (event) => (isSpeaking = false));

let isPlayingSe = false;
const playSe = async () => {
  // log.info('[playSe] start');
  const wavfilepath = globalThis.electron.seList[Math.floor(Math.random() * globalThis.electron.seList.length)];
  isPlayingSe = true;
  for (const deviceId of globalThis.config.audioOutputDevices) {
    globalThis.electron.mainWindow.webContents.send(electronEvent.PLAY_SOUND_START, { wavfilepath, volume: globalThis.config.playSeVolume, deviceId: deviceId });
  }

  while (isPlayingSe) {
    await sleep(50);
  }
  // log.info('[playSe] end');
};
ipcMain.on(electronEvent.PLAY_SOUND_END, (event) => (isPlayingSe = false));

export const createDom = (message: UserComment, type: 'chat' | 'server', isAA: boolean) => {
  let domStr = `<li class="list-item">`;

  /** レス番とかの行が何かしら表示対象になっているか */
  let isResNameShowed = false;

  // アイコン表示
  if (globalThis.config.showIcon) {
    domStr += `
    <span class="icon-block">
      <img class="icon" src="data:image/png;base64,${message.imgUrl}">
    </span>
    `;
    isResNameShowed = true;
  }

  domStr += `<div class="content">`;

  // レス番表示
  if (globalThis.config.showNumber && message.number) {
    domStr += `
      <span class="resNumber">${message.number}</span>
    `;
    isResNameShowed = true;
  }
  // 名前表示
  if (globalThis.config.showName && message.name) {
    domStr += `<span class="name">${message.name}</span>`;
    isResNameShowed = true;
  }
  // 時刻表示
  if (globalThis.config.showTime && message.date) {
    domStr += `<span class="date">${message.date}</span>`;
    isResNameShowed = true;
  }

  // 名前と本文を改行で分ける
  // 名前や時刻の行が一つも無ければ、改行しない
  if (globalThis.config.newLine && isResNameShowed) {
    domStr += '<br />';
  } else if (globalThis.config.aamode.enable && isAA) {
    // AAモードがオンで対象がAAなら強制的に改行する
    domStr += '<br />';
  }

  // リンクを整形する
  const text = message.text
    .replace(/<a .*?>/g, '') // したらばはアンカーをaタグ化している
    .replace(/<\\a>/g, '');

  // httpの直前に英数字記号が無い箇所を置換
  const reg = new RegExp("(h?ttps?(://[-_.!~*'()a-zA-Z0-9;/?:@&=+$,%#]+))", 'g');
  // FIXME: imgタグへの誤爆を雑に回避
  const tempText = text.replace(/"http/g, '★★★★http★★★★');
  let commentText = tempText.replace(reg, '<span class="url" onClick=\'urlopen("$1")\'>$1</span>');
  commentText = commentText.replace(/★★★★http★★★★/g, '"http');
  if (isAA) {
    domStr += `
    <span class="aares">
      ${commentText}
    </span>
  `;
  } else {
    domStr += `
    <span class="res">
      ${commentText}
    </span>
  `;
  }

  // サムネイル表示
  const isThumbnailShow = (globalThis.config.thumbnail == 1 && type === 'chat') || globalThis.config.thumbnail == 2;
  if (isThumbnailShow) {
    const imgreg = new RegExp("(h?ttps?(://[-_.!~*'()a-zA-Z0-9;/?:@&=+$,%#]+)(.jpg|.png|.gif))", 'g');
    const imgUrls: string[] = [];
    const matched = text.match(imgreg);
    if (matched) {
      matched.map((value) => {
        // log.info(value);
        imgUrls.push(value);
      });
    }
    if (imgUrls.length > 0) {
      domStr += '<div class="thumbnail">';
      domStr += imgUrls
        .map((url) => {
          let tmp = url;
          if (tmp.match(/^ttp/)) {
            tmp = `h${tmp}`;
          }
          return `<img class="img" src="${tmp}" onClick='imageopen("${tmp}")' />`;
        })
        .join('');

      domStr += '</div>';

      // 画像URL非表示が有効なら消す
      if (globalThis.config.hideImgUrl) {
        for (const imgurl of imgUrls) {
          // log.info('非表示するぞ ' + imgurl);
          domStr = domStr.replace(`<span class="url" onClick='urlopen("${imgurl}")'>${imgurl}</span>`, '');
        }
      }
    }
  }

  // 〆
  domStr += `</div>
  </li>`;

  return domStr;
};

/**
 * コメントのDOMをブラウザに送る
 * 必要ならレス着信音も鳴らす
 * @param message
 */
export const sendDom = async (messageList: UserComment[]) => {
  try {
    // AA判定
    const newList = judgeAaMessage(messageList);

    // メッセージをブラウザに送信
    const domStr = newList.map((message) => createDom(message, 'server', message.isAA)).join('\n');
    const socketObject: CommentSocketMessage = {
      type: 'add',
      message: domStr,
    };
    if (aWss) {
      aWss.clients.forEach((client) => {
        client.send(JSON.stringify(socketObject));
      });
    }

    // レンダラーのコメント一覧にも表示
    sendDomForChatWindow(newList);

    // レス着信音
    if (globalThis.electron.seList.length > 0) {
      if (newList.every((message) => message.from === 'stt')) {
        // メッセージが全て音声認識の場合は専用の設定を見る
        if (config.playSeStt) {
          await playSe();
        }
      } else {
        if (config.playSe) {
          await playSe();
        }
      }
    }

    // 読み子
    // メッセージが音声認識かどうかで使う読み子を分ける
    const typeYomiko = newList[newList.length - 1].from === 'stt' ? globalThis.config.typeYomikoStt : globalThis.config.typeYomiko;
    if (typeYomiko !== 'none') {
      // 対象のレスがAAで、AAモードが有効なら、読み上げ分はアスキーアートにする
      if (newList[newList.length - 1].isAA && config.aamode.enable) {
        await playYomiko(typeYomiko, config.aamode.speakWord);
      } else {
        // タグを除去する
        let text = newList[newList.length - 1].text;
        text = text.replace(/<br\s*\/?>\s*/g, '\n ');
        text = text.replace(/<img.*?\/>/g, '');
        text = text.replace(/<a .*?>/g, '').replace(/<\/a>/g, '');
        // 読み上げ辞書の置き換え
        config.yomikoDictionary.forEach((entry) => {
          text = text.replace(new RegExp(entry.pattern, 'gim'), entry.pronunciation);
        });
        text = unescapeHtml(text);

        if (globalThis.config.yomikoReplaceNewline) {
          text = text.replace(/\r\n/g, ' ').replace(/\n/g, ' ');
        }
        await playYomiko(typeYomiko, text);
      }
    }

    // 追加で表示を維持する時間
    if (globalThis.config.dispType === 1) {
      await sleep(globalThis.config.minDisplayTime * 1000);
    }

    // 鳴らし終わって読み子が終わった
    resetInitMessage();
  } catch (e) {
    log.error(e);
  }
};

/** チャットウィンドウへのコメント表示 */
const sendDomForChatWindow = (messageList: UserComment[]) => {
  const domStr2 = judgeAaMessage(messageList)
    .map((message) => {
      const imgUrl = message.imgUrl && message.imgUrl.match(/^\./) ? '../../public/' + message.imgUrl : message.imgUrl;
      return {
        ...message,
        imgUrl,
      };
    })
    .map((message) => createDom(message, 'chat', message.isAA))
    .join('\n');
  globalThis.electron.chatWindow.webContents.send(electronEvent.SHOW_COMMENT, { config: globalThis.config, dom: domStr2 });
};

const resetInitMessage = () => {
  if (globalThis.config.dispType === 1) {
    const resetObj: CommentSocketMessage = {
      type: 'reset',
      message: globalThis.config.initMessage,
    };
    aWss.clients.forEach((client) => {
      client.send(JSON.stringify(resetObj));
    });
  }
};

export const createTranslateDom = (message: UserComment, translated: string) => {
  let domStr = `<li class="list-item">`;

  /** レス番とかの行が何かしら表示対象になっているか */
  let isResNameShowed = false;

  // アイコン表示
  if (globalThis.config.showIcon) {
    domStr += `
    <span class="icon-block">
      <img class="icon" src="${message.imgUrl}">
    </span>
    `;
  }

  domStr += `<div class="content">`;

  // レス番表示
  if (globalThis.config.showNumber && message.number) {
    domStr += `
      <span class="resNumber">${message.number}</span>
    `;
    isResNameShowed = true;
  }
  // 名前表示
  if (globalThis.config.showName && message.name) {
    domStr += `<span class="name">${message.name}</span>`;
    isResNameShowed = true;
  }
  // 時刻表示
  if (globalThis.config.showTime && message.date) {
    domStr += `<span class="date">${message.date}</span>`;
    isResNameShowed = true;
  }

  // 名前と本文を改行で分ける
  // 名前や時刻の行が一つも無ければ、改行しない
  if (isResNameShowed) {
    domStr += '<br />';
  }

  log.info(`${translated}   ---  ${message.text}`);

  domStr += `
  <div class="res">
    ${translated}
  </div>
  <hr style="margin: 1px;border-top: 1px solid black" />
  <span class="res-org">
    ${message.text}
  </span>
`;

  // 〆
  domStr += `</div>
  </li>`;

  return domStr;
};

/** 翻訳ウィンドウへのコメント表示 */
const sendDomForTranslateWindow = async (message: UserComment) => {
  log.info('[sendDomForTranslateWindow]');
  message.imgUrl = message.imgUrl && message.imgUrl.match(/^\./) ? '../../public/' + message.imgUrl : message.imgUrl;

  try {
    const reg = new RegExp("(h?ttps?(://[-_.!~*'()a-zA-Z0-9;/?:@&=+$,%#]+))", 'g');
    const orgText = message.text
      .replace(/<a .*?>/g, '')
      .replace(/<\\a>/g, '')
      .replace(/<img .*?>/g, '')
      .replace(/<\\img>/g, '')
      .replace(reg, '')
      .trim();

    const translated = await tr(unescapeHtml(orgText), {
      to: globalThis.config.translate.targetLang,
      from: 'auto',
      tld: globalThis.config.translate.targetLang === 'ja' ? 'co.jp' : 'com',
    });
    log.info(translated.text);
    // もし何もテキストとして残らなかったら表示しない
    if (!translated.text) return '';

    const domStr = createTranslateDom({ ...message, text: orgText }, escapeHtml(translated.text));

    globalThis.electron.translateWindow.webContents.send(electronEvent.SHOW_COMMENT_TL, { config: globalThis.config, dom: domStr });
  } catch (e) {
    log.error(JSON.stringify(e));
    globalThis.electron.translateWindow.webContents.send(electronEvent.SHOW_COMMENT_TL, { config: globalThis.config, dom: '<div>翻訳でエラー</div>' });
  }
};

ipcMain.on(electronEvent.PREVIEW_IMAGE, (event, url: string) => {
  globalThis.electron.imagePreviewWindow.webContents.send(electronEvent.PREVIEW_IMAGE, url);
  globalThis.electron.imagePreviewWindow.show();
});

export default {};
