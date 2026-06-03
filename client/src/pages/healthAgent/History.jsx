import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, TablePagination, Button
} from '@mui/material';
import { Visibility } from '@mui/icons-material';
import Layout from '../../components/Layout';
import { getAgentHistory } from '../../api/examTask';

function History() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const fetchData = useCallback(async () => {
    try {
      const res = await getAgentHistory({ page, pageSize });
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
        <Typography variant="h5" fontWeight={600}>历史记录</Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>任务ID</TableCell>
              <TableCell>工厂</TableCell>
              <TableCell>完成时间</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow><TableCell colSpan={4} align="center">暂无历史记录</TableCell></TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow key={task.id} hover>
                  <TableCell>#{task.id}</TableCell>
                  <TableCell>{task.factory_name || '-'}</TableCell>
                  <TableCell>{task.completed_at}</TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="outlined" startIcon={<Visibility />}
                      onClick={() => navigate(`/health-agent/tasks/${task.id}`)}>
                      查看
                    </Button>
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
        />
      </TableContainer>
    </Layout>
  );
}

export default History;
