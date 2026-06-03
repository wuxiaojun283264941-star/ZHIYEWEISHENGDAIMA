import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Grid, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Avatar
} from '@mui/material';
import { People, Contacts, Assignment, Add } from '@mui/icons-material';
import Layout from '../../components/Layout';
import { useAuth } from '../../hooks/useAuth';
import { getEmployees } from '../../api/employee';
import { getContacts } from '../../api/factoryContact';

const statusColors = { pushed: 'warning', in_progress: 'info', completed: 'success' };
const statusLabels = { pushed: '已推送', in_progress: '进行中', completed: '已完成' };

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({ employees: 0, contacts: 0 });

  useEffect(() => {
    Promise.all([
      getEmployees({ page: 1, pageSize: 1 }),
      getContacts(),
    ]).then(([empRes, contactRes]) => {
      setStats({
        employees: empRes.data.total || 0,
        contacts: (contactRes.data || []).length,
      });
    }).catch(() => {});
  }, []);

  const cards = [
    { title: '员工总数', value: stats.employees, icon: <People sx={{ fontSize: 40 }} />, color: '#1976d2', path: '/factory/employees' },
    { title: '联系人', value: stats.contacts, icon: <Contacts sx={{ fontSize: 40 }} />, color: '#2e7d32', path: '/factory/contacts' },
  ];

  return (
    <Layout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>欢迎，{user?.name || '工厂管理员'}</Typography>
        <Typography variant="body2" color="text.secondary">工厂工作台</Typography>
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

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/factory/employees/new')}>
          新增员工
        </Button>
        <Button variant="outlined" startIcon={<People />} onClick={() => navigate('/factory/employees')}>
          员工管理
        </Button>
        <Button variant="outlined" startIcon={<Contacts />} onClick={() => navigate('/factory/contacts')}>
          联系人管理
        </Button>
        <Button variant="outlined" startIcon={<Assignment />} onClick={() => navigate('/factory/push-history')}>
          推送历史
        </Button>
      </Box>
    </Layout>
  );
}

export default Dashboard;
