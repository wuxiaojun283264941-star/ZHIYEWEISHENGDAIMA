import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip
} from '@mui/material';
import Layout from '../../components/Layout';
import { getAdminFactories } from '../../api/admin';

function FactoryList() {
  const [factories, setFactories] = useState([]);

  useEffect(() => {
    getAdminFactories()
      .then((res) => setFactories(res.data || []))
      .catch(() => {});
  }, []);

  return (
    <Layout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>全部工厂</Typography>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>名称</TableCell>
              <TableCell>用户名</TableCell>
              <TableCell>行业</TableCell>
              <TableCell>创建时间</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {factories.length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center">暂无数据</TableCell></TableRow>
            ) : factories.map((f) => (
              <TableRow key={f.id} hover>
                <TableCell>#{f.id}</TableCell>
                <TableCell>{f.name}</TableCell>
                <TableCell>{f.username}</TableCell>
                <TableCell><Chip label={f.industry_type || '-'} size="small" /></TableCell>
                <TableCell>{f.created_at}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Layout>
  );
}

export default FactoryList;
