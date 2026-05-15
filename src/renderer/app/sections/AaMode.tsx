import * as React from 'react';
import { Box, Checkbox, FormControlLabel, TextField, Typography } from '@mui/material';
import { useAppStore } from '../store';
import { SectionPanel, Caption } from './common';

export const AaMode: React.FC = () => {
  const config = useAppStore((s) => s.config);
  const setConfig = useAppStore((s) => s.setConfig);

  const updateLength = (raw: string) => {
    const parsed = parseInt(raw, 10);
    setConfig('aamode', {
      ...config.aamode,
      condition: { ...config.aamode.condition, length: Number.isNaN(parsed) ? 0 : parsed },
    });
  };
  const updateWords = (raw: string) => {
    setConfig('aamode', {
      ...config.aamode,
      condition: { ...config.aamode.condition, words: raw.split(/\r|\r\n|\n/).filter((word) => !!word) },
    });
  };

  return (
    <SectionPanel title="AAモード">
      <Caption>条件に合致するレスを専用のフォントで表示します。</Caption>
      <FormControlLabel
        control={<Checkbox size="small" checked={config.aamode.enable} onChange={(e) => setConfig('aamode', { ...config.aamode, enable: e.target.checked })} />}
        label="有効にする"
      />
      <Box sx={{ mt: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          判定条件
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
          <TextField size="small" value={String(config.aamode.condition.length)} onChange={(e) => updateLength(e.target.value)} sx={{ width: 200 }} />
          <Typography variant="body2">文字以上、または下記文字列を含む場合</Typography>
        </Box>
        <TextField multiline minRows={4} fullWidth sx={{ mt: 1, maxWidth: 400 }} value={config.aamode.condition.words.join('\n')} onChange={(e) => updateWords(e.target.value)} />
      </Box>
    </SectionPanel>
  );
};
