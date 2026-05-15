import * as React from 'react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  MenuItem,
  Radio,
  RadioGroup,
  Slider,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAppStore } from '../store';
import type { AppConfig } from '../config';
import { SectionPanel, Caption } from './common';

type YomikoType = AppConfig['typeYomiko'];

const yomikoOptions: { value: YomikoType; label: string }[] = [
  { value: 'none', label: '使用しない' },
  { value: 'tamiyasu', label: '民安☆Talk' },
  { value: 'bouyomi', label: '棒読みちゃん' },
  { value: 'voicevox', label: 'VOICE VOX' },
];

const YomikoDictionaryDialog: React.FC = () => {
  const open = useAppStore((s) => s.dictionaryDialogOpen);
  const setOpen = useAppStore((s) => s.setDictionaryDialogOpen);
  const dictionary = useAppStore((s) => s.config.yomikoDictionary);
  const setConfig = useAppStore((s) => s.setConfig);

  const updateEntry = (index: number, patch: { pattern?: string; pronunciation?: string }) => {
    const next = dictionary.map((entry, i) => (i === index ? { ...entry, ...patch } : entry));
    setConfig('yomikoDictionary', next);
  };
  const addEntry = () => setConfig('yomikoDictionary', [...dictionary, { pattern: '', pronunciation: '' }]);
  const removeEntry = (index: number) =>
    setConfig(
      'yomikoDictionary',
      dictionary.filter((_, i) => i !== index),
    );

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md">
      <DialogTitle>読み上げ辞書編集</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 40px', gap: 1, alignItems: 'center' }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            置き換え対象(正規表現)
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            読み方
          </Typography>
          <Box />
          {dictionary.map((entry, i) => (
            <React.Fragment key={i}>
              <TextField size="small" value={entry.pattern} onChange={(e) => updateEntry(i, { pattern: e.target.value })} />
              <TextField size="small" value={entry.pronunciation} onChange={(e) => updateEntry(i, { pronunciation: e.target.value })} />
              <IconButton size="small" onClick={() => removeEntry(i)} aria-label="delete">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </React.Fragment>
          ))}
        </Box>
        <Box sx={{ mt: 1 }}>
          <IconButton size="small" onClick={addEntry} aria-label="add">
            <AddIcon />
          </IconButton>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)} variant="contained">
          閉じる
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const Yomiko: React.FC = () => {
  const config = useAppStore((s) => s.config);
  const setConfig = useAppStore((s) => s.setConfig);
  const speakers = useAppStore((s) => s.voicevoxSpeakers);
  const voicevoxStatus = useAppStore((s) => s.status.voicevox);
  const setDictionaryDialogOpen = useAppStore((s) => s.setDictionaryDialogOpen);

  return (
    <SectionPanel title="読み子設定">
      <FormControl sx={{ display: 'block', mb: 1 }}>
        <FormLabel>読み子の種類</FormLabel>
        <RadioGroup row value={config.typeYomiko} onChange={(_, v) => setConfig('typeYomiko', v as YomikoType)}>
          {yomikoOptions.map((opt) => (
            <FormControlLabel key={opt.value} value={opt.value} control={<Radio size="small" />} label={opt.label} />
          ))}
        </RadioGroup>
      </FormControl>

      <FormControl sx={{ display: 'block', mb: 1 }}>
        <FormLabel>音声認識テキスト読み子の種類</FormLabel>
        <RadioGroup row value={config.typeYomikoStt} onChange={(_, v) => setConfig('typeYomikoStt', v as AppConfig['typeYomikoStt'])}>
          {yomikoOptions.map((opt) => (
            <FormControlLabel key={opt.value} value={opt.value} control={<Radio size="small" />} label={opt.label} />
          ))}
        </RadioGroup>
      </FormControl>

      <Box sx={{ mb: 1, maxWidth: 600 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          民安☆Talkのファイルパス
        </Typography>
        <TextField fullWidth size="small" value={config.tamiyasuPath} placeholder="C:\\hogehoge\\fugafuga\\vrx.exe" onChange={(e) => setConfig('tamiyasuPath', e.target.value)} />
      </Box>

      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 1 }}>
        棒読みちゃん設定
      </Typography>
      <Box sx={{ maxWidth: 600 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          待ち受けポート
        </Typography>
        <TextField
          size="small"
          value={String(config.bouyomiPort)}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            setConfig('bouyomiPort', Number.isNaN(v) ? 0 : v);
          }}
        />
      </Box>
      <Box sx={{ mt: 1 }}>
        <Typography variant="body2">
          音量 <strong>{config.bouyomiVolume}</strong>
        </Typography>
        <Slider min={-1} max={100} value={config.bouyomiVolume} onChange={(_, v) => setConfig('bouyomiVolume', Number(v))} sx={{ maxWidth: 480 }} />
      </Box>
      <Box sx={{ maxWidth: 600 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          プレフィックス
        </Typography>
        <Caption>読み子に送信するテキストの先頭に固定文字列を追加します。</Caption>
        <TextField fullWidth size="small" value={config.bouyomiPrefix} onChange={(e) => setConfig('bouyomiPrefix', e.target.value)} />
      </Box>

      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 1 }}>
        VOICE VOX設定
      </Typography>
      <Box sx={{ maxWidth: 600 }}>
        <Typography variant="caption" sx={{ display: 'block', color: 'warning.main', mb: 0.5 }}>
          ※直接利用可能なバージョンは0.15以下のみ。0.16以上は民安☆Talkを経由してください。
        </Typography>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          インストールパス
        </Typography>
        <Caption>VOICE VOXがインストールされているパスを指定します。空の場合は既定のインストール先を調べます。</Caption>
        <TextField fullWidth size="small" value={config.voicevox.path} onChange={(e) => setConfig('voicevox', { ...config.voicevox, path: e.target.value })} />
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 1 }}>
          話者
        </Typography>
        <TextField
          select
          size="small"
          fullWidth
          value={config.voicevox.speakerAndStyle}
          onChange={(e) => setConfig('voicevox', { ...config.voicevox, speakerAndStyle: e.target.value })}
        >
          {speakers.length === 0 && (
            <MenuItem value="" disabled>
              （読み込み待ち）
            </MenuItem>
          )}
          {speakers.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
        <Typography variant="caption" color="text.secondary">
          status: {voicevoxStatus}
        </Typography>
      </Box>

      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 1 }}>
        その他の読み子設定
      </Typography>
      <FormControlLabel
        control={<Checkbox checked={config.yomikoReplaceNewline} onChange={(e) => setConfig('yomikoReplaceNewline', e.target.checked)} size="small" />}
        label="読み子に渡す時に改行削除"
      />
      <Box sx={{ mt: 1 }}>
        <Button variant="outlined" onClick={() => setDictionaryDialogOpen(true)}>
          読み上げ辞書編集
        </Button>
      </Box>
      <YomikoDictionaryDialog />
    </SectionPanel>
  );
};
