import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Alert, CircularProgress
} from '@mui/material';
import { completeExamTask } from '../../api/examTask';

function CompleteConfirm({ open, onClose, taskId, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setError('');
    setLoading(true);
    try {
      await completeExamTask(taskId);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>确认完成</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography>确认将此任务标记为已完成并推送至卫生托管单位？此操作不可撤销。</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>取消</Button>
        <Button variant="contained" color="success" onClick={handleConfirm} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : '确认完成'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CompleteConfirm;
