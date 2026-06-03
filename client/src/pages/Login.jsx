import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Tabs, Tab, Alert,
  InputAdornment, IconButton, CircularProgress
} from '@mui/material';
import { Factory, LocalHospital, Science, Phone, Send, Visibility, VisibilityOff } from '@mui/icons-material';
import { factoryLogin, agentSendCode, agentLogin, cunitLogin } from '../api/auth';
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

  // Factory login state
  const [factoryForm, setFactoryForm] = useState({ username: '', password: '' });

  // Health agent login state
  const [agentForm, setAgentForm] = useState({ phone: '', code: '' });
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // C-Unit login state
  const [cunitForm, setCunitForm] = useState({ username: '', password: '' });

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

  const handleSendCode = async () => {
    setError('');
    if (!agentForm.phone) {
      setError('请输入手机号');
      return;
    }
    try {
      await agentSendCode(agentForm.phone);
      setCodeSent(true);
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAgentLogin = async () => {
    setError('');
    if (!agentForm.phone || !agentForm.code) {
      setError('请输入手机号和验证码');
      return;
    }
    setLoading(true);
    try {
      const res = await agentLogin(agentForm.phone, agentForm.code);
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

          <Tabs value={tab} onChange={(_, v) => { setTab(v); setError(''); }} centered>
            <Tab icon={<Factory />} label="工厂" />
            <Tab icon={<LocalHospital />} label="体检对接人" />
            <Tab icon={<Science />} label="C单位" />
          </Tabs>

          {/* Factory Login */}
          <TabPanel value={tab} index={0}>
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

          {/* Health Agent Login */}
          <TabPanel value={tab} index={1}>
            <TextField
              fullWidth label="手机号" margin="normal" value={agentForm.phone}
              onChange={(e) => setAgentForm({ ...agentForm, phone: e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Phone /></InputAdornment>,
              }}
            />
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <TextField
                fullWidth label="验证码" value={agentForm.code}
                onChange={(e) => setAgentForm({ ...agentForm, code: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleAgentLogin()}
              />
              <Button
                variant="outlined" sx={{ minWidth: 120 }}
                onClick={handleSendCode} disabled={countdown > 0}
              >
                {countdown > 0 ? `${countdown}s` : '发送验证码'}
              </Button>
            </Box>
            {codeSent && <Alert severity="info" sx={{ mt: 1 }}>验证码已发送（测试环境固定：123456）</Alert>}
            <Button fullWidth variant="contained" size="large" sx={{ mt: 2 }}
              onClick={handleAgentLogin} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : '登录'}
            </Button>
          </TabPanel>

          {/* C-Unit Login */}
          <TabPanel value={tab} index={2}>
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
