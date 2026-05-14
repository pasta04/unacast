import * as React from 'react';
import { Box, TextField, Typography } from '@mui/material';
import { useAppStore } from '../store';
import { SectionPanel, LabeledInput, Caption } from './common';

const StatusLine: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
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
      <Box sx={{ mb: 2 }}>
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
          inputProps={{ pattern: 'http.?://.+/$' }}
          placeholder="http(s)://.../"
        />
        <StatusLine label="status" value={status.bbs} />
      </Box>

      {/* Jpnkn Fast */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          Jpnkn Fastインターフェース(β)
        </Typography>
        <LabeledInput prefix="http://bbs.jpnkn.com/" suffix="/beta/fast">
          <TextField size="small" value={config.jpnknFastBoardId} onChange={(e) => setConfig('jpnknFastBoardId', e.target.value)} disabled={isServerRunning} />
        </LabeledInput>
        <StatusLine label="status" value={status.jpnknFast} />
      </Box>

      {/* YouTube */}
      <Box sx={{ mb: 2 }}>
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
        <Box sx={{ mt: 0.5 }}>
          <StatusLine label="status" value={status.youtube} />
          <StatusLine label="liveId" value={status.youtubeLiveId} />
        </Box>
      </Box>

      {/* Twitch */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          Twitch ユーザID
        </Typography>
        <LabeledInput prefix="https://www.twitch.tv/" suffix="/">
          <TextField size="small" value={config.twitchId} onChange={(e) => setConfig('twitchId', e.target.value)} disabled={isServerRunning} />
        </LabeledInput>
        <StatusLine label="status" value={status.twitch} />
      </Box>

      {/* niconico */}
      <Box sx={{ mb: 2 }}>
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
        <StatusLine label="status" value={status.niconico} />
      </Box>

      {/* twitcasting */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          ツイキャスユーザーID
        </Typography>
        <LabeledInput prefix="https://twitcasting.tv/" suffix="/">
          <TextField size="small" value={config.twitcastingId} onChange={(e) => setConfig('twitcastingId', e.target.value)} disabled={isServerRunning} />
        </LabeledInput>
        <StatusLine label="status" value={status.twitcasting} />
      </Box>
    </SectionPanel>
  );
};
