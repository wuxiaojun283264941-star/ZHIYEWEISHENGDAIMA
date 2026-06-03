import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography
} from '@mui/material';

/** Confirmation dialog component */
function ConfirmDialog({ open, title = '确认操作', message = '确定要执行此操作吗？', onConfirm, onCancel }) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>取消</Button>
        <Button onClick={onConfirm} variant="contained" color="error">确认</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ConfirmDialog;
