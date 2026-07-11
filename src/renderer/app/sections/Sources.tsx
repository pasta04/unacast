import * as React from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import { useAppStore } from '../store';
import { sendOpenThreadBrowser } from '../ipc';
import { normalizeThreadUrl } from '../../../main/util';
import { SectionPanel, LabeledInput, Caption, SourceFilterToggle, StatusDot, getStatusColor } from './common';

/**
 * 取得元の status を 1 行で表示する。
 * `configured` を渡すと先頭に丸アイコンが付き、未指定 (= gray) / エラー (= red) / 正常 (= green) を視覚化する。
 * liveId のような状態ではない値を表示する用途には省略する。
 */
const StatusLine: React.FC<{ label: string; value: string; configured?: boolean }> = ({ label, value, configured }) => (
  <Typography variant="caption" color="text.secondary" sx={{ mr: 2, mt: '-4px', display: 'inline-block', lineHeight: 1, verticalAlign: 'top' }}>
    {configured !== undefined && <StatusDot color={getStatusColor(value, configured)} />}
    {label}: {value}
  </Typography>
);

export const Sources: React.FC = () => {
  const config = useAppStore((s) => s.config);
  const status = useAppStore((s) => s.status);
  const isServerRunning = useAppStore((s) => s.isServerRunning);
  const setConfig = useAppStore((s) => s.setConfig);

  return (
    <SectionPanel title="レス・コメント取得先">
      {/* 掲示板URL */}
      <Box sx={{ mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          掲示板URL
        </Typography>
        <Caption>サーバ起動中に変更した場合は、最新の1レスがコメント欄に表示されます。</Caption>
        {status.bbsTitle && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {status.bbsTitle}
          </Typography>
        )}
        <TextField
          fullWidth
          size="small"
          value={config.url}
          onChange={(e) => setConfig('url', e.target.value)}
          onBlur={() => {
            // ブラウザからコピーしたURLに付く l50 / 127n- 等のレス範囲表記を自動補正する
            const normalized = normalizeThreadUrl(config.url);
            if (normalized !== config.url) setConfig('url', normalized);
          }}
          inputProps={{ pattern: 'http.?://.+/$' }}
          placeholder="http(s)://.../"
        />
        <SourceFilterToggle source="bbs" axis="broadcast" />
        <StatusLine label="status" value={status.bbs} configured={!!config.url} />
        <Box sx={{ mt: 0.5 }}>
          <Button size="small" variant="outlined" disabled={!config.url} onClick={() => sendOpenThreadBrowser('bbs', config.url)}>
            掲示板を開く
          </Button>
        </Box>
      </Box>

      {/* Jpnkn Fast */}
      <Box sx={{ mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          Jpnkn Fastインターフェース(β)
        </Typography>
        <LabeledInput prefix="http://bbs.jpnkn.com/" suffix="/beta/fast">
          <TextField size="small" value={config.jpnknFastBoardId} onChange={(e) => setConfig('jpnknFastBoardId', e.target.value)} disabled={isServerRunning} />
        </LabeledInput>
        <SourceFilterToggle source="jpnkn" axis="broadcast" />
        <StatusLine label="status" value={status.jpnknFast} configured={!!config.jpnknFastBoardId} />
        <Box sx={{ mt: 0.5 }}>
          <Button size="small" variant="outlined" disabled={!config.jpnknFastBoardId} onClick={() => sendOpenThreadBrowser('jpnkn', config.jpnknFastBoardId)}>
            掲示板を開く
          </Button>
        </Box>
      </Box>

      {/* YouTube */}
      <Box sx={{ mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          Youtube
        </Typography>
        <Caption>両方入力した場合はLiveIDが優先されます</Caption>
        <Typography variant="caption">LiveID</Typography>
        <LabeledInput prefix="https://www.youtube.com/watch?v=">
          <TextField size="small" value={config.youtubeLiveId} onChange={(e) => setConfig('youtubeLiveId', e.target.value)} disabled={isServerRunning} />
        </LabeledInput>
        <Typography variant="caption">チャンネルID</Typography>
        <LabeledInput prefix="https://www.youtube.com/channel/" suffix="/">
          <TextField size="small" value={config.youtubeId} onChange={(e) => setConfig('youtubeId', e.target.value)} disabled={isServerRunning} />
        </LabeledInput>
        <SourceFilterToggle source="youtube" axis="broadcast" />
        <Box sx={{ mt: 0.5 }}>
          <StatusLine label="status" value={status.youtube} configured={!!(config.youtubeLiveId || config.youtubeId)} />
          <StatusLine label="liveId" value={status.youtubeLiveId} />
        </Box>
      </Box>

      {/* Twitch */}
      <Box sx={{ mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          Twitch ユーザID
        </Typography>
        <LabeledInput prefix="https://www.twitch.tv/" suffix="/">
          <TextField size="small" value={config.twitchId} onChange={(e) => setConfig('twitchId', e.target.value)} disabled={isServerRunning} />
        </LabeledInput>
        <SourceFilterToggle source="twitch" axis="broadcast" />
        <StatusLine label="status" value={status.twitch} configured={!!config.twitchId} />
      </Box>

      {/* niconico */}
      <Box sx={{ mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          ニコニココユーザーID
        </Typography>
        <LabeledInput prefix="https://www.nicovideo.jp/user/" suffix="/">
          <TextField
            size="small"
            value={config.niconicoId}
            onChange={(e) => setConfig('niconicoId', e.target.value)}
            disabled={isServerRunning}
            inputProps={{ pattern: '^\\d+$' }}
          />
        </LabeledInput>
        <SourceFilterToggle source="niconico" axis="broadcast" />
        <StatusLine label="status" value={status.niconico} configured={!!config.niconicoId} />
      </Box>

      {/* twitcasting */}
      <Box sx={{ mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          ツイキャスユーザーID
        </Typography>
        <LabeledInput prefix="https://twitcasting.tv/" suffix="/">
          <TextField size="small" value={config.twitcastingId} onChange={(e) => setConfig('twitcastingId', e.target.value)} disabled={isServerRunning} />
        </LabeledInput>
        <SourceFilterToggle source="twitcasting" axis="broadcast" />
        <StatusLine label="status" value={status.twitcasting} configured={!!config.twitcastingId} />
      </Box>
    </SectionPanel>
  );
};
