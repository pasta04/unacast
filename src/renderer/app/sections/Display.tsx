import * as React from 'react';
import { Box, Checkbox, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField, Typography } from '@mui/material';
import { useAppStore } from '../store';
import type { AppConfig } from '../config';
import { SectionPanel, Caption } from './common';

const IconPathField: React.FC<{ label: string; field: keyof AppConfig; disabled: boolean }> = ({ label, field, disabled }) => {
  const value = useAppStore((s) => s.config[field]) as string;
  const setConfig = useAppStore((s) => s.setConfig);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
      <Typography variant="body2" sx={{ minWidth: 100, fontWeight: 'bold' }}>
        {label}
      </Typography>
      <TextField fullWidth size="small" value={value} placeholder="C:\\hogehoge\\fugafuga" onChange={(e) => setConfig(field, e.target.value as any)} disabled={disabled} />
    </Box>
  );
};

export const Display: React.FC = () => {
  const config = useAppStore((s) => s.config);
  const setConfig = useAppStore((s) => s.setConfig);
  const isServerRunning = useAppStore((s) => s.isServerRunning);

  return (
    <SectionPanel title="表示設定">
      <FormControl sx={{ mb: 2 }}>
        <FormLabel>表示タイプ</FormLabel>
        <RadioGroup row value={String(config.dispType)} onChange={(_, v) => setConfig('dispType', Number(v) as AppConfig['dispType'])}>
          <FormControlLabel value="0" control={<Radio size="small" disabled={isServerRunning} />} label="チャット風" />
          <FormControlLabel value="1" control={<Radio size="small" disabled={isServerRunning} />} label="SpeechCast風" />
        </RadioGroup>
      </FormControl>

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          初期表示テキスト
        </Typography>
        <Caption>SpeechCast風表示ではレスが無い時の字幕になります。</Caption>
        <TextField fullWidth size="small" value={config.initMessage} onChange={(e) => setConfig('initMessage', e.target.value)} />
      </Box>

      <FormControlLabel control={<Checkbox checked={config.showIcon} onChange={(e) => setConfig('showIcon', e.target.checked)} size="small" />} label="アイコン表示" />

      <Box sx={{ mt: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          アイコンのフォルダパス
        </Typography>
        <Caption>フォルダ内のアイコンをランダムで使用。指定しない場合はデフォルトアイコン</Caption>
        <IconPathField label="BBS" field="iconDirBbs" disabled={isServerRunning} />
        <IconPathField label="Youtube" field="iconDirYoutube" disabled={isServerRunning} />
        <IconPathField label="Twitch" field="iconDirTwitch" disabled={isServerRunning} />
        <IconPathField label="niconico" field="iconDirNiconico" disabled={isServerRunning} />
        <IconPathField label="twitcasting" field="iconDirTwitcasting" disabled={isServerRunning} />
        <IconPathField label="音声認識" field="iconDirStt" disabled={isServerRunning} />
      </Box>

      <Box sx={{ mt: 1 }}>
        <FormControlLabel
          control={<Checkbox checked={config.showNumber} onChange={(e) => setConfig('showNumber', e.target.checked)} size="small" />}
          label="レス番表示(掲示板レスのみ有効)"
        />
        <FormControlLabel control={<Checkbox checked={config.showName} onChange={(e) => setConfig('showName', e.target.checked)} size="small" />} label="名前表示" />
        <FormControlLabel
          control={<Checkbox checked={config.showTime} onChange={(e) => setConfig('showTime', e.target.checked)} size="small" />}
          label="時刻表示(掲示板レスのみ有効)"
        />
        <FormControlLabel
          control={<Checkbox checked={config.wordBreak} onChange={(e) => setConfig('wordBreak', e.target.checked)} size="small" disabled={isServerRunning} />}
          label="横幅超過時に自動改行する"
        />
      </Box>

      <FormControl sx={{ mt: 2 }}>
        <FormLabel>レス表示順序</FormLabel>
        <RadioGroup row value={config.dispSort ? 'down' : 'up'} onChange={(_, v) => setConfig('dispSort', v === 'down')}>
          <FormControlLabel value="up" control={<Radio size="small" disabled={isServerRunning} />} label="新着が上" />
          <FormControlLabel value="down" control={<Radio size="small" disabled={isServerRunning} />} label="新着が下" />
        </RadioGroup>
      </FormControl>

      <FormControl sx={{ display: 'block', mt: 2 }}>
        <FormLabel>名前と本文を改行で分ける</FormLabel>
        <RadioGroup row value={config.newLine ? 'enable' : 'disable'} onChange={(_, v) => setConfig('newLine', v === 'enable')}>
          <FormControlLabel value="disable" control={<Radio size="small" />} label="分けない" />
          <FormControlLabel value="enable" control={<Radio size="small" />} label="分ける" />
        </RadioGroup>
      </FormControl>

      <FormControl sx={{ display: 'block', mt: 2 }}>
        <FormLabel>画像URLのサムネイル表示</FormLabel>
        <RadioGroup row value={String(config.thumbnail)} onChange={(_, v) => setConfig('thumbnail', Number(v) as AppConfig['thumbnail'])}>
          <FormControlLabel value="0" control={<Radio size="small" />} label="非表示" />
          <FormControlLabel value="1" control={<Radio size="small" />} label="チャット欄に表示" />
          <FormControlLabel value="2" control={<Radio size="small" />} label="チャット欄＋サーバに表示" />
        </RadioGroup>
        <FormControlLabel
          control={<Checkbox checked={config.hideImgUrl} onChange={(e) => setConfig('hideImgUrl', e.target.checked)} size="small" />}
          label="画像URL非表示(サムネ有効時のみ)"
        />
      </FormControl>

      <Box sx={{ mt: 2, maxWidth: 600 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          レス表示秒数(SpeechCast風のみ)
        </Typography>
        <TextField
          size="small"
          value={String(config.minDisplayTime)}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!Number.isNaN(v)) setConfig('minDisplayTime', v);
            else if (e.target.value === '') setConfig('minDisplayTime', 0);
          }}
          inputProps={{ pattern: '[0-9]+(\\.[0-9])?' }}
        />
      </Box>

      <FormControl sx={{ display: 'block', mt: 2 }}>
        <FormLabel>Twitchエモートの表示設定</FormLabel>
        <RadioGroup row value={String(config.emoteSize)} onChange={(_, v) => setConfig('emoteSize', Number(v) as AppConfig['emoteSize'])}>
          <FormControlLabel value="1" control={<Radio size="small" />} label="サイズ小" />
          <FormControlLabel value="2" control={<Radio size="small" />} label="サイズ中" />
          <FormControlLabel value="3" control={<Radio size="small" />} label="サイズ大" />
        </RadioGroup>
        <FormControlLabel
          control={<Checkbox checked={config.emoteAnimation} onChange={(e) => setConfig('emoteAnimation', e.target.checked)} size="small" />}
          label="アニメーション表示"
        />
      </FormControl>
    </SectionPanel>
  );
};
