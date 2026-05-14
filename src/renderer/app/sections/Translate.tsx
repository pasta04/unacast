import * as React from 'react';
import { Checkbox, FormControlLabel, MenuItem, TextField, Typography } from '@mui/material';
import { useAppStore } from '../store';
import type { AppConfig } from '../config';
import { SectionPanel, Caption } from './common';

export const Translate: React.FC = () => {
  const config = useAppStore((s) => s.config);
  const setConfig = useAppStore((s) => s.setConfig);

  return (
    <SectionPanel title="レス翻訳(実験的)">
      <Caption>Google翻訳による翻訳を実行します。ブラウザには表示されません。</Caption>
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={config.translate.enable}
            onChange={(e) => setConfig('translate', { ...config.translate, enable: e.target.checked })}
          />
        }
        label="有効にする"
      />
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 1 }}>
        翻訳先言語
      </Typography>
      <TextField
        select
        size="small"
        value={config.translate.targetLang}
        onChange={(e) =>
          setConfig('translate', { ...config.translate, targetLang: e.target.value as AppConfig['translate']['targetLang'] })
        }
        sx={{ minWidth: 160 }}
      >
        <MenuItem value="ja">日本語</MenuItem>
        <MenuItem value="en">English</MenuItem>
      </TextField>
    </SectionPanel>
  );
};
