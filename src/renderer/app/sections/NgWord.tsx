import * as React from 'react';
import { Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, TextField, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAppStore } from '../store';
import type { AppConfig } from '../config';
import { SectionPanel, Caption, HelpPopover } from './common';
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
  const setConfig = useAppStore((s) => s.setConfig);

  // ダイアログ内はドラフトを編集し、OK で config へ確定 / キャンセルで破棄する
  const [draft, setDraft] = React.useState<NgWordEntry[]>([]);
  React.useEffect(() => {
    // ngWords は「開いた時点のスナップショット」だけ取りたいので依存は open のみ
    if (open) setDraft(useAppStore.getState().config.ngWords.map((entry) => ({ ...entry })));
  }, [open]);

  const updateEntry = (index: number, patch: Partial<NgWordEntry>) => {
    setDraft(draft.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  };
  const addEntry = () => setDraft([...draft, { ...defaultEntry }]);
  const removeEntry = (index: number) => setDraft(draft.filter((_, i) => i !== index));

  /** キャンセル: 編集内容を破棄して閉じる (正規表現エラーがあっても押せる) */
  const cancel = () => setOpen(false);
  /** OK: ドラフトを config に反映して閉じる (その後の永続化は既存の適用ボタンに従う) */
  const submit = () => {
    setConfig('ngWords', draft);
    setOpen(false);
  };

  // 1 件でも不正な正規表現があれば OK / 追加ボタンを無効化する
  const validations = draft.map(validateEntry);
  const hasInvalid = validations.some((v) => !v.ok);
  const disabledTooltip = hasInvalid ? '正規表現エラーを修正してください' : '';

  return (
    <Dialog open={open} onClose={cancel} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        NGワード編集
        <HelpPopover>
          <strong>マッチ方式:</strong>
          <br />
          ・部分一致: <code>word</code> が対象コメントに含まれていればNGとします。
          <br />
          ・正規表現: <code>word</code> を正規表現としてコメントに含まれていればNGとします。
          <br />
          <strong>対象:</strong>
          <br />
          ・本文 / 名前 のどちらに対してNGワード判定するかを選択します。
          <br />
          <strong>複数行:</strong>
          <br />
          ・OFF: 行ごとに判定。
          <br />
          ・ON: 対象コメント全体を1つの塊として判定。
          <br />
          ・複数行 ON の正規表現では <code>^</code> <code>$</code> が各行の先頭・末尾にマッチし、行またぎは <code>\n</code> や <code>[\s\S]</code> で書けます。
          <br />
          <strong>表示方法:</strong>
          <br />
          chatウインドウでの表示方式を選ぶことができます。
          <br />
          ・通常NG: 本文 + 🚫 マーク表示
          <br />
          ・透明NG: 完全非表示。
        </HelpPopover>
      </DialogTitle>
      <DialogContent>
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
          {draft.map((entry, i) => {
            const validation = validations[i];
            const hasError = !validation.ok;
            // 例外の生メッセージ (Invalid regular expression: ... ) は冗長なので出さない
            const helperText = hasError ? '無効な正規表現' : ' ';
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
        <Button onClick={cancel}>キャンセル</Button>
        <Tooltip title={disabledTooltip} disableHoverListener={!hasInvalid}>
          <span>
            <Button onClick={submit} variant="contained" disabled={hasInvalid}>
              OK
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
    <SectionPanel
      title="NGワード設定"
      help={
        <>
          NGワードに該当するコメントは <strong>読み上げ・着信音・配信用表示</strong> から常に除外されます。
          <br />
          chatウインドウについては、表示・非表示を選ぶことができます。
        </>
      }
    >
      <Caption>該当コメントは読み上げ・配信用チャット欄から除外されます。</Caption>
      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button variant="outlined" onClick={() => setNgWordDialogOpen(true)}>
          NGワード編集 ({ngWords.length} 件)
        </Button>
      </Box>
      <NgWordListDialog />
    </SectionPanel>
  );
};
