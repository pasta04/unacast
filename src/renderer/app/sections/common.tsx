import * as React from 'react';
import { Box, Checkbox, FormControlLabel, Paper, Typography } from '@mui/material';
import { useAppStore } from '../store';

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

export const SectionPanel: React.FC<SectionProps> = ({ title, children }) => (
  <Paper variant="outlined" sx={{ px: 1.5, py: 1, mb: 1 }}>
    <Typography variant="h6" sx={{ mb: 0.5 }}>
      {title}
    </Typography>
    <Box>{children}</Box>
  </Paper>
);

type LabeledProps = {
  prefix?: string;
  suffix?: string;
  children: React.ReactNode;
};

export const LabeledInput: React.FC<LabeledProps> = ({ prefix, suffix, children }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    {prefix && (
      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
        {prefix}
      </Typography>
    )}
    {children}
    {suffix && (
      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
        {suffix}
      </Typography>
    )}
  </Box>
);

export const Caption: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
    {children}
  </Typography>
);

/**
 * 取得元ごとの接続状況を表す丸アイコンの色。
 * - gray : 未指定 / 起動前 / サーバ停止後
 * - red  : エラー状態
 * - green: 正常 (コメント取得中 / 配信待ちで通信は成立している)
 */
export type StatusColor = 'green' | 'red' | 'gray';

/**
 * 状態文字列と「ID/URL が設定されているか」から StatusDot の色を決める。
 * 状態文字列は main 側の electronEvent.UPDATE_STATUS で送られてくる固定パターン
 * (`ok`, `ok No=...`, `wait live`, `connection waiting`, `error`, `error!`,
 *  `disconnect`, `connection end`, `started`, `stopped`, `none` 等) を前提に判定する。
 */
export const getStatusColor = (status: string, configured: boolean): StatusColor => {
  if (!configured) return 'gray';
  if (!status || status === 'none') return 'gray';
  const lower = status.toLowerCase();
  if (lower.includes('error') || status.includes('読み込めません')) return 'red';
  if (lower === 'connection end' || lower === 'disconnect' || lower === 'stopped') return 'gray';
  return 'green';
};

const STATUS_DOT_COLORS: Record<StatusColor, string> = {
  green: '#4caf50',
  red: '#f44336',
  gray: '#bdbdbd',
};

/** 接続状況を示す小さい丸アイコン (status: 表記の左に置く) */
export const StatusDot: React.FC<{ color: StatusColor }> = ({ color }) => (
  <Box
    component="span"
    sx={{
      display: 'inline-block',
      width: 8,
      height: 8,
      borderRadius: '50%',
      backgroundColor: STATUS_DOT_COLORS[color],
      mr: 0.5,
      verticalAlign: 'middle',
    }}
  />
);

/**
 * レス取得元別の出力先 (sourceFilter) チェックボックス。
 * 取得元 (`source`) と軸 (`axis`) を渡すと、その値を on/off できる。
 * 未定義は true 扱い (= チェック状態)。
 */
export const SourceFilterToggle: React.FC<{
  source: CommentSource;
  axis: SourceFilterAxis;
  label?: string;
}> = ({ source, axis, label = '配信画面に表示' }) => {
  const config = useAppStore((s) => s.config);
  const setConfig = useAppStore((s) => s.setConfig);
  const axisMap = config.sourceFilter?.[axis] ?? {};
  const checked = (axisMap as Record<string, boolean | undefined>)[source] !== false;
  const onChange = (value: boolean) => {
    setConfig('sourceFilter', {
      ...config.sourceFilter,
      [axis]: { ...axisMap, [source]: value },
    });
  };
  return (
    <FormControlLabel
      // Checkbox 内部 padding (theme で 3px) ぶん負方向に寄せて、アイコン左端を
      // URL / status の左端 (=0) に揃える
      sx={{ display: 'flex', mt: '-6px', mb: '2px', ml: '-3px' }}
      control={<Checkbox checked={checked} onChange={(e) => onChange(e.target.checked)} size="small" sx={{ py: 0 }} />}
      label={label}
    />
  );
};
