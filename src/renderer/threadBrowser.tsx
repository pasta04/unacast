/**
 * スレッドブラウザウィンドウ。
 *
 * 左にスレッド一覧、右に選択スレのプレビュー (1レス目 + 末尾10レス) を表示する。
 * bbs モードでは「このスレッドに移動」でコメント読み込みのスレURLを置き換えられる。
 * jpnkn モードは板全体を MQTT で受信する方式で特定スレを読む概念がないため、
 * 一覧とプレビューのみ (移動ボタンは表示しない)。
 *
 * モードは URL クエリ `?mode=bbs|jpnkn` で受け取る (main/threadBrowser.ts が付与)。
 */
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import electron from 'electron';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Snackbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import RefreshIcon from '@mui/icons-material/Refresh';
import { compactTheme } from './app/theme';
import { electronEvent } from '../main/const';
import type { ThreadBrowserMode, ThreadPreviewItem } from '../main/threadBrowser';

const ipcRenderer = electron.ipcRenderer;

type ThreadItem = { url: string; name: string; resNum: number };
type InitResult = { ok: boolean; error?: string; mode?: ThreadBrowserMode; boardUrl?: string; boardName?: string; currentThreadUrl?: string };
type ListResult = { ok: boolean; error?: string; threads?: ThreadItem[] };
type PreviewResult = { ok: boolean; error?: string; total?: number; comments?: ThreadPreviewItem[] };
type ApplyResult = { ok: boolean; error?: string };

const mode: ThreadBrowserMode = new URLSearchParams(location.search).get('mode') === 'jpnkn' ? 'jpnkn' : 'bbs';

/** プレビューの1レス表示 */
const PreviewComment: React.FC<{ item: ThreadPreviewItem }> = ({ item }) => (
  <Box sx={{ mb: 1 }}>
    <Typography variant="caption" color="text.secondary">
      {item.number} {item.name} {item.date}
    </Typography>
    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {item.text}
    </Typography>
  </Box>
);

