import * as React from 'react';
import { Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography } from '@mui/material';
import { sections, SectionId } from './sections';

const DRAWER_WIDTH = 220;

type Props = {
  selected: SectionId;
  onSelect: (id: SectionId) => void;
};

export const Sidebar: React.FC<Props> = ({ selected, onSelect }) => (
  <Drawer
    variant="permanent"
    sx={{
      width: DRAWER_WIDTH,
      flexShrink: 0,
      [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH, boxSizing: 'border-box' },
    }}
  >
    <Toolbar variant="dense" sx={{ minHeight: 40 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
        unacast
      </Typography>
    </Toolbar>
    <Box sx={{ overflow: 'auto' }}>
      <List dense>
        {sections.map((s) => (
          <ListItemButton key={s.id} selected={selected === s.id} onClick={() => onSelect(s.id)}>
            <ListItemIcon sx={{ minWidth: 36 }}>{s.icon}</ListItemIcon>
            <ListItemText primary={s.label} primaryTypographyProps={{ fontSize: 13 }} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  </Drawer>
);

export const sidebarWidth = DRAWER_WIDTH;
