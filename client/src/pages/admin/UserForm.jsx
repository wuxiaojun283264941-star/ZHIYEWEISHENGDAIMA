import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, FormControl, InputLabel, Select, MenuItem,
  Paper, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import { createUser, getUserDetail, updateUser, resetUserPassword } from '../../api/admin';

const roleOptions = [
  { value: 'factory', label: '工厂' },
  { value: 'health_agent', label: '体检中心' },
  { value: 'c_unit', label: '卫生托管' },
  { value: 'admin', label: '管理员' },
];

function UserForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);
  const resetPwd = searchParams.get('resetPwd') === '1';

  const [form, setForm] = useState({
    username: '', password: '', role: 'factory', name: '', org_name: '', phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pwdDialogOpen, setPwdDialogOpen] = useState(resetPwd);
  const [newPwd, setNewPwd] = useState('');

  useEffect(() => {
    if (isEdit) {
      loadUser();
    }
  }, [id]);

  const loadUser = async () => {
    try {
      const res = await getUserDetail(id);
      const u = res.data;
      setForm({
        username: u.username || '',
        password: '',
        role: u.role || 'factory',
        name: u.name || '',
        org_name: u.org_name || '',
        phone: u.phone || '',
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.name) { setError('请输入姓名'); return; }
    if (!isEdit && (!form.username || !form.password)) { setError('请输入用户名和密码'); return; }

    setLoading(true);
    try {
      if (isEdit) {
        await updateUser(id, { name: form.name, org_name: form.org_name, phone: form.phone });
        setSuccess('更新成功');
      } else {
        await createUser(form);
        navigate('/admin/users');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPwd = async () => {
    if (!newPwd || newPwd.length < 6) { setError('密码长度不能少于6位'); return; }
    setLoading(true);
    try {
      await resetUserPassword(id, newPwd);
      setPwdDialogOpen(false);
      setNewPwd('');
      setSuccess('密码重置成功');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
        {isEdit ? '编辑用户' : '创建用户'}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Paper sx={{ p: 3, maxWidth: 600 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {!isEdit && (
            <TextField label="用户名" value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })} />
          )}
          {!isEdit && (
            <TextField label="密码" type="password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
          )}
          <TextField label="姓名" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <FormControl>
            <InputLabel>角色</InputLabel>
            <Select value={form.role} label="角色" disabled={isEdit}
              onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {roleOptions.map((r) => (
                <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="机构名称" value={form.org_name}
            onChange={(e) => setForm({ ...form, org_name: e.target.value })} />
          <TextField label="手机号" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })} />

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button variant="contained" onClick={handleSubmit} disabled={loading} sx={{ flex: 1 }}>
              {loading ? <CircularProgress size={24} /> : (isEdit ? '保存修改' : '创建用户')}
            </Button>
            {isEdit && (
              <Button variant="outlined" color="warning" onClick={() => setPwdDialogOpen(true)}>
                重置密码
              </Button>
            )}
            <Button variant="outlined" onClick={() => navigate('/admin/users')}>取消</Button>
          </Box>
        </Box>
      </Paper>

      {/* Reset Password Dialog */}
      <Dialog open={pwdDialogOpen} onClose={() => setPwdDialogOpen(false)}>
        <DialogTitle>重置密码</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus margin="dense" label="新密码" type="password" fullWidth
            value={newPwd} onChange={(e) => setNewPwd(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPwdDialogOpen(false)}>取消</Button>
          <Button onClick={handleResetPwd} variant="contained" disabled={loading}>确认</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}

export default UserForm;
