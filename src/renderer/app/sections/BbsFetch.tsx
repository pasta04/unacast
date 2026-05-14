import * as React from 'react';
import { Box, Slider, TextField, Typography } from '@mui/material';
import { useAppStore } from '../store';
import { SectionPanel, Caption } from './common';

export const BbsFetch: React.FC = () => {
  const config = useAppStore((s) => s.config);
  const setConfig = useAppStore((s) => s.setConfig);

  return (
    <SectionPanel title="掲示板取得設定">
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          開始レス番号
        </Typography>
        <Caption>サーバ起動後、ブラウザからの初回アクセス時に表示するレスの開始番号です。省略した場合は表示しません。</Caption>
        <TextField
          size="small"
          value={config.resNumber}
          onChange={(e) => setConfig('resNumber', e.target.value)}
          inputProps={{ pattern: '[0-9]{0,3}?' }}
        />
      </Box>

      <Box>
        <Typography variant="body2">
          更新間隔 <strong>{config.interval}</strong> 秒
        </Typography>
        <Slider
          min={5}
          max={30}
          value={config.interval}
          onChange={(_, v) => setConfig('interval', Number(v))}
          valueLabelDisplay="auto"
          sx={{ maxWidth: 480 }}
        />
      </Box>
    </SectionPanel>
  );
};
