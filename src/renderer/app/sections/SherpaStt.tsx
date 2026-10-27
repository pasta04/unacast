import * as React from 'react';
import { Box, Button, Checkbox, FormControlLabel, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useAppStore } from '../store';
import type { AppConfig } from '../config';
import { SectionPanel, Caption, SourceFilterToggle, StatusDot, getStatusColor, HelpPopover } from './common';
import { reloadAudioDevices } from '../audioDevices';
import sherpaStt from '../../sherpaStt';

export const SherpaStt: React.FC = () => {
  const config = useAppStore((s) => s.config);
  const setConfig = useAppStore((s) => s.setConfig);
  const isServerRunning = useAppStore((s) => s.isServerRunning);
  const audioInputs = useAppStore((s) => s.audioInputs);
  const status = useAppStore((s) => s.status.stt);
  const modelStatus = useAppStore((s) => s.status.sttModel);

  const update = (patch: Partial<AppConfig['sherpaStt']>) => setConfig('sherpaStt', { ...config.sherpaStt, ...patch });

  const [reloading, setReloading] = React.useState(false);

  /**
   * デバイス一覧を読み直し、サーバー起動中なら選択中のデバイスでマイクをつなぎ直す。
   * マイクの取得失敗・切断からの回復と、起動中のデバイス切替を兼ねる。
   */
  const handleReloadDevices = async () => {
    setReloading(true);
    try {
      await reloadAudioDevices();
    } finally {
      setReloading(false);
    }
    const state = useAppStore.getState();
    if (state.isServerRunning && state.config.sherpaStt.enable) {
      sherpaStt.restartSherpaStt(state.config.sherpaStt.inputDevice);
    }
  };

  // モデルのダウンロード状態は表示時に main へ問い合わせる
  React.useEffect(() => {
    sherpaStt.checkSherpaSttModelStatus();
  }, []);

  return (
    <SectionPanel title="ローカル音声認識">
      <Caption>マイクからの音声を認識し、レスのように表示します。</Caption>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <FormControlLabel
          control={<Checkbox size="small" checked={config.sherpaStt.enable} onChange={(e) => update({ enable: e.target.checked })} disabled={isServerRunning} />}
          label="有効にする"
        />
        <SourceFilterToggle source="stt" axis="broadcast" />
        <Typography variant="caption" color="text.secondary">
          <StatusDot color={getStatusColor(status, config.sherpaStt.enable)} />
          status: {status}
        </Typography>
      </Stack>
      <Box sx={{ maxWidth: 600 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 1 }}>
          発言者名
        </Typography>
        <TextField fullWidth size="small" value={config.sherpaStt.name} onChange={(e) => update({ name: e.target.value })} disabled={isServerRunning} />

        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 1 }}>
          音声入力デバイス
        </Typography>
        {/* 起動中もデバイスを切り替えられる (反映は「デバイス再読込」で行う) */}
        <TextField select size="small" fullWidth value={config.sherpaStt.inputDevice} onChange={(e) => update({ inputDevice: e.target.value })}>
          {(audioInputs === null || audioInputs.length === 0) && <MenuItem value="default">既定のデバイス</MenuItem>}
          {audioInputs?.map((d) => (
            <MenuItem key={d.deviceId} value={d.deviceId}>
              {d.label || d.deviceId}
            </MenuItem>
          ))}
        </TextField>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
          <Button size="small" variant="outlined" onClick={handleReloadDevices} disabled={reloading}>
            デバイス再読込
          </Button>
          <HelpPopover>マイクが認識されないときや、デバイスを切り替えたときは「デバイス再読込」を押してください。</HelpPopover>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 600 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 1 }}>
          モデルファイル
        </Typography>
        <Caption>音声認識に必要な追加のファイルです。サイズが大きいので別途ダウンロードする必要があります(170MB程度)。</Caption>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            ダウンロード状態: {modelStatus}
          </Typography>
          <Button variant="contained" size="small" onClick={() => sherpaStt.downloadSherpaSttModel()} disabled={isServerRunning || status.startsWith('ダウンロード中')}>
            ダウンロード
          </Button>
        </Stack>
      </Box>
    </SectionPanel>
  );
};
