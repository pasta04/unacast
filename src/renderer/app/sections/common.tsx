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
  return <FormControlLabel control={<Checkbox checked={checked} onChange={(e) => onChange(e.target.checked)} size="small" />} label={label} />;
};
