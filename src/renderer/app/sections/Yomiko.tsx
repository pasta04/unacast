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
import { SectionPanel, Caption, StatusDot, getStatusColor, HelpPopover } from './common';
import { findUnknownPlaceholders } from '../../../main/yomikoTemplate';

type YomikoType = AppConfig['typeYomiko'];

const yomikoOptions: { value: YomikoType; label: string }[] = [
  { value: 'none', label: '使用しない' },
  { value: 'tamiyasu', label: '民安☆Talk' },
  { value: 'bouyomi', label: '棒読みちゃん' },
  { value: 'voicevox', label: 'VOICE VOX' },
];

/** テンプレートのソース別設定の行定義。anonymous=true のソースだけ匿名用テンプレートを持てる */
const TEMPLATE_SOURCE_DEFS: { key: CommentSource; label: string; anonymous: boolean }[] = [
  { key: 'bbs', label: '掲示板', anonymous: true },
  { key: 'jpnkn', label: 'jpnkn Fast', anonymous: true },
  { key: 'youtube', label: 'YouTube', anonymous: false },
  { key: 'twitch', label: 'Twitch', anonymous: false },
  { key: 'niconico', label: 'ニコ生', anonymous: true },
  { key: 'twitcasting', label: 'ツイキャス', anonymous: false },
  { key: 'stt', label: '音声認識', anonymous: false },
  { key: 'external', label: '外部API', anonymous: false },
];

/** テンプレート入力の検証。未知のプレースホルダがあればエラーメッセージを返す */
const validateTemplate = (template: string): string => {
  const unknown = findUnknownPlaceholders(template);
  return unknown.length > 0 ? `不明なプレースホルダ: ${unknown.join(' ')}` : '';
};

type TemplateDraftRow = { template: string; anonymousTemplate: string };

/**
 * 読み上げテンプレートのソース別設定ダイアログ。
 * ドラフト編集 + キャンセル/OK 方式 (NGワード編集と同じパターン)。
 * 空欄 = 既定テンプレートを使う。
 */
