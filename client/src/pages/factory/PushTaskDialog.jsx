import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  FormControl, InputLabel, Select, MenuItem, Box, Alert, Chip, Checkbox,
  ListItemText, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, CircularProgress
} from '@mui/material';
import { pushExamTask } from '../../api/examTask';
import { getEmployees } from '../../api/employee';
import { getContacts } from '../../api/factoryContact';
import apiClient from '../../api/client';

function PushTaskDialog({ open, onClose, onSuccess }) {
  const [agents, setAgents] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [selectedContact, setSelectedContact] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setLoading(true);
      Promise.all([
        apiClient.get('/health-agents/all'),
        getContacts(),
        getEmployees({ page: 1, pageSize: 1000 }),
      ]).then(([agentRes, contactRes, empRes]) => {
        setAgents(agentRes.data || []);
        setContacts(contactRes.data || []);
        setEmployees(empRes.data.list || []);
      }).catch(console.error).finally(() => setLoading(false));
    } else {
      setSelectedAgent('');
      setSelectedContact('');
      setSelectedEmployees([]);
      setError('');
    }
  }, [open]);

  const handleToggleEmployee = (empId) => {
    setSelectedEmployees((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map((e) => e.id));
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (!selectedAgent) { setError('请选择体检中心'); return; }
    if (selectedEmployees.length === 0) { setError('请选择体检员工'); return; }

    setSaving(true);
    try {
      await pushExamTask({
        health_agent_id: Number(selectedAgent),
        factory_contact_id: selectedContact ? Number(selectedContact) : null,
        employee_ids: selectedEmployees,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>推送体检任务</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? <CircularProgress /> : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>体检中心 *</InputLabel>
              <Select value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)} label="体检中心 *">
                {agents.map((a) => (
                  <MenuItem key={a.id} value={a.id}>{a.name} - {a.center_name} ({a.phone})</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>工厂联系人</InputLabel>
              <Select value={selectedContact} onChange={(e) => setSelectedContact(e.target.value)} label="工厂联系人">
                <MenuItem value="">不指定</MenuItem>
                {contacts.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name} ({c.phone})</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2">选择体检员工 *</Typography>
              <Button size="small" onClick={handleSelectAll}>
                {selectedEmployees.length === employees.length ? '取消全选' : '全选'}
              </Button>
            </Box>

            <Typography variant="body2" color="text.secondary">
              已选 {selectedEmployees.length} 人
            </Typography>

            <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">选择</TableCell>
                    <TableCell>姓名</TableCell>
                    <TableCell>岗位</TableCell>
                    <TableCell>身份证</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.map((emp) => (
                    <TableRow key={emp.id} hover selected={selectedEmployees.includes(emp.id)}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedEmployees.includes(emp.id)}
                          onChange={() => handleToggleEmployee(emp.id)}
                        />
                      </TableCell>
                      <TableCell>{emp.name}</TableCell>
                      <TableCell>{emp.position || '-'}</TableCell>
                      <TableCell>{emp.id_card}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving || loading}>
          {saving ? '推送中...' : '确认推送'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default PushTaskDialog;
