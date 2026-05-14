import * as React from 'react';
import { Box, Checkbox, FormControlLabel, MenuItem, TextField, Typography } from '@mui/material';
import { useAppStore } from '../store';
import type { AppConfig } from '../config';
import { SectionPanel, Caption } from './common';

export const AzureStt: React.FC = () => {
  const config = useAppStore((s) => s.config);
  const setConfig = useAppStore((s) => s.setConfig);
  const isServerRunning = useAppStore((s) => s.isServerRunning);
  const audioInputs = useAppStore((s) => s.audioInputs);
  const status = useAppStore((s) => s.status.stt);

  const update = (patch: Partial<AppConfig['azureStt']>) => setConfig('azureStt', { ...config.azureStt, ...patch });

  return (
    <SectionPanel title="Azure音声認識">
      <Caption>Azureを使ってマイクからの音声を認識し、レスのように表示します。</Caption>
      <FormControlLabel
        control={<Checkbox size="small" checked={config.azureStt.enable} onChange={(e) => update({ enable: e.target.checked })} disabled={isServerRunning} />}
        label="有効にする"
      />

      <Box sx={{ maxWidth: 600 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 1 }}>
          発言者名
        </Typography>
        <TextField fullWidth size="small" value={config.azureStt.name} onChange={(e) => update({ name: e.target.value })} disabled={isServerRunning} />

        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 1 }}>
          音声サービスキー(キー1またはキー2)
        </Typography>
        <TextField fullWidth size="small" type="password" value={config.azureStt.key} onChange={(e) => update({ key: e.target.value })} disabled={isServerRunning} />

        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 1 }}>
          音声サービス場所/地域
        </Typography>
        <TextField fullWidth size="small" value={config.azureStt.region} onChange={(e) => update({ region: e.target.value })} disabled={isServerRunning} />

        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 1 }}>
          認識する言語
        </Typography>
        <TextField
          select
          size="small"
          value={config.azureStt.language}
          onChange={(e) => update({ language: e.target.value as AppConfig['azureStt']['language'] })}
          disabled={isServerRunning}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="ja-JP">日本語</MenuItem>
          <MenuItem value="en-US">English</MenuItem>
        </TextField>

        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 1 }}>
          音声入力デバイス
        </Typography>
        <TextField select size="small" fullWidth value={config.azureStt.inputDevice} onChange={(e) => update({ inputDevice: e.target.value })} disabled={isServerRunning}>
          {audioInputs.length === 0 && <MenuItem value="default">既定のデバイス</MenuItem>}
          {audioInputs.map((d) => (
            <MenuItem key={d.deviceId} value={d.deviceId}>
              {d.label || d.deviceId}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        status: {status}
      </Typography>
    </SectionPanel>
  );
};
