import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper
} from '@mui/material';
import Layout from '../../components/Layout';
import { getAdminCUnits } from '../../api/admin';

function CUnitList() {
  const [cunits, setCUnits] = useState([]);

  useEffect(() => {
    getAdminCUnits()
      .then((res) => setCUnits(res.data || []))
      .catch(() => {});
  }, []);

  return (
    <Layout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>卫生托管单位列表</Typography>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>姓名</TableCell>
              <TableCell>用户名</TableCell>
              <TableCell>创建时间</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cunits.length === 0 ? (
              <TableRow><TableCell colSpan={4} align="center">暂无数据</TableCell></TableRow>
            ) : cunits.map((c) => (
              <TableRow key={c.id} hover>
                <TableCell>#{c.id}</TableCell>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.username}</TableCell>
                <TableCell>{c.created_at}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Layout>
  );
}

export default CUnitList;
