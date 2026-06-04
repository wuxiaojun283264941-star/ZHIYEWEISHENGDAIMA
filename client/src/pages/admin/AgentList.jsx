import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip
} from '@mui/material';
import Layout from '../../components/Layout';
import { getAdminAgents } from '../../api/admin';

function AgentList() {
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    getAdminAgents()
      .then((res) => setAgents(res.data || []))
      .catch(() => {});
  }, []);

  return (
    <Layout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>体检中心列表</Typography>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>姓名</TableCell>
              <TableCell>用户名</TableCell>
              <TableCell>手机</TableCell>
              <TableCell>中心名称</TableCell>
              <TableCell>创建时间</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {agents.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center">暂无数据</TableCell></TableRow>
            ) : agents.map((a) => (
              <TableRow key={a.id} hover>
                <TableCell>#{a.id}</TableCell>
                <TableCell>{a.name}</TableCell>
                <TableCell>{a.username}</TableCell>
                <TableCell>{a.phone || '-'}</TableCell>
                <TableCell><Chip label={a.center_name || '-'} size="small" /></TableCell>
                <TableCell>{a.created_at}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Layout>
  );
}

export default AgentList;
