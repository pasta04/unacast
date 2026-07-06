import * as React from 'react';
import { Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, TextField, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAppStore } from '../store';
import type { AppConfig } from '../config';
import { SectionPanel, Caption } from './common';
import { validateNgRegexp } from '../../../main/ngWord';

type NgWordEntry = AppConfig['ngWords'][number];

const defaultEntry: NgWordEntry = {
  word: '',
  matchType: 'include',
  multiline: false,
  target: 'text',
  source: 'all',
  displayType: 'normal',
};

/**
 * 各エントリのバリデーション結果を計算する。
 * - matchType=regexp かつ word が非空のときだけ実バリデーション。
 * - word が空または matchType=include の場合は ok 扱い (= 入力途中)。
 */
const validateEntry = (entry: NgWordEntry): { ok: true } | { ok: false; error: string } => {
  if (entry.matchType !== 'regexp' || !entry.word) return { ok: true };
  return validateNgRegexp(entry.word, entry.multiline);
};

const NgWordListDialog: React.FC = () => {
  const open = useAppStore((s) => s.ngWordDialogOpen);
  const setOpen = useAppStore((s) => s.setNgWordDialogOpen);
  const ngWords = useAppStore((s) => s.config.ngWords);
  const setConfig = useAppStore((s) => s.setConfig);

  const updateEntry = (index: number, patch: Partial<NgWordEntry>) => {
    const next = ngWords.map((entry, i) => (i === index ? { ...entry, ...patch } : entry));
    setConfig('ngWords', next);
  };
  const addEntry = () => setConfig('ngWords', [...ngWords, { ...defaultEntry }]);
  const removeEntry = (index: number) =>
    setConfig(
      'ngWords',
      ngWords.filter((_, i) => i !== index),
    );

  // 1 件でも不正な正規表現があれば確定 / 追加ボタンを無効化する
  const validations = ngWords.map(validateEntry);
  const hasInvalid = validations.some((v) => !v.ok);
  const disabledTooltip = hasInvalid ? '正規表現エラーを修正してください' : '';

  return (
    <Dialog open={open} onClose={() => (hasInvalid ? undefined : setOpen(false))} maxWidth="lg" fullWidth>
      <DialogTitle>NGワード編集</DialogTitle>
      <DialogContent>
        <Caption>
          ・部分一致: <code>word</code> が対象テキストに含まれていればマッチ。
          <br />
          ・正規表現: <code>word</code> を正規表現として評価。
          <br />
          ・複数行: OFF (既定) は改行で行ごとに判定、ON は対象テキスト全体を 1 つの塊として判定。
          <br />
          ・本文中の改行タグ (<code>{'<br>'}</code>) は改行文字に変換してから判定します。複数行 ON の正規表現では <code>^</code> <code>$</code>{' '}
          が各行の先頭・末尾にマッチし、行またぎは <code>\n</code> や <code>[\s\S]</code> で書けます。
          <br />
          ・対象: 本文 (既定) / 名前 のどちらに対して判定するか。
          <br />
          ・表示方法: 通常NG = チャット窓に本文 + 🚫 マーク表示 / 透明NG = チャット窓にも完全非表示。 配信画面 / 読み上げ / 着信音はいずれの場合も常に非表示・無音。
        </Caption>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'minmax(160px, 2fr) 130px 100px 90px 130px 40px',
            gap: 1,
            alignItems: 'start',
            mt: 1,
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            word
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            マッチ方式
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            対象
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            複数行
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            表示方法
          </Typography>
          <Box />
          {ngWords.map((entry, i) => {
            const validation = validations[i];
            const hasError = !validation.ok;
            const helperText = hasError ? `無効な正規表現: ${validation.error}` : ' ';
            return (
              <React.Fragment key={i}>
                <TextField size="small" value={entry.word} error={hasError} helperText={helperText} onChange={(e) => updateEntry(i, { word: e.target.value })} />
                <TextField
                  select
                  size="small"
                  value={entry.matchType}
                  onChange={(e) => updateEntry(i, { matchType: e.target.value as NgWordEntry['matchType'] })}
                  // helperText の高さに揃えるためダミー
                  helperText=" "
                >
                  <MenuItem value="include">部分一致</MenuItem>
                  <MenuItem value="regexp">正規表現</MenuItem>
                </TextField>
                <TextField select size="small" value={entry.target} onChange={(e) => updateEntry(i, { target: e.target.value as NgWordEntry['target'] })} helperText=" ">
                  <MenuItem value="text">本文</MenuItem>
                  <MenuItem value="name">名前</MenuItem>
                </TextField>
                <Box sx={{ display: 'flex', alignItems: 'center', height: '40px' }}>
                  <Checkbox size="small" checked={entry.multiline} onChange={(e) => updateEntry(i, { multiline: e.target.checked })} />
                </Box>
                <TextField
                  select
                  size="small"
                  value={entry.displayType}
                  onChange={(e) => updateEntry(i, { displayType: e.target.value as NgWordEntry['displayType'] })}
                  helperText=" "
                >
                  <MenuItem value="normal">通常NG</MenuItem>
                  <MenuItem value="transparent">透明NG</MenuItem>
                </TextField>
                <Box sx={{ display: 'flex', alignItems: 'center', height: '40px' }}>
                  <IconButton size="small" onClick={() => removeEntry(i)} aria-label="delete">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </React.Fragment>
            );
          })}
        </Box>
        <Box sx={{ mt: 1 }}>
          <Tooltip title={disabledTooltip} disableHoverListener={!hasInvalid}>
            <span>
              <IconButton size="small" onClick={addEntry} aria-label="add" disabled={hasInvalid}>
                <AddIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </DialogContent>
      <DialogActions>
        <Tooltip title={disabledTooltip} disableHoverListener={!hasInvalid}>
          <span>
            <Button onClick={() => setOpen(false)} variant="contained" disabled={hasInvalid}>
              閉じる
            </Button>
          </span>
        </Tooltip>
      </DialogActions>
    </Dialog>
  );
};

export const NgWord: React.FC = () => {
  const ngWords = useAppStore((s) => s.config.ngWords);
  const setNgWordDialogOpen = useAppStore((s) => s.setNgWordDialogOpen);

  return (
    <SectionPanel title="NGワード設定">
      <Caption>
        該当コメントは <strong>読み上げ・配信用チャット欄</strong> から常に除外されます。
        <br />
        自分のチャットウィンドウでの見え方はワードごとに <strong>通常NG</strong> (本文 + 🚫 マーク) /<strong>透明NG</strong> (一切表示しない) を選べます。デフォルトは通常NG。
      </Caption>
      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button variant="outlined" onClick={() => setNgWordDialogOpen(true)}>
          NGワード編集 ({ngWords.length} 件)
        </Button>
      </Box>
      <NgWordListDialog />
    </SectionPanel>
  );
};
