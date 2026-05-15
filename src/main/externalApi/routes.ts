/**
 * REST / WebSocket 経由の外部入力エンドポイント登録。
 *
 * - POST /api/comments     単発投入用
 * - WS   /api/ws           連続投入用
 *
 * いずれも config.external.enabled が true の時のみ受け入れる。
 */
import express from 'express';
import type expressWs from 'express-ws';
import electronlog from 'electron-log';
import { normalizeExternalComment } from './normalize';

const log = electronlog.scope('externalApi');

const isExternalEnabled = (): boolean => Boolean(globalThis.config.external?.enabled);

/**
 * 正規化済みコメントの imgUrl 欠落を CommentIcons から補完してキューに積む。
 */
const enqueueComment = (comment: UserComment) => {
  if (!comment.imgUrl) {
    comment.imgUrl = globalThis.electron.iconList?.getByFrom(comment.from) ?? '';
  }
  globalThis.electron.commentQueueList.push(comment);
};

export const registerExternalApiRoutes = (app: expressWs.Application) => {
  const jsonParser = express.json({ limit: '64kb' });

  app.post('/api/comments', jsonParser, (req, res) => {
    if (!isExternalEnabled()) {
      res.status(403).json({ status: 'error', reason: 'external integration disabled' });
      return;
    }
    const result = normalizeExternalComment(req.body);
    if (!result.ok) {
      res.status(400).json({ status: 'error', reason: result.error });
      return;
    }
    enqueueComment(result.comment);
    log.info(`[POST /api/comments] queued from=${result.comment.from} name=${result.comment.name}`);
    res.status(202).json({ status: 'ok' });
  });

  app.ws('/api/ws', (ws) => {
    log.info('[WS /api/ws] client connected');
    ws.on('message', (raw: unknown) => {
      if (!isExternalEnabled()) {
        ws.send(JSON.stringify({ error: 'external integration disabled' }));
        return;
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(String(raw));
      } catch {
        ws.send(JSON.stringify({ error: 'invalid JSON' }));
        return;
      }
      const result = normalizeExternalComment(parsed);
      if (!result.ok) {
        ws.send(JSON.stringify({ error: result.error }));
        return;
      }
      enqueueComment(result.comment);
      ws.send(JSON.stringify({ ok: true }));
    });
    ws.on('close', () => {
      log.info('[WS /api/ws] client disconnected');
    });
  });
};