const ThreadBrowserApp: React.FC = () => {
  const [boardName, setBoardName] = React.useState('');
  const [boardUrl, setBoardUrl] = React.useState('');
  const [currentThreadUrl, setCurrentThreadUrl] = React.useState('');
  const [initError, setInitError] = React.useState('');

  const [threads, setThreads] = React.useState<ThreadItem[]>([]);
  const [listLoading, setListLoading] = React.useState(false);
  const [listError, setListError] = React.useState('');

  const [selectedUrl, setSelectedUrl] = React.useState('');
  const [preview, setPreview] = React.useState<PreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);

  const [confirmTarget, setConfirmTarget] = React.useState<ThreadItem | null>(null);
  const [snackbar, setSnackbar] = React.useState('');

  const loadList = React.useCallback(async (url: string) => {
    setListLoading(true);
    setListError('');
    const res: ListResult = await ipcRenderer.invoke(electronEvent.THREAD_BROWSER_LIST, url);
    setListLoading(false);
    if (!res.ok) {
      setListError(res.error ?? 'スレッド一覧を取得できませんでした。');
      return;
    }
    setThreads(res.threads ?? []);
  }, []);

  // 初期化: 板情報を解決してスレ一覧を読む
  React.useEffect(() => {
    (async () => {
      const res: InitResult = await ipcRenderer.invoke(electronEvent.THREAD_BROWSER_INIT, mode);
      if (!res.ok) {
        setInitError(res.error ?? '初期化に失敗しました。');
        return;
      }
      setBoardName(res.boardName ?? '');
      setBoardUrl(res.boardUrl ?? '');
      setCurrentThreadUrl(res.currentThreadUrl ?? '');
      await loadList(res.boardUrl ?? '');
    })();
  }, [loadList]);

  const openPreview = async (thread: ThreadItem) => {
    setSelectedUrl(thread.url);
    setPreviewLoading(true);
    setPreview(null);
    const res: PreviewResult = await ipcRenderer.invoke(electronEvent.THREAD_BROWSER_PREVIEW, thread.url);
    setPreviewLoading(false);
    setPreview(res);
  };

  const applyThread = async (thread: ThreadItem) => {
    setConfirmTarget(null);
    const res: ApplyResult = await ipcRenderer.invoke(electronEvent.THREAD_BROWSER_APPLY, thread.url);
    if (!res.ok) {
      setSnackbar(res.error ?? 'スレッドの切り替えに失敗しました。');
      return;
    }
    setCurrentThreadUrl(thread.url);
    setSnackbar(`コメント読み込みスレッドを「${thread.name}」に切り替えました`);
  };

  const selectedThread = threads.find((t) => t.url === selectedUrl);

  if (initError) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{initError}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* ヘッダー: 板名 + 更新 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1, borderBottom: '1px solid #ddd' }}>
        <Typography variant="h6" sx={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {boardName || '読み込み中…'}
        </Typography>
        {mode === 'jpnkn' && <Chip size="small" label="jpnkn (一覧・プレビューのみ)" />}
        <Tooltip title="スレッド一覧を更新">
          <span>
            <IconButton size="small" onClick={() => loadList(boardUrl)} disabled={listLoading || !boardUrl} aria-label="更新">
              <RefreshIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* スレッド一覧 */}
        <Box sx={{ width: '42%', minWidth: 280, borderRight: '1px solid #ddd', overflowY: 'auto' }}>
          {listLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={22} />
            </Box>
          )}
          {listError && (
            <Box sx={{ p: 1.5 }}>
              <Alert
                severity="error"
                action={
                  <Button size="small" onClick={() => loadList(boardUrl)}>
                    再試行
                  </Button>
                }
              >
                {listError}
              </Alert>
            </Box>
          )}
          <List dense disablePadding>
            {threads.map((thread) => {
              const isCurrent = mode === 'bbs' && thread.url === currentThreadUrl;
              return (
                <ListItemButton key={thread.url} selected={thread.url === selectedUrl} onClick={() => openPreview(thread)} sx={{ py: 0.25 }}>
                  <ListItemText
                    primary={
                      <>
                        {isCurrent && <Chip size="small" color="primary" label="読込中" sx={{ mr: 0.5, height: 16, fontSize: 10 }} />}
                        {thread.name} ({thread.resNum})
                      </>
                    }
                    primaryTypographyProps={{ variant: 'body2', sx: { wordBreak: 'break-word' } }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Box>

        {/* プレビュー */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5 }}>
          {!selectedUrl && (
            <Typography variant="body2" color="text.secondary">
              左の一覧からスレッドを選択すると内容をプレビューします。
            </Typography>
          )}
          {previewLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={22} />
            </Box>
          )}
          {preview && !preview.ok && <Alert severity="error">{preview.error}</Alert>}
          {preview?.ok && preview.comments?.map((item) => <PreviewComment key={item.number} item={item} />)}
        </Box>
      </Box>

      {/* フッター: スレ移動 (bbs のみ) */}
      {mode === 'bbs' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1, borderTop: '1px solid #ddd' }}>
          <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedThread ? selectedThread.url : 'スレッドを選択してください'}
          </Typography>
          <Button variant="contained" size="small" disabled={!selectedThread || selectedThread.url === currentThreadUrl} onClick={() => setConfirmTarget(selectedThread ?? null)}>
            このスレッドに移動
          </Button>
        </Box>
      )}

      {/* 移動確認ダイアログ */}
      <Dialog open={!!confirmTarget} onClose={() => setConfirmTarget(null)}>
        <DialogTitle>スレッドの移動</DialogTitle>
        <DialogContent>
          <Typography variant="body2">コメント読み込みのスレッドを以下に切り替えます。よろしいですか?</Typography>
          <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold', wordBreak: 'break-word' }}>
            {confirmTarget?.name} ({confirmTarget?.resNum})
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
            {confirmTarget?.url}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmTarget(null)}>キャンセル</Button>
          <Button variant="contained" onClick={() => confirmTarget && applyThread(confirmTarget)}>
            OK
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snackbar} autoHideDuration={4000} onClose={() => setSnackbar('')} message={snackbar} />
    </Box>
  );
};

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <ThemeProvider theme={compactTheme}>
      <CssBaseline />
      <ThreadBrowserApp />
    </ThemeProvider>,
  );
}
