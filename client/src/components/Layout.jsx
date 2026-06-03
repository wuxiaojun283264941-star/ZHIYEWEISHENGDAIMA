import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, AppBar, Toolbar, Typography, Drawer, List, ListItemButton,
  ListItemIcon, ListItemText, Avatar, Divider, IconButton, Chip
} from '@mui/material';
import {
  Factory as FactoryIcon,
  People as PeopleIcon,
  Contacts as ContactsIcon,
  History as HistoryIcon,
  LocalHospital as HospitalIcon,
  Assignment as AssignmentIcon,
  Task as TaskIcon,
  Science as ScienceIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useRole } from '../hooks/useRole';

const DRAWER_WIDTH = 240;

const factoryMenu = [
  { text: '工作台', icon: <DashboardIcon />, path: '/factory' },
  { text: '员工管理', icon: <PeopleIcon />, path: '/factory/employees' },
  { text: '联系人管理', icon: <ContactsIcon />, path: '/factory/contacts' },
  { text: '推送历史', icon: <HistoryIcon />, path: '/factory/push-history' },
];

const healthAgentMenu = [
  { text: '工作台', icon: <DashboardIcon />, path: '/health-agent' },
  { text: '待办任务', icon: <AssignmentIcon />, path: '/health-agent/tasks' },
  { text: '历史记录', icon: <HistoryIcon />, path: '/health-agent/history' },
];

const cUnitMenu = [
  { text: '工作台', icon: <DashboardIcon />, path: '/cunit' },
  { text: '报告列表', icon: <DescriptionIcon />, path: '/cunit/reports' },
];

const roleLabels = {
  factory: '工厂',
  health_agent: '体检对接人',
  cunit: 'C单位',
};

const roleColors = {
  factory: 'primary',
  health_agent: 'success',
  cunit: 'secondary',
};

function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { role } = useRole();

  const menuItems = role === 'factory' ? factoryMenu
    : role === 'health_agent' ? healthAgentMenu
    : cUnitMenu;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: '#1976d2' }}>
        <Toolbar>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: 600 }}>
            职业健康管理平台
          </Typography>
          <Chip
            label={roleLabels[role] || role}
            color={roleColors[role] || 'default'}
            size="small"
            sx={{ mr: 2, color: 'white' }}
          />
          <Typography variant="body2" sx={{ mr: 2 }}>
            {user?.name || ''}
          </Typography>
          <IconButton color="inherit" onClick={handleLogout} title="退出登录">
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Divider />
        <List>
          {menuItems.map((item) => (
            <ListItemButton
              key={item.path}
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                '&.Mui-selected': { bgcolor: 'primary.light', color: 'white', '& .MuiListItemIcon-root': { color: 'white' } },
                '&.Mui-selected:hover': { bgcolor: 'primary.main' },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}

export default Layout;
