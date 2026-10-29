import * as React from 'react';
import { Box, Button, FormControlLabel, MenuItem, Radio, RadioGroup, Select, TextField, Typography } from '@mui/material';
import { useAppStore } from '../store';
import { invokeGetYoutubeLoginState, invokeYoutubeLogin, invokeYoutubeLogout, sendOpenThreadBrowser, subscribeYoutubeLoginState } from '../ipc';
import { normalizeThreadUrl } from '../../../main/util';
import { SectionPanel, LabeledInput, Caption, SourceFilterToggle, StatusDot, getStatusColor, HelpPopover } from './common';

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

/** 公式 API でのコメント取得間隔 (秒) の選択肢 */
const youtubeApiIntervalOptions = [5, 10, 15, 30, 60];

/**
 * YouTube のコメント取得方法 (ページ解析 / 公式 API) と、ボット確認への対処 (ログイン・API キー) の設定
 */
const YoutubeFetchSettings: React.FC = () => {
  const config = useAppStore((s) => s.config);
  const isServerRunning = useAppStore((s) => s.isServerRunning);
  const setConfig = useAppStore((s) => s.setConfig);
  const [loggedIn, setLoggedIn] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    invokeGetYoutubeLoginState().then((state) => setLoggedIn(state.loggedIn));
    return subscribeYoutubeLoginState((state) => setLoggedIn(state.loggedIn));
  }, []);

  return (
    <Box sx={{ mt: 0.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography variant="caption">取得方法</Typography>
        <HelpPopover>
          <Box>
            YouTube に「ログインして bot ではないことを確認してください」(ボット確認)
            を求められると、ページ解析ではコメントを取得できなくなります。その場合は次のどちらかで対処できます。
          </Box>
          <Box sx={{ mt: 1 }}>
            YouTube にログイン: ページ解析のまま、ログインした状態で取得します。ログイン情報はこのアプリの中にだけ保存されます。配信者本人のアカウントでなくても構いません。
          </Box>
          <Box sx={{ mt: 1 }}>公式 API: YouTube Data API v3 で取得します。Google Cloud のプロジェクトで YouTube Data API v3 を有効にし、作成した API キーを入力してください。</Box>
          <Box sx={{ mt: 1 }}>
            公式 API には1日 10,000 ユニットの利用上限があり、コメント取得1回で 5 ユニット使います。取得間隔 10 秒で1時間あたり約 1,800 ユニット (約5時間半で上限)、30 秒で約 600
            ユニット (約16時間で上限) です。上限は太平洋時間の0時 (日本時間の16時か17時) に戻ります。
          </Box>
        </HelpPopover>
      </Box>
      <RadioGroup row value={config.youtubeFetchMode} onChange={(_, v) => setConfig('youtubeFetchMode', v as 'scrape' | 'api')}>
        <FormControlLabel value="scrape" control={<Radio size="small" />} label="ページ解析 (通常)" disabled={isServerRunning} />
        <FormControlLabel value="api" control={<Radio size="small" />} label="公式 API" disabled={isServerRunning} />
      </RadioGroup>
      {config.youtubeFetchMode === 'api' ? (
        <Box sx={{ mb: 0.5 }}>
          <Typography variant="caption">API キー</Typography>
          <TextField fullWidth size="small" type="password" value={config.youtubeApiKey} onChange={(e) => setConfig('youtubeApiKey', e.target.value)} disabled={isServerRunning} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Typography variant="caption">取得間隔</Typography>
            <Select size="small" value={config.youtubeApiInterval} onChange={(e) => setConfig('youtubeApiInterval', Number(e.target.value))} disabled={isServerRunning}>
              {youtubeApiIntervalOptions.map((sec) => (
                <MenuItem key={sec} value={sec}>
                  {sec} 秒
                </MenuItem>
              ))}
            </Select>
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            YouTube: {loggedIn === null ? '-' : loggedIn ? 'ログイン中' : '未ログイン'}
          </Typography>
          <Button size="small" variant="outlined" onClick={() => invokeYoutubeLogin()}>
            YouTube にログイン
          </Button>
          <Button size="small" variant="outlined" disabled={!loggedIn} onClick={() => invokeYoutubeLogout()}>
            ログアウト
          </Button>
        </Box>
      )}
    </Box>
  );
};

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
          slotProps={{ htmlInput: { pattern: 'http.?://.+/$' } }}
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
        <YoutubeFetchSettings />
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
            slotProps={{ htmlInput: { pattern: '^\\d+$' } }}
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
