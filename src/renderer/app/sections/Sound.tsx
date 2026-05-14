import * as React from 'react';
import { Box, Checkbox, FormControlLabel, Slider, TextField, Typography } from '@mui/material';
import { useAppStore } from '../store';
import { SectionPanel, Caption } from './common';

export const Sound: React.FC = () => {
  const config = useAppStore((s) => s.config);
  const setConfig = useAppStore((s) => s.setConfig);
  const audioOutputs = useAppStore((s) => s.audioOutputs);

  const toggleDevice = (deviceId: string, checked: boolean) => {
    const current = new Set(config.audioOutputDevices);
    if (checked) current.add(deviceId);
    else current.delete(deviceId);
    setConfig('audioOutputDevices', Array.from(current));
  };

  return (
    <SectionPanel title="レス・コメント着信音設定">
      <Box sx={{ maxWidth: 600 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          着信音のフォルダパス
        </Typography>
        <Caption>.wavファイルが含まれたフォルダを入力してください。</Caption>
        <TextField fullWidth size="small" value={config.sePath} placeholder="C:\\hogehoge\\fugafuga" onChange={(e) => setConfig('sePath', e.target.value)} />

        <Box sx={{ mt: 1 }}>
          <FormControlLabel control={<Checkbox checked={config.playSe} onChange={(e) => setConfig('playSe', e.target.checked)} size="small" />} label="着信音再生を有効にする" />
          <FormControlLabel
            control={<Checkbox checked={config.playSeStt} onChange={(e) => setConfig('playSeStt', e.target.checked)} size="small" />}
            label="音声認識テキストで着信音再生を有効にする"
          />
        </Box>

        <Box sx={{ mt: 1 }}>
          <Typography variant="body2">
            音量 <strong>{config.playSeVolume}</strong>
          </Typography>
          <Slider min={0} max={100} value={config.playSeVolume} onChange={(_, v) => setConfig('playSeVolume', Number(v))} />
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            レス着信音の出力先
          </Typography>
          {audioOutputs.length === 0 && (
            <Typography variant="caption" color="text.secondary">
              読み込み中…
            </Typography>
          )}
          {audioOutputs.map((d) => (
            <FormControlLabel
              key={d.deviceId}
              control={<Checkbox checked={config.audioOutputDevices.includes(d.deviceId)} onChange={(e) => toggleDevice(d.deviceId, e.target.checked)} size="small" />}
              label={d.label || d.deviceId}
              sx={{ display: 'block' }}
            />
          ))}
        </Box>
      </Box>
    </SectionPanel>
  );
};
