import * as React from 'react';
import { Box, Checkbox, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField, Typography } from '@mui/material';
import { useAppStore } from '../store';
import type { AppConfig } from '../config';
import { SectionPanel, Caption } from './common';

const intOrZero = (raw: string) => {
  const v = parseInt(raw, 10);
  return Number.isNaN(v) ? 0 : v;
};

export const Other: React.FC = () => {
  const config = useAppStore((s) => s.config);
  const setConfig = useAppStore((s) => s.setConfig);

  return (
    <SectionPanel title="その他">
      <Box sx={{ maxWidth: 600 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          スレのレス番号が超えた時に通知する値(0で使用しない)
        </Typography>
        <TextField
          size="small"
          value={String(config.notifyThreadResLimit)}
          onChange={(e) => setConfig('notifyThreadResLimit', intOrZero(e.target.value))}
          inputProps={{ pattern: '[0-9]{0,5}?' }}
        />
      </Box>

      <Box sx={{ maxWidth: 600, mt: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          掲示板が連続で通信エラーになった時に通知する閾値(0で使用しない)
        </Typography>
        <TextField
          size="small"
          value={String(config.notifyThreadConnectionErrorLimit)}
          onChange={(e) => setConfig('notifyThreadConnectionErrorLimit', intOrZero(e.target.value))}
          inputProps={{ pattern: '[0-9]{0,2}?' }}
        />
      </Box>

      <Box sx={{ mt: 1 }}>
        <Caption>スレ順に探索して、最初に見つかった1000以外のスレに移動します。移動先の初回取得結果はブラウザ側には表示しません。</Caption>
        <FormControlLabel control={<Checkbox size="small" checked={config.moveThread} onChange={(e) => setConfig('moveThread', e.target.checked)} />} label="1000で自動スレ移動" />
      </Box>

      <FormControl sx={{ display: 'block', mt: 2 }}>
        <FormLabel>レスの処理単位</FormLabel>
        <RadioGroup value={String(config.commentProcessType)} onChange={(_, v) => setConfig('commentProcessType', Number(v) as AppConfig['commentProcessType'])}>
          <FormControlLabel value="0" control={<Radio size="small" />} label="新着を優先(着信音等が鳴ってる場合は中断されます)" />
          <FormControlLabel value="1" control={<Radio size="small" />} label="1つずつ" />
        </RadioGroup>
      </FormControl>
    </SectionPanel>
  );
};
