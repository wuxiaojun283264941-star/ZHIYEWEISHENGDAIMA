import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Chip, IconButton,
  Alert, Tooltip,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import Layout from '../../components/Layout';
import { getHazardFactors, createHazardFactor, updateHazardFactor, deleteHazardFactor } from '../../api/hazardFactor';

const categoryColors = {
  '粉尘': 'warning', '化学': 'error', '物理': 'info', '生物': 'success', '放射性': 'secondary',
};

const defaultForm = { code: '', category: '粉尘', name: '', description: '', exam_frequency: '' };

function HazardFactorList() {
  const [factors, setFactors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getHazardFactors({ category: categoryFilter, keyword });
      setFactors(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, keyword]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      code: item.code, category: item.category, name: item.name,
      description: item.description || '', exam_frequency: item.exam_frequency || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await updateHazardFactor(editing.id, form);
      } else {
        await createHazardFactor(form);
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定删除该危害因素吗？')) return;
    try {
      await deleteHazardFactor(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>危害因素字典管理 (GBZ188)</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>新增</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2 }}>
        <TextField size="small" label="搜索" value={keyword} onChange={(e) => setKeyword(e.target.value)}
          placeholder="名称/编码/描述" sx={{ minWidth: 200 }} />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>分类</InputLabel>
          <Select value={categoryFilter} label="分类" onChange={(e) => setCategoryFilter(e.target.value)}>
            <MenuItem value="">全部</MenuItem>
            <MenuItem value="粉尘">粉尘</MenuItem>
            <MenuItem value="化学">化学</MenuItem>
            <MenuItem value="物理">物理</MenuItem>
            <MenuItem value="生物">生物</MenuItem>
            <MenuItem value="放射性">放射性</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>编码</TableCell>
              <TableCell>分类</TableCell>
              <TableCell>名称</TableCell>
              <TableCell>描述</TableCell>
              <TableCell>体检周期</TableCell>
              <TableCell align="center">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {factors.map((f) => (
              <TableRow key={f.id} hover>
                <TableCell><code>{f.code}</code></TableCell>
                <TableCell><Chip label={f.category} color={categoryColors[f.category] || 'default'} size="small" /></TableCell>
                <TableCell>{f.name}</TableCell>
                <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.description || '-'}</TableCell>
                <TableCell>{f.exam_frequency || '-'}</TableCell>
                <TableCell align="center">
                  <Tooltip title="编辑"><IconButton size="small" onClick={() => openEdit(f)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="删除"><IconButton size="small" onClick={() => handleDelete(f.id)}><DeleteIcon fontSize="small" color="error" /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {factors.length === 0 && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>暂无数据</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? '编辑危害因素' : '新增危害因素'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="编码" value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <FormControl>
              <InputLabel>分类</InputLabel>
              <Select value={form.category} label="分类" onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {['粉尘', '化学', '物理', '生物', '放射性'].map((c) => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="名称" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label="描述" multiline rows={2} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <TextField label="体检周期" value={form.exam_frequency}
              onChange={(e) => setForm({ ...form, exam_frequency: e.target.value })} placeholder="如：1年" />
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

export default HazardFactorList;