const YomikoTemplateDialog: React.FC = () => {
  const open = useAppStore((s) => s.yomikoTemplateDialogOpen);
  const setOpen = useAppStore((s) => s.setYomikoTemplateDialogOpen);
  const setConfig = useAppStore((s) => s.setConfig);

  const [draft, setDraft] = React.useState<Record<string, TemplateDraftRow>>({});
  const [draftBbsName, setDraftBbsName] = React.useState('');

  React.useEffect(() => {
    if (!open) return;
    const cfg = useAppStore.getState().config;
    const next: Record<string, TemplateDraftRow> = {};
    for (const def of TEMPLATE_SOURCE_DEFS) {
      const per = cfg.yomikoTemplate.perSource[def.key];
      next[def.key] = { template: per?.template ?? '', anonymousTemplate: per?.anonymousTemplate ?? '' };
    }
    setDraft(next);
    setDraftBbsName(cfg.bbsAnonymousName ?? '');
  }, [open]);

  const updateRow = (key: string, patch: Partial<TemplateDraftRow>) => {
    setDraft((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const errors: Record<string, { template: string; anonymousTemplate: string }> = {};
  let hasInvalid = false;
  for (const def of TEMPLATE_SOURCE_DEFS) {
    const row = draft[def.key];
    const e = { template: row ? validateTemplate(row.template) : '', anonymousTemplate: row ? validateTemplate(row.anonymousTemplate) : '' };
    if (e.template || e.anonymousTemplate) hasInvalid = true;
    errors[def.key] = e;
  }

  const cancel = () => setOpen(false);
  const submit = () => {
    const cfg = useAppStore.getState().config;
    const perSource: AppConfig['yomikoTemplate']['perSource'] = {};
    for (const def of TEMPLATE_SOURCE_DEFS) {
      const row = draft[def.key];
      if (!row) continue;
      const template = row.template.trim();
      const anonymousTemplate = def.anonymous ? row.anonymousTemplate.trim() : '';
      if (template || anonymousTemplate) {
        perSource[def.key] = { ...(template ? { template } : {}), ...(anonymousTemplate ? { anonymousTemplate } : {}) };
      }
    }
    setConfig('yomikoTemplate', { ...cfg.yomikoTemplate, perSource });
    setConfig('bbsAnonymousName', draftBbsName.trim());
    setOpen(false);
  };

  return (
    <Dialog open={open} onClose={cancel} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        ソース別読み上げテンプレート
        <HelpPopover>
          空欄のソースは既定テンプレートを使います。
          <br />
          <br />
          <strong>プレースホルダ:</strong>
          <br />
          <code>{'{text}'}</code> 本文
          <br />
          <code>{'{name}'}</code> 名前
          <br />
          <code>{'{res}'}</code> レス番号・コメント番号
          <br />
          <br />
          <strong>例:</strong>
          <br />
          ・掲示板: <code>{'レス{res}番さん、{text}'}</code>
          <br />
          ・YouTube: <code>{'{name}さん、{text}'}</code>
          <br />
          <br />
          <strong>匿名用テンプレート:</strong>
          <br />
          匿名コメント (掲示板: デフォルトネームでの書き込み / ニコ生: 184) のときに使うテンプレートです。
          <br />
          空欄なら通常のテンプレートを使います。
          <br />
          <br />
          <strong>デフォルトネーム:</strong>
          <br />
          掲示板のデフォルトネームは SETTING.TXT から自動取得します。
          <br />
          取得できない板を使う場合のみ下部の手動指定を設定してください。
        </HelpPopover>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gridTemplateColumns: '110px 1fr 1fr', gap: 1, alignItems: 'start', mt: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            ソース
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            テンプレート (空欄=既定)
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            匿名用テンプレート (空欄=通常と同じ)
          </Typography>
          {TEMPLATE_SOURCE_DEFS.map((def) => {
            const row = draft[def.key] ?? { template: '', anonymousTemplate: '' };
            const error = errors[def.key];
            return (
              <React.Fragment key={def.key}>
                <Typography variant="body2" sx={{ pt: 1 }}>
                  {def.label}
                </Typography>
                <TextField
                  size="small"
                  value={row.template}
                  error={!!error.template}
                  helperText={error.template || ' '}
                  onChange={(e) => updateRow(def.key, { template: e.target.value })}
                />
                {def.anonymous ? (
                  <TextField
                    size="small"
                    value={row.anonymousTemplate}
                    error={!!error.anonymousTemplate}
                    helperText={error.anonymousTemplate || ' '}
                    onChange={(e) => updateRow(def.key, { anonymousTemplate: e.target.value })}
                  />
                ) : (
                  <Typography variant="caption" color="text.secondary" sx={{ pt: 1 }}>
                    (匿名の概念なし)
                  </Typography>
                )}
              </React.Fragment>
            );
          })}
        </Box>
        <Box sx={{ mt: 1, maxWidth: 400 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            掲示板のデフォルトネーム手動指定 (通常は空欄のまま。自動取得できない板でのみ設定)
          </Typography>
          <TextField size="small" fullWidth value={draftBbsName} placeholder="例: 名無しさん" onChange={(e) => setDraftBbsName(e.target.value)} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={cancel}>キャンセル</Button>
        <Button onClick={submit} variant="contained" disabled={hasInvalid}>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};

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
  const setYomikoTemplateDialogOpen = useAppStore((s) => s.setYomikoTemplateDialogOpen);

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
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 1 }}>
        VOICE VOX設定
      </Typography>
      <Box sx={{ maxWidth: 600 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            インストールパス
          </Typography>
          <HelpPopover>
            VOICE VOXがインストールされているフォルダを指定します。空の場合は既定のインストール先を調べます。
            <br />
            <br />
            <strong>例:</strong>
            <br />
            <code>{'C:\\Program Files\\VOICEVOX'}</code>
            <br />
            <code>{'C:\\Users\\(ユーザー名)\\AppData\\Local\\Programs\\VOICEVOX'}</code>
            <br />
            ※フォルダ内の vv-engine は自動で探索されるため、指定はVOICEVOXフォルダまでで大丈夫です。
          </HelpPopover>
        </Box>
        <Caption>空の場合は既定のインストール先を調べます。</Caption>
        <TextField
          fullWidth
          size="small"
          value={config.voicevox.path}
          placeholder="C:\Users\(ユーザー名)\AppData\Local\Programs\VOICEVOX"
          onChange={(e) => setConfig('voicevox', { ...config.voicevox, path: e.target.value })}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            エンジンURL
          </Typography>
          <HelpPopover>
            VOICEVOXへの接続は、まずインストールパスから直接読み込みを試し、できない場合はここで指定したエンジンAPIに接続します。
            <br />
            <br />
            <strong>エンジンAPI接続:</strong>
            <br />
            VOICEVOXアプリを起動しておく必要があります。空の場合は既定 (http://127.0.0.1:50021) に接続します。
            <br />
            <br />
            <strong>互換エンジン:</strong>
            <br />
            AivisSpeech (http://127.0.0.1:10101) など、VOICEVOX互換APIを持つエンジンのURLも指定できます。
          </HelpPopover>
        </Box>
        <Caption>空の場合は http://127.0.0.1:50021 に接続します。</Caption>
        <TextField
          fullWidth
          size="small"
          value={config.voicevox.engineUrl}
          placeholder="http://127.0.0.1:50021"
          onChange={(e) => setConfig('voicevox', { ...config.voicevox, engineUrl: e.target.value })}
        />
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
          <StatusDot color={getStatusColor(voicevoxStatus, config.typeYomiko === 'voicevox' || config.typeYomikoStt === 'voicevox')} />
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <FormControlLabel
          control={<Checkbox checked={config.yomikoOmit.enable} onChange={(e) => setConfig('yomikoOmit', { ...config.yomikoOmit, enable: e.target.checked })} size="small" />}
          label="長文の読み上げを省略する"
        />
        <HelpPopover>
          読み上げるテキストが指定した文字数を超える場合、先頭だけを読んで「以下省略」と読み上げます。
          <br />
          <br />
          文字数は、読み上げテンプレートの展開や読み上げ辞書の置き換えを行った後の、実際に読み子へ渡すテキスト全体で数えます。
        </HelpPopover>
      </Box>
      {config.yomikoOmit.enable && (
        <Box sx={{ ml: 4, mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            省略する文字数
          </Typography>
          <TextField
            size="small"
            value={String(config.yomikoOmit.maxLength)}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              setConfig('yomikoOmit', { ...config.yomikoOmit, maxLength: Number.isNaN(v) ? 0 : v });
            }}
          />
        </Box>
      )}
      <Box sx={{ mt: 1 }}>
        <Button variant="outlined" onClick={() => setDictionaryDialogOpen(true)}>
          読み上げ辞書編集
        </Button>
      </Box>

      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          読み上げテンプレート
        </Typography>
        <HelpPopover>
          読み上げに渡すテキストの形式を指定します。
          <br />
          <br />
          <strong>プレースホルダ:</strong>
          <br />
          <code>{'{text}'}</code> 本文
          <br />
          <code>{'{name}'}</code> 名前
          <br />
          <code>{'{res}'}</code> レス番号・コメント番号
          <br />
          ※値が無いプレースホルダは空になります。
          <br />
          <br />
          <strong>例:</strong>
          <br />・<code>{'{name}さん、{text}'}</code>
          <br />・<code>{'レス{res}番さん、{text}'}</code>
          <br />
          <br />
          <strong>ソース別設定:</strong>
          <br />
          「ソース別に設定」で取得元ごとの上書きと、匿名コメント用テンプレートを指定できます。
        </HelpPopover>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, maxWidth: 600 }}>
        <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
          既定
        </Typography>
        <TextField
          size="small"
          fullWidth
          value={config.yomikoTemplate.default}
          error={!!validateTemplate(config.yomikoTemplate.default)}
          helperText={validateTemplate(config.yomikoTemplate.default) || undefined}
          placeholder="{text}"
          onChange={(e) => setConfig('yomikoTemplate', { ...config.yomikoTemplate, default: e.target.value })}
        />
      </Box>
      <Box sx={{ mt: 0.5 }}>
        <Button variant="outlined" onClick={() => setYomikoTemplateDialogOpen(true)}>
          ソース別に設定 ({Object.keys(config.yomikoTemplate.perSource).length} 件)
        </Button>
      </Box>

      <YomikoDictionaryDialog />
      <YomikoTemplateDialog />
    </SectionPanel>
  );
};
