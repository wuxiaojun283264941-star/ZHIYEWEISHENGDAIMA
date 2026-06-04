import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, IconButton, Alert, Tooltip,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import Layout from '../../components/Layout';
import { getPackages, createPackage, updatePackage, deletePackage } from '../../api/examPackage';

const defaultForm = { name: '', description: '', price: 0, exam_items: '' };

function PackageManage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPackages();
      setPackages(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(defaultForm); setDialogOpen(true); };
  const openEdit = (pkg) => {
    setEditing(pkg);
    setForm({
      name: pkg.name, description: pkg.description || '', price: pkg.price || 0,
      exam_items: pkg.exam_items || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const data = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        exam_items: form.exam_items,
      };
      if (editing) {
        await updatePackage(editing.id, data);
      } else {
        await createPackage(data);
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定删除该套餐吗？')) return;
    try {
      await deletePackage(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>套餐模板管理</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>新增套餐</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>套餐名称</TableCell>
              <TableCell>描述</TableCell>
              <TableCell>价格 (元)</TableCell>
              <TableCell>检查项目</TableCell>
              <TableCell>状态</TableCell>
              <TableCell align="center">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {packages.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.description || '-'}</TableCell>
                <TableCell>{p.price}</TableCell>
                <TableCell>{p.exam_items || '-'}</TableCell>
                <TableCell>
                  <Chip label={p.is_active ? '启用' : '停用'} color={p.is_active ? 'success' : 'default'} size="small" />
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="编辑"><IconButton size="small" onClick={() => openEdit(p)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="删除"><IconButton size="small" onClick={() => handleDelete(p.id)}><DeleteIcon fontSize="small" color="error" /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {packages.length === 0 && !loading && (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>暂无套餐</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? '编辑套餐' : '新增套餐'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="套餐名称" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label="描述" multiline rows={2} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <TextField label="价格 (元)" type="number" value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <TextField label="检查项目 (逗号分隔)" value={form.exam_items}
              onChange={(e) => setForm({ ...form, exam_items: e.target.value })} placeholder="体格检查,血常规,尿常规,心电图" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>取消</Button>
          <Button variant="contained" onClick={handleSave}>{editing ? '保存' : '创建'}</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}

export default PackageManage;
