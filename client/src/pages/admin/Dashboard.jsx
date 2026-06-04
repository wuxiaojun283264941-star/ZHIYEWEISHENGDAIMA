import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Grid, Avatar
} from '@mui/material';
import { Business, People, LocalHospital, Science, Assignment, CheckCircle, Description } from '@mui/icons-material';
import Layout from '../../components/Layout';
import { useAuth } from '../../hooks/useAuth';
import { getAdminStats } from '../../api/admin';

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getAdminStats()
      .then((res) => setStats(res.data))
      .catch(() => {});
  }, []);

  const cards = stats ? [
    { title: '工厂数', value: stats.factoryCount, icon: <Business sx={{ fontSize: 40 }} />, color: '#1976d2', path: '/admin/factories' },
    { title: '员工总数', value: stats.employeeCount, icon: <People sx={{ fontSize: 40 }} />, color: '#2e7d32', path: '/admin/factories' },
    { title: '体检中心', value: stats.agentCount, icon: <LocalHospital sx={{ fontSize: 40 }} />, color: '#ed6c02', path: '/admin/agents' },
    { title: '卫生托管', value: stats.cUnitCount, icon: <Science sx={{ fontSize: 40 }} />, color: '#9c27b0', path: '/admin/cunits' },
    { title: '总任务数', value: stats.taskCount, icon: <Assignment sx={{ fontSize: 40 }} />, color: '#0288d1', path: '/admin/tasks' },
    { title: '已完成', value: stats.completedCount, icon: <CheckCircle sx={{ fontSize: 40 }} />, color: '#388e3c', path: '/admin/tasks' },
  ] : [];

  return (
    <Layout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>欢迎，{user?.name || '系统管理员'}</Typography>
        <Typography variant="body2" color="text.secondary">系统管理控制台</Typography>
      </Box>

      <Grid container spacing={3}>
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
    </Layout>
  );
}

export default Dashboard;
