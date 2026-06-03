import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Grid, Alert
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import Layout from '../../components/Layout';
import ConfirmDialog from '../../components/ConfirmDialog';
import { getContacts, createContact, updateContact, deleteContact } from '../../api/factoryContact';

const emptyForm = { name: '', position: '', phone: '' };

function ContactManage() {
  const [contacts, setContacts] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState('');

  const fetchContacts = useCallback(async () => {
    try {
      const res = await getContacts();
      setContacts(res.data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const openAddDialog = () => {
    setEditId(null);
    setForm(emptyForm);
    setError('');
    setDialogOpen(true);
  };

  const openEditDialog = (contact) => {
    setEditId(contact.id);
    setForm({ name: contact.name, position: contact.position || '', phone: contact.phone });
    setError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setError('');
    if (!form.name.trim() || !form.phone.trim()) {
      setError('姓名和手机号不能为空');
      return;
    }
    try {
      if (editId) {
        await updateContact(editId, form);
      } else {
        await createContact(form);
      }
      setDialogOpen(false);
      fetchContacts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteContact(deleteId);
      setDeleteId(null);
      fetchContacts();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>联系人管理</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openAddDialog}>新增联系人</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>姓名</TableCell>
              <TableCell>职务</TableCell>
              <TableCell>手机号</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contacts.length === 0 ? (
              <TableRow><TableCell colSpan={4} align="center">暂无联系人</TableCell></TableRow>
            ) : (
              contacts.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.position || '-'}</TableCell>
                  <TableCell>{c.phone}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="primary" onClick={() => openEditDialog(c)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteId(c.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editId ? '编辑联系人' : '新增联系人'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="姓名 *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="职务" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="手机号 *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>取消</Button>
          <Button variant="contained" onClick={handleSave}>保存</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        title="删除确认"
        message="确定要删除该联系人吗？"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Layout>
  );
}

export default ContactManage;
