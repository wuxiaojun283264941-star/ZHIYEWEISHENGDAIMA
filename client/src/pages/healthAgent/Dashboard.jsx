import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Grid, Avatar, Button, Chip
} from '@mui/material';
import { Assignment, CheckCircle, AccessTime } from '@mui/icons-material';
import Layout from '../../components/Layout';
import { useAuth } from '../../hooks/useAuth';
import { getPendingTasks } from '../../api/examTask';

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);

  useEffect(() => {
    getPendingTasks({ page: 1, pageSize: 1 })
      .then((res) => {
        setPendingCount(res.data.total || 0);
      })
      .catch(() => {});
  }, []);

  const cards = [
    { title: '待办任务', value: pendingCount, icon: <Assignment sx={{ fontSize: 40 }} />, color: '#ed6c02', path: '/health-agent/tasks' },
  ];

  return (
    <Layout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>欢迎，{user?.name || '体检对接人'}</Typography>
        <Typography variant="body2" color="text.secondary">体检对接人工作台</Typography>
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
        <Button variant="contained" startIcon={<Assignment />} onClick={() => navigate('/health-agent/tasks')}>
          待办任务
        </Button>
        <Button variant="outlined" startIcon={<CheckCircle />} onClick={() => navigate('/health-agent/history')}>
          历史记录
        </Button>
      </Box>
    </Layout>
  );
}

export default Dashboard;
