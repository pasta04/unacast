import * as React from 'react';
import { Box, Paper, Typography } from '@mui/material';

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

export const SectionPanel: React.FC<SectionProps> = ({ title, children }) => (
  <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
    <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 'bold', mb: 1 }}>
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
  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
    {children}
  </Typography>
);
