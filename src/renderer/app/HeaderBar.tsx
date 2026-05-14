import * as React from 'react';
import { Box, Button, Link, TextField, Typography } from '@mui/material';
import electron from 'electron';
import { useAppStore } from './store';
import { sendApplyConfig, sendCommentTest, sendStartServer } from './ipc';

const intOrZero = (raw: string) => {
  const v = parseInt(raw, 10);
  return Number.isNaN(v) ? 0 : v;
};

export const HeaderBar: React.FC = () => {
  const config = useAppStore((s) => s.config);
  const appliedConfig = useAppStore((s) => s.appliedConfig);
  const setConfig = useAppStore((s) => s.setConfig);
  const persist = useAppStore((s) => s.persist);
  const markApplied = useAppStore((s) => s.markApplied);
  const isServerRunning = useAppStore((s) => s.isServerRunning);
  const setServerRunning = useAppStore((s) => s.setServerRunning);
  const setConfirmStopOpen = useAppStore((s) => s.setConfirmStopOpen);
  const isConfigReady = useAppStore((s) => s.isConfigReady);

  const isDirty = React.useMemo(() => JSON.stringify(config) !== JSON.stringify(appliedConfig), [config, appliedConfig]);

  const handleApply = () => {
    persist();
    sendApplyConfig(useAppStore.getState().config);
    markApplied();
  };

  const handleStart = () => {
    if (!config.port) return;
    persist();
    sendStartServer(useAppStore.getState().config);
    markApplied();
    setServerRunning(true);
  };

  const handleStop = () => {
    setConfirmStopOpen(true);
  };

  const handleTest = () => {
    sendCommentTest(useAppStore.getState().config);
  };

  const serverUrl = `http://localhost:${config.port}`;

  return (
    <Box sx={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'background.paper', py: 1, mb: 1, borderBottom: '1px solid #eee' }}>
      <Typography variant="caption" color="text.secondary">
        サーバー起動、適用ボタンクリックで設定が反映されます。
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
        <Button variant="contained" disabled={!isConfigReady || !isDirty} onClick={handleApply}>
          適用
        </Button>
        <Button variant="contained" color="primary" disabled={!isConfigReady || isServerRunning} onClick={handleStart}>
          サーバー起動
        </Button>
        <Button variant="contained" color="primary" disabled={!isServerRunning} onClick={handleStop}>
          停止
        </Button>
        <Button variant="outlined" sx={{ ml: 2 }} onClick={handleTest}>
          テスト
        </Button>
      </Box>

      {!isServerRunning ? (
        <Box sx={{ mt: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            ポート番号
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              http://localhost:
            </Typography>
            <TextField size="small" value={String(config.port)} onChange={(e) => setConfig('port', intOrZero(e.target.value))} inputProps={{ pattern: '[0-9]{0,4}?' }} />
          </Box>
        </Box>
      ) : (
        <Box sx={{ mt: 1 }}>
          <Link component="button" type="button" onClick={() => electron.shell.openExternal(serverUrl)} sx={{ cursor: 'pointer' }}>
            {serverUrl}
          </Link>
        </Box>
      )}
    </Box>
  );
};
