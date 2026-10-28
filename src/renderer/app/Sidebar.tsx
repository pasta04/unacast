import * as React from 'react';
import { Box, Divider, Drawer, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { sections, SectionId } from './sections';

const DRAWER_WIDTH = 220;

type Props = {
  selected: SectionId;
  onSelect: (id: SectionId) => void;
};

/** サイドバー */
export const Sidebar: React.FC<Props> = ({ selected, onSelect }) => (
  <Drawer
    variant="permanent"
    sx={{
      width: DRAWER_WIDTH,
      flexShrink: 0,
      [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH, boxSizing: 'border-box' },
    }}
  >
    <Box sx={{ overflow: 'auto' }}>
      <List dense>
        {sections.map((s) => (
          <React.Fragment key={s.id}>
            {s.dividerBefore && <Divider sx={{ my: 0.5 }} />}
            <ListItemButton selected={selected === s.id} onClick={() => onSelect(s.id)}>
              <ListItemIcon sx={{ minWidth: 36 }}>{s.icon}</ListItemIcon>
              <ListItemText primary={s.label} slotProps={{ primary: { sx: { fontSize: 13 } } }} />
            </ListItemButton>
          </React.Fragment>
        ))}
      </List>
    </Box>
  </Drawer>
);

export const sidebarWidth = DRAWER_WIDTH;
