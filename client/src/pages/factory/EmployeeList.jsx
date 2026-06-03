import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Chip,
  TablePagination, Dialog, DialogTitle, DialogContent, DialogActions, Fab
} from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import Layout from '../../components/Layout';
import ConfirmDialog from '../../components/ConfirmDialog';
import { getEmployees, deleteEmployee } from '../../api/employee';

function EmployeeList() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getEmployees({ page, pageSize, keyword });
      setEmployees(res.data.list || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = () => {
    setPage(1);
    setKeyword(searchInput);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteEmployee(deleteId);
      setDeleteId(null);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>员工管理</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/factory/employees/new')}>
          新增员工
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField size="small" placeholder="搜索姓名/身份证/岗位" value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          sx={{ width: 300 }} />
        <Button variant="outlined" startIcon={<Search />} onClick={handleSearch}>搜索</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>姓名</TableCell>
              <TableCell>年龄</TableCell>
              <TableCell>工龄</TableCell>
              <TableCell>岗位</TableCell>
              <TableCell>手机</TableCell>
              <TableCell>身份证</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center">暂无数据</TableCell></TableRow>
            ) : (
              employees.map((emp) => (
                <TableRow key={emp.id} hover>
                  <TableCell>{emp.name}</TableCell>
                  <TableCell>{emp.age}</TableCell>
                  <TableCell>{emp.work_years}年</TableCell>
                  <TableCell><Chip label={emp.position || '-'} size="small" /></TableCell>
                  <TableCell>{emp.phone || '-'}</TableCell>
                  <TableCell>{emp.id_card}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="primary" onClick={() => navigate(`/factory/employees/${emp.id}/edit`)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteId(emp.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div" count={total} page={page - 1} rowsPerPage={pageSize}
          onPageChange={(_, newPage) => setPage(newPage + 1)}
          onRowsPerPageChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage="每页行数"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / 共${count}条`}
        />
      </TableContainer>

      <ConfirmDialog
        open={!!deleteId}
        title="删除确认"
        message="确定要删除该员工吗？此操作不可撤销。"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Layout>
  );
}

export default EmployeeList;
