import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Button, Card, CardContent, Divider, Alert
} from '@mui/material';
import { ArrowBack, Description } from '@mui/icons-material';
import Layout from '../../components/Layout';
import { getCUnitTaskDetail } from '../../api/cUnit';
import { getReportDownloadUrl } from '../../api/examReport';

function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCUnitTaskDetail(id)
      .then((res) => setTask(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Layout><Box sx={{ p: 3 }}>加载中...</Box></Layout>;
  if (!task) return <Layout><Box sx={{ p: 3 }}><Alert severity="error">任务不存在</Alert></Box></Layout>;

  return (
    <Layout>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/cunit/reports')}>返回</Button>
        <Typography variant="h5" fontWeight={600}>任务详情 #{id}</Typography>
        <Chip label="已完成" color="success" sx={{ ml: 1 }} />
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary">任务信息</Typography>
          <Divider sx={{ my: 1 }} />
          <Typography variant="body2"><strong>工厂：</strong>{task.factory_name}</Typography>
          <Typography variant="body2"><strong>对接人：</strong>{task.agent_name} - {task.agent_center}</Typography>
          <Typography variant="body2"><strong>完成时间：</strong>{task.completed_at}</Typography>
        </CardContent>
      </Card>

      <Typography variant="h6" sx={{ mb: 2 }}>员工与报告</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>姓名</TableCell>
              <TableCell>身份证</TableCell>
              <TableCell>岗位</TableCell>
              <TableCell>体检状态</TableCell>
              <TableCell>报告</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(task.employees || []).map((emp) => {
              const empReports = (task.reports || []).filter((r) => r.employee_id === emp.employee_id);
              return (
                <TableRow key={emp.id} hover>
                  <TableCell>
                    <Button size="small" onClick={() => navigate(`/cunit/employees/${emp.employee_id}`)}>
                      {emp.employee_name}
                    </Button>
                  </TableCell>
                  <TableCell>{emp.id_card}</TableCell>
                  <TableCell>{emp.position || '-'}</TableCell>
                  <TableCell>
                    <Chip label={emp.exam_status === 'examined' ? '已体检' : '待体检'}
                      color={emp.exam_status === 'examined' ? 'success' : 'default'} size="small" />
                  </TableCell>
                  <TableCell>
                    {empReports.map((r) => (
                      <Chip key={r.id} icon={<Description />} label={r.original_name}
                        component="a" href={getReportDownloadUrl(r.id)} target="_blank"
                        clickable size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                    ))}
                    {empReports.length === 0 && '-'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Layout>
  );
}

export default EmployeeDetail;
