import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Paper, Grid, Alert, CircularProgress,
  FormControl, FormLabel
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import Layout from '../../components/Layout';
import { getEmployee, createEmployee, updateEmployee } from '../../api/employee';

function EmployeeForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', age: '', work_years: '', position: '', phone: '', id_card: ''
  });

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      getEmployee(id)
        .then((res) => {
          const emp = res.data;
          setForm({
            name: emp.name || '',
            age: emp.age || '',
            work_years: emp.work_years || '',
            position: emp.position || '',
            phone: emp.phone || '',
            id_card: emp.id_card || '',
          });
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.name.trim()) { setError('姓名不能为空'); return; }
    if (!form.id_card.trim()) { setError('身份证号不能为空'); return; }

    setSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        age: Number(form.age) || 0,
        work_years: Number(form.work_years) || 0,
        position: form.position.trim(),
        phone: form.phone.trim(),
        id_card: form.id_card.trim(),
      };
      if (isEdit) {
        await updateEmployee(id, data);
      } else {
        await createEmployee(data);
      }
      navigate('/factory/employees');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Layout><Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box></Layout>;
  }

  return (
    <Layout>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/factory/employees')}>返回</Button>
        <Typography variant="h5" fontWeight={600}>{isEdit ? '编辑员工' : '新增员工'}</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 3, maxWidth: 600 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField fullWidth label="姓名 *" value={form.name} onChange={handleChange('name')} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="年龄" type="number" value={form.age} onChange={handleChange('age')} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="工龄(年)" type="number" value={form.work_years} onChange={handleChange('work_years')} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="岗位" value={form.position} onChange={handleChange('position')} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="手机号" value={form.phone} onChange={handleChange('phone')} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="身份证号 *" value={form.id_card} onChange={handleChange('id_card')} />
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button variant="contained" startIcon={<Save />} onClick={handleSubmit} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </Button>
          <Button variant="outlined" onClick={() => navigate('/factory/employees')}>取消</Button>
        </Box>
      </Paper>
    </Layout>
  );
}

export default EmployeeForm;
