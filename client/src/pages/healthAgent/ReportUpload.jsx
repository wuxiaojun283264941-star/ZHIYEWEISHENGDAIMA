import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Alert
} from '@mui/material';
import FileUploader from '../../components/FileUploader';
import { uploadExamReport } from '../../api/examReport';

function ReportUpload({ open, onClose, taskId, employee, onSuccess }) {
  const [error, setError] = useState('');

  const handleUpload = async (formData) => {
    setError('');
    try {
      await uploadExamReport(formData);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>上传体检报告</DialogTitle>
      <DialogContent>
        {employee && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            为 <strong>{employee.employee_name}</strong> 上传体检报告
          </Typography>
        )}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <FileUploader
          onUpload={handleUpload}
          taskId={taskId}
          employeeId={employee?.employee_id}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>关闭</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ReportUpload;
