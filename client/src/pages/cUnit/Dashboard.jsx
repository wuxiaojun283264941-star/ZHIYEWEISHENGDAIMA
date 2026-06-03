import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Grid, Avatar, Button, Chip
} from '@mui/material';
import { Description, Assignment } from '@mui/icons-material';
import Layout from '../../components/Layout';
import { useAuth } from '../../hooks/useAuth';
import { getCUnitTasks } from '../../api/cUnit';

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    getCUnitTasks({ page: 1, pageSize: 1 })
      .then((res) => setCompletedCount(res.data.total || 0))
      .catch(() => {});
  }, []);

  const cards = [
    { title: '已完成任务', value: completedCount, icon: <Assignment sx={{ fontSize: 40 }} />, color: '#2e7d32', path: '/cunit/reports' },
  ];

  return (
    <Layout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>欢迎，{user?.name || 'C单位管理员'}</Typography>
        <Typography variant="body2" color="text.secondary">C单位工作台</Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={4} key={card.title}>
            <Card sx={{ cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }}
              onClick={() => navigate(card.path)}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: card.color, width: 56, height: 56 }}>{card.icon}</Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700}>{card.value}</Typography>
                  <Typography variant="body2" color="text.secondary">{card.title}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="contained" startIcon={<Description />} onClick={() => navigate('/cunit/reports')}>
          查看报告
        </Button>
      </Box>
    </Layout>
  );
}

export default Dashboard;
