import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, Pagination, Tooltip,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Lock as LockIcon,
  Block as BlockIcon, CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import Layout from '../../components/Layout';
import { getUsers, toggleUserStatus, deleteUser } from '../../api/admin';
import { useNavigate } from 'react-router-dom';

const roleLabels = {
  admin: '管理员', factory: '工厂', health_agent: '体检中心', c_unit: '卫生托管',
};
const roleColors = {
  admin: 'error', factory: 'primary', health_agent: 'success', c_unit: 'secondary',
};
const statusLabels = { active: '正常', disabled: '禁用' };

function UserList() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsers({ page, pageSize: 20, role: roleFilter, keyword });
      setUsers(res.data.list);
      setTotal(res.data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, keyword]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      await toggleUserStatus(id, newStatus);
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteUser(deleteConfirm);
      setDeleteConfirm(null);
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>用户管理</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/admin/users/new')}>
          创建用户
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          size="small" label="搜索" variant="outlined" sx={{ minWidth: 200 }}
          value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
          placeholder="用户名/姓名/手机"
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>角色</InputLabel>
          <Select value={roleFilter} label="角色" onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
            <MenuItem value="">全部</MenuItem>
            <MenuItem value="factory">工厂</MenuItem>
            <MenuItem value="health_agent">体检中心</MenuItem>
            <MenuItem value="c_unit">卫生托管</MenuItem>
            <MenuItem value="admin">管理员</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>用户名</TableCell>
              <TableCell>角色</TableCell>
              <TableCell>姓名</TableCell>
              <TableCell>机构名称</TableCell>
              <TableCell>手机号</TableCell>
              <TableCell>状态</TableCell>
              <TableCell>创建时间</TableCell>
              <TableCell align="center">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id} hover>
                <TableCell>{u.username}</TableCell>
                <TableCell>
                  <Chip label={roleLabels[u.role] || u.role} color={roleColors[u.role] || 'default'} size="small" />
                </TableCell>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.org_name || '-'}</TableCell>
                <TableCell>{u.phone || '-'}</TableCell>
                <TableCell>
                  <Chip
                    label={statusLabels[u.status] || u.status}
                    color={u.status === 'active' ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{u.created_at?.substring(0, 10)}</TableCell>
                <TableCell align="center">
                  <Tooltip title="编辑"><IconButton size="small" onClick={() => navigate(`/admin/users/${u.id}/edit`)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="重置密码"><IconButton size="small" onClick={() => navigate(`/admin/users/${u.id}/edit?resetPwd=1`)}><LockIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title={u.status === 'active' ? '禁用' : '启用'}>
                    <IconButton size="small" onClick={() => handleToggleStatus(u.id, u.status)}>
                      {u.status === 'active' ? <BlockIcon fontSize="small" color="warning" /> : <CheckCircleIcon fontSize="small" color="success" />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="删除"><IconButton size="small" onClick={() => setDeleteConfirm(u.id)}><DeleteIcon fontSize="small" color="error" /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && !loading && (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}>暂无数据</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {total > 20 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination count={Math.ceil(total / 20)} page={page} onChange={(_, p) => setPage(p)} color="primary" />
        </Box>
      )}

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>确定要删除该用户吗？此操作不可撤销，关联数据（员工、任务等）将一并删除。</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>取消</Button>
          <Button onClick={handleDelete} color="error" variant="contained">确认删除</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}

export default UserList;
