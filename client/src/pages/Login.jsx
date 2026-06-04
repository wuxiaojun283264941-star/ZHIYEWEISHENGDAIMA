import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Tabs, Tab, Alert, CircularProgress
} from '@mui/material';
import { AdminPanelSettings, Factory, LocalHospital, Science } from '@mui/icons-material';
import { adminLogin, factoryLogin, agentLogin, cunitLogin } from '../api/auth';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [tab, setTab] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Admin login state
  const [adminForm, setAdminForm] = useState({ username: '', password: '' });

  // Factory login state
  const [factoryForm, setFactoryForm] = useState({ username: '', password: '' });

  // Health agent (体检) login state
  const [agentForm, setAgentForm] = useState({ username: '', password: '' });

  // 卫生托管 login state
  const [cunitForm, setCunitForm] = useState({ username: '', password: '' });

  const handleAdminLogin = async () => {
    setError('');
    if (!adminForm.username || !adminForm.password) {
      setError('请输入用户名和密码');
      return;
    }
    setLoading(true);
    try {
      const res = await adminLogin(adminForm.username, adminForm.password);
      login(res.data.token, res.data.user);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFactoryLogin = async () => {
    setError('');
    if (!factoryForm.username || !factoryForm.password) {
      setError('请输入用户名和密码');
      return;
    }
    setLoading(true);
    try {
      const res = await factoryLogin(factoryForm.username, factoryForm.password);
      login(res.data.token, res.data.user);
      navigate('/factory');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAgentLogin = async () => {
    setError('');
    if (!agentForm.username || !agentForm.password) {
      setError('请输入用户名和密码');
      return;
    }
    setLoading(true);
    try {
      const res = await agentLogin(agentForm.username, agentForm.password);
      login(res.data.token, res.data.user);
      navigate('/health-agent');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCunitLogin = async () => {
    setError('');
    if (!cunitForm.username || !cunitForm.password) {
      setError('请输入用户名和密码');
      return;
    }
    setLoading(true);
    try {
      const res = await cunitLogin(cunitForm.username, cunitForm.password);
      login(res.data.token, res.data.user);
      navigate('/cunit');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#e3f2fd' }}>
      <Card sx={{ maxWidth: 440, width: '100%', mx: 2, borderRadius: 3, boxShadow: 6 }}>
        <Box sx={{ bgcolor: '#1976d2', color: 'white', p: 3, textAlign: 'center', borderRadius: '12px 12px 0 0' }}>
          <Typography variant="h5" fontWeight={700}>职业健康管理平台</Typography>
          <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>Occupational Health Management</Typography>
        </Box>
        <CardContent sx={{ p: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Tabs value={tab} onChange={(_, v) => { setTab(v); setError(''); }} centered variant="scrollable" scrollButtons="auto">
            <Tab icon={<AdminPanelSettings />} label="管理员" />
            <Tab icon={<Factory />} label="工厂" />
            <Tab icon={<LocalHospital />} label="体检" />
            <Tab icon={<Science />} label="卫生托管" />
          </Tabs>

          {/* Admin Login */}
          <TabPanel value={tab} index={0}>
            <TextField
              fullWidth label="用户名" margin="normal" value={adminForm.username}
              onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
            />
            <TextField
              fullWidth label="密码" type="password" margin="normal" value={adminForm.password}
              onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
            />
            <Button fullWidth variant="contained" size="large" sx={{ mt: 2 }}
              onClick={handleAdminLogin} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : '登录'}
            </Button>
          </TabPanel>

          {/* Factory Login */}
          <TabPanel value={tab} index={1}>
            <TextField
              fullWidth label="用户名" margin="normal" value={factoryForm.username}
              onChange={(e) => setFactoryForm({ ...factoryForm, username: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && handleFactoryLogin()}
            />
            <TextField
              fullWidth label="密码" type="password" margin="normal" value={factoryForm.password}
              onChange={(e) => setFactoryForm({ ...factoryForm, password: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && handleFactoryLogin()}
            />
            <Button fullWidth variant="contained" size="large" sx={{ mt: 2 }}
              onClick={handleFactoryLogin} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : '登录'}
            </Button>
          </TabPanel>

          {/* Health Agent (体检) Login */}
          <TabPanel value={tab} index={2}>
            <TextField
              fullWidth label="用户名" margin="normal" value={agentForm.username}
              onChange={(e) => setAgentForm({ ...agentForm, username: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && handleAgentLogin()}
            />
            <TextField
              fullWidth label="密码" type="password" margin="normal" value={agentForm.password}
              onChange={(e) => setAgentForm({ ...agentForm, password: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && handleAgentLogin()}
            />
            <Button fullWidth variant="contained" size="large" sx={{ mt: 2 }}
              onClick={handleAgentLogin} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : '登录'}
            </Button>
          </TabPanel>

          {/* 卫生托管 Login */}
          <TabPanel value={tab} index={3}>
            <TextField
              fullWidth label="用户名" margin="normal" value={cunitForm.username}
              onChange={(e) => setCunitForm({ ...cunitForm, username: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && handleCunitLogin()}
            />
            <TextField
              fullWidth label="密码" type="password" margin="normal" value={cunitForm.password}
              onChange={(e) => setCunitForm({ ...cunitForm, password: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && handleCunitLogin()}
            />
            <Button fullWidth variant="contained" size="large" sx={{ mt: 2 }}
              onClick={handleCunitLogin} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : '登录'}
            </Button>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Login;
