import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, TablePagination
} from '@mui/material';
import Layout from '../../components/Layout';
import { getAdminTasks } from '../../api/admin';

const statusLabels = { pushed: '已推送', in_progress: '进行中', completed: '已完成' };
const statusColors = { pushed: 'warning', in_progress: 'info', completed: 'success' };

function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const fetchData = useCallback(async () => {
    try {
      const res = await getAdminTasks({ page, pageSize });
      setTasks(res.data.list || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error(err);
    }
  }, [page, pageSize]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <Layout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>全部任务</Typography>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>任务ID</TableCell>
              <TableCell>工厂</TableCell>
              <TableCell>体检中心</TableCell>
              <TableCell>状态</TableCell>
              <TableCell>推送时间</TableCell>
              <TableCell>完成时间</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center">暂无数据</TableCell></TableRow>
            ) : tasks.map((task) => (
              <TableRow key={task.id} hover>
                <TableCell>#{task.id}</TableCell>
                <TableCell>{task.factory_name || '-'}</TableCell>
                <TableCell>{task.agent_name || '-'}</TableCell>
                <TableCell>
                  <Chip label={statusLabels[task.status] || task.status} color={statusColors[task.status]} size="small" />
                </TableCell>
                <TableCell>{task.pushed_at}</TableCell>
                <TableCell>{task.completed_at || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div" count={total} page={page - 1} rowsPerPage={pageSize}
          onPageChange={(_, newPage) => setPage(newPage + 1)}
          onRowsPerPageChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage="每页行数"
        />
      </TableContainer>
    </Layout>
  );
}

export default TaskList;
