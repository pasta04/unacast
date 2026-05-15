import { createTheme } from '@mui/material/styles';

/**
 * unacast 設定ウィンドウ向けのコンパクトテーマ。
 *
 * MUI 既定値は余白・行間に余裕を持たせる UI 向けの値だが、本ツールは
 * 設定項目が多いためウィンドウを小さく保ったまま一覧性を高めたい。
 * 文字サイズ・line-height・パディングをまとめて詰める。
 */
export const compactTheme = createTheme({
  typography: {
    fontSize: 13,
    body1: { fontSize: 13, lineHeight: 1.35 },
    body2: { fontSize: 12, lineHeight: 1.3 },
    subtitle1: { fontSize: 14, lineHeight: 1.35, fontWeight: 600 },
    subtitle2: { fontSize: 13, lineHeight: 1.3, fontWeight: 600 },
    caption: { fontSize: 11, lineHeight: 1.25 },
    h6: { fontSize: 14, lineHeight: 1.4, fontWeight: 700 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          // SectionPanel が outlined の Paper を使う。間隔は SectionPanel 側の sx で調整
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        root: {
          marginLeft: -6,
          marginRight: 8,
        },
        label: {
          fontSize: 12,
        },
      },
    },
    MuiCheckbox: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: { padding: 3 },
      },
    },
    MuiRadio: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: { padding: 3 },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small', margin: 'none' },
    },
    MuiInputBase: {
      styleOverrides: {
        input: {
          paddingTop: 4,
          paddingBottom: 4,
          fontSize: 12,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        input: {
          paddingTop: 5,
          paddingBottom: 5,
          fontSize: 12,
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: { fontSize: 12 },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: { marginBottom: 4 },
      },
    },
    MuiSlider: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: { paddingTop: 8, paddingBottom: 8 },
      },
    },
    MuiButton: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: { textTransform: 'none', minHeight: 24, paddingTop: 2, paddingBottom: 2 },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: { paddingTop: 2, paddingBottom: 2 },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: { minWidth: 32 },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        dense: { minHeight: 32 },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: { fontSize: 12, minHeight: 28 },
      },
    },
  },
});
