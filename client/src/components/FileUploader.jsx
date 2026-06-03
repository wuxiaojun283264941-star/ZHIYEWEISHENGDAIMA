import React, { useState, useRef } from 'react';
import {
  Box, Button, Typography, LinearProgress, Alert, IconButton, Chip
} from '@mui/material';
import { CloudUpload, Close, Description } from '@mui/icons-material';

/** File uploader component for PDF reports */
function FileUploader({ onUpload, taskId, employeeId, disabled = false }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    setError('');
    if (!selected) return;

    if (selected.type !== 'application/pdf') {
      setError('仅支持PDF格式文件');
      return;
    }
    if (selected.size > 20 * 1024 * 1024) {
      setError('文件大小不能超过20MB');
      return;
    }
    setFile(selected);
  };

  const handleUpload = async () => {
    if (!file || !taskId || !employeeId) return;
    setUploading(true);
    setProgress(0);
    setError('');

    try {
      const formData = new FormData();
      formData.append('task_id', taskId);
      formData.append('employee_id', employeeId);
      formData.append('file', file);

      // Simulate progress
      const progressTimer = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      await onUpload(formData);
      clearInterval(progressTimer);
      setProgress(100);
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <Box>
      <input
        type="file"
        ref={inputRef}
        accept=".pdf"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={disabled || uploading}
      />

      {!file ? (
        <Button
          variant="outlined"
          startIcon={<CloudUpload />}
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          sx={{ borderStyle: 'dashed', width: '100%', py: 3 }}
        >
          选择PDF文件上传
        </Button>
      ) : (
        <Box sx={{ p: 2, border: '1px solid', borderColor: 'primary.main', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Description color="primary" />
              <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>{file.name}</Typography>
              <Chip label={`${(file.size / 1024 / 1024).toFixed(2)} MB`} size="small" />
            </Box>
            <IconButton size="small" onClick={handleRemove} disabled={uploading}>
              <Close fontSize="small" />
            </IconButton>
          </Box>

          {uploading && <LinearProgress variant="determinate" value={progress} sx={{ mt: 1 }} />}

          <Button
            variant="contained"
            size="small"
            onClick={handleUpload}
            disabled={uploading}
            sx={{ mt: 1 }}
          >
            {uploading ? '上传中...' : '确认上传'}
          </Button>
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
    </Box>
  );
}

export default FileUploader;
