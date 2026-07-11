import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material';
import { useAppStore } from '../store';
import type { AppConfig } from '../config';
import { invokeAutoCreateThreadPreview, AutoCreateThreadPreview } from '../ipc';
import { SectionPanel, Caption, SourceFilterToggle, HelpPopover } from './common';

const intOrZero = (raw: string) => {
  const v = parseInt(raw, 10);
  return Number.isNaN(v) ? 0 : v;
};

export const Other: React.FC = () => {
  const config = useAppStore((s) => s.config);
  const setConfig = useAppStore((s) => s.setConfig);
  const port = config.port;
  const updateExternal = (patch: Partial<AppConfig['external']>) => setConfig('external', { ...config.external, ...patch });

  // 自動スレ立てプレビュー
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [preview, setPreview] = React.useState<AutoCreateThreadPreview | null>(null);

  const openAutoCreatePreview = async () => {
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreview(null);
    const result = await invokeAutoCreateThreadPreview(config.url);
    setPreviewLoading(false);
    setPreview(result);
  };

  return (
    <SectionPanel title="その他">
      <Box sx={{ maxWidth: 600 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          スレのレス番号が超えた時に通知する値(0で使用しない)
        </Typography>
        <TextField
          size="small"
          value={String(config.notifyThreadResLimit)}
          onChange={(e) => setConfig('notifyThreadResLimit', intOrZero(e.target.value))}
          inputProps={{ pattern: '[0-9]{0,5}?' }}
        />
      </Box>

      <Box sx={{ maxWidth: 600, mt: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          エラーが継続した際に通知するまでの秒数(0で使用しない)
        </Typography>
        <TextField
          size="small"
          value={String(config.notifyThreadConnectionErrorLimit)}
          onChange={(e) => setConfig('notifyThreadConnectionErrorLimit', intOrZero(e.target.value))}
          inputProps={{ pattern: '[0-9]{0,5}?' }}
        />
      </Box>

      <Box sx={{ mt: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          自動スレ移動
        </Typography>
        <Caption>スレ順に探索して、最初に見つかった1000以外のスレに移動します。移動先の初回取得結果はブラウザ側には表示しません。</Caption>
        <FormControlLabel control={<Checkbox size="small" checked={config.moveThread} onChange={(e) => setConfig('moveThread', e.target.checked)} />} label="1000で自動スレ移動" />
      </Box>

      <Box sx={{ mt: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            自動スレ立て
          </Typography>
          <HelpPopover>
            レス数が指定値に達したら、次スレを自動で作成します。
            <br />
            <br />
            <strong>タイトル:</strong>
            <br />
            ・現スレタイトルの最後に出てくる数字を +1 します。
            <br />
            ・例：避難スレ70 → 避難スレ71。
            <br />
            <strong>名前・メール・本文:</strong>
            <br />
            ・現スレの1レス目の内容をコピーします。
            <br />
            <br />
            <strong>注意事項:</strong>
            <br />
            同名スレが既に立っている場合や、一度実行したスレでは再実行しません。
            <br />
            スレッドタイトルに数値が入っていない場合は、自動スレ立ては動作しません。
          </HelpPopover>
        </Box>
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={config.autoCreateThread.enable}
              onChange={(e) => setConfig('autoCreateThread', { ...config.autoCreateThread, enable: e.target.checked })}
            />
          }
          label="自動スレ立てを有効にする"
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">実行するレス数</Typography>
          <TextField
            size="small"
            disabled={!config.autoCreateThread.enable}
            value={String(config.autoCreateThread.resThreshold)}
            onChange={(e) => setConfig('autoCreateThread', { ...config.autoCreateThread, resThreshold: intOrZero(e.target.value) })}
            inputProps={{ pattern: '[0-9]{0,4}?' }}
            sx={{ width: 90 }}
          />
          <Button size="small" variant="outlined" disabled={!config.url} onClick={openAutoCreatePreview}>
            プレビュー
          </Button>
        </Box>

        {/* 自動スレ立てプレビューダイアログ */}
        <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>自動スレ立てプレビュー</DialogTitle>
          <DialogContent>
            {previewLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={22} />
              </Box>
            )}
            {preview && !preview.ok && <Alert severity="error">{preview.error}</Alert>}
            {preview?.ok && (
              <>
                <Typography variant="body2" sx={{ mb: 1.5 }}>
                  自動スレ立てが実行された場合、以下の内容でスレッドが作成されます。
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  現在のスレッド
                </Typography>
                <Typography variant="body2" sx={{ mb: 1, wordBreak: 'break-word' }}>
                  {preview.currentTitle}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  作成されるタイトル
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, wordBreak: 'break-word' }}>
                  {preview.title}
                  {preview.title === preview.currentTitle && (
                    <Typography component="span" variant="caption" color="warning.main" sx={{ ml: 1 }}>
                      (現在のスレッドタイトルに数字が無いため、自動スレ立ては動作しません)
                    </Typography>
                  )}
                </Typography>
                <Box sx={{ display: 'flex', gap: 3, mb: 1 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      名前
                    </Typography>
                    <Typography variant="body2">{preview.name || '(空欄)'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      メール
                    </Typography>
                    <Typography variant="body2">{preview.mail || '(空欄)'}</Typography>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  本文
                </Typography>
                <Box sx={{ border: '1px solid #ddd', borderRadius: 1, p: 1, maxHeight: 260, overflowY: 'auto' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {preview.body}
                  </Typography>
                </Box>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button variant="contained" onClick={() => setPreviewOpen(false)}>
              閉じる
            </Button>
          </DialogActions>
        </Dialog>
      </Box>

      <FormControl sx={{ display: 'block', mt: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          レスの処理単位
        </Typography>
        <RadioGroup value={String(config.commentProcessType)} onChange={(_, v) => setConfig('commentProcessType', Number(v) as AppConfig['commentProcessType'])}>
          <FormControlLabel value="0" control={<Radio size="small" />} label="新着を優先(着信音等が鳴ってる場合は中断されます)" />
          <FormControlLabel value="1" control={<Radio size="small" />} label="1つずつ" />
        </RadioGroup>
      </FormControl>

      <Box sx={{ mt: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          外部入力 (REST / WebSocket) (β版)
        </Typography>
        <Caption>外部ツールからレス・コメントを投入できるようにします。</Caption>
        <FormControlLabel
          control={<Checkbox size="small" checked={config.external.enabled} onChange={(e) => updateExternal({ enabled: e.target.checked })} />}
          label="外部入力を有効にする"
        />
        <Box sx={{ maxWidth: 600, mt: 0.5 }}>
          <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold' }}>
            アイコンフォルダ
          </Typography>
          <Caption>未設定時は掲示板用のアイコンを使用します。</Caption>
          <TextField fullWidth size="small" value={config.external.iconDir} placeholder="C:\\hogehoge\\fugafuga" onChange={(e) => updateExternal({ iconDir: e.target.value })} />
        </Box>
        <SourceFilterToggle source="external" axis="broadcast" />
        <Box sx={{ mt: 0.5, fontFamily: 'monospace', fontSize: 11, color: 'text.secondary' }}>
          エンドポイント：
          <br />
          POST http://localhost:{port}/api/comments
          <br />
          WS&nbsp;&nbsp;&nbsp;ws://localhost:{port}/api/ws
        </Box>
        <Caption>
          リクエスト例: <code>{`curl -X POST http://localhost:${port}/api/comments -H "Content-Type: application/json" -d '{"name":"bot","text":"hello"}'`}</code>
        </Caption>
      </Box>
    </SectionPanel>
  );
};
