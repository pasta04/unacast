import * as React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { useAppStore } from './store';
import { sendStopServer } from './ipc';

export const ConfirmStopDialog: React.FC = () => {
  const open = useAppStore((s) => s.confirmStopOpen);
  const setOpen = useAppStore((s) => s.setConfirmStopOpen);
  const setServerRunning = useAppStore((s) => s.setServerRunning);

  const handleOk = () => {
    sendStopServer();
    setServerRunning(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)}>
      <DialogTitle>確認</DialogTitle>
      <DialogContent>
        <DialogContentText>サーバーを停止しますか</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)}>キャンセル</Button>
        <Button onClick={handleOk} variant="contained">
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const AlertDialog: React.FC = () => {
  const alert = useAppStore((s) => s.alert);
  const closeAlert = useAppStore((s) => s.closeAlert);

  return (
    <Dialog open={alert.open} onClose={closeAlert}>
      <DialogContent>
        <DialogContentText>{alert.message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={closeAlert} variant="contained">
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};
