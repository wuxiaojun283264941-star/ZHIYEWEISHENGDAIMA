import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Button, Grid, Card, CardContent, Alert,
  Divider
} from '@mui/material';
import { ArrowBack, CloudUpload, CheckCircle } from '@mui/icons-material';
import Layout from '../../components/Layout';
import { getExamTaskDetail } from '../../api/examTask';
import { getTaskReports } from '../../api/examReport';
import ReportUpload from './ReportUpload';
import CompleteConfirm from './CompleteConfirm';

const statusColors = { pushed: 'warning', in_progress: 'info', completed: 'success' };
const statusLabels = { pushed: '已推送', in_progress: '进行中', completed: '已完成' };

function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const fetchData = async () => {
    try {
      const [taskRes, reportRes] = await Promise.all([
        getExamTaskDetail(id),
        getTaskReports(id),
      ]);
      setTask(taskRes.data);
      setReports(reportRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  if (loading) return <Layout><Box sx={{ p: 3 }}>加载中...</Box></Layout>;
  if (!task) return <Layout><Box sx={{ p: 3 }}>任务不存在</Box></Layout>;

  const handleUploadForEmployee = (employee) => {
    setSelectedEmployee(employee);
    setUploadOpen(true);
  };

  return (
    <Layout>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/health-agent/tasks')}>返回</Button>
        <Typography variant="h5" fontWeight={600}>任务详情 #{id}</Typography>
        <Chip label={statusLabels[task.status]} color={statusColors[task.status]} sx={{ ml: 1 }} />
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">任务信息</Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2"><strong>工厂：</strong>{task.factory_name}</Typography>
              <Typography variant="body2"><strong>对接人：</strong>{task.agent_name}</Typography>
              <Typography variant="body2"><strong>联系人：</strong>{task.contact_name || '-'} {task.contact_phone || ''}</Typography>
              <Typography variant="body2"><strong>推送时间：</strong>{task.pushed_at}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">员工列表</Typography>
        {task.status === 'in_progress' && (
          <Button variant="contained" color="success" startIcon={<CheckCircle />}
            onClick={() => setCompleteOpen(true)}>
            完成推送卫生托管
          </Button>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>姓名</TableCell>
              <TableCell>身份证</TableCell>
              <TableCell>岗位</TableCell>
              <TableCell>体检状态</TableCell>
              <TableCell>报告</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(task.employees || []).map((emp) => {
              const empReports = reports.filter((r) => r.employee_id === emp.employee_id);
              return (
                <TableRow key={emp.id} hover>
                  <TableCell>{emp.employee_name}</TableCell>
                  <TableCell>{emp.id_card}</TableCell>
                  <TableCell>{emp.position || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={emp.exam_status === 'examined' ? '已体检' : '待体检'}
                      color={emp.exam_status === 'examined' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{empReports.length > 0 ? `${empReports.length}份报告` : '-'}</TableCell>
                  <TableCell align="right">
                    {task.status === 'in_progress' && emp.exam_status !== 'examined' && (
                      <Button size="small" variant="outlined" startIcon={<CloudUpload />}
                        onClick={() => handleUploadForEmployee(emp)}>
                        上传报告
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <ReportUpload
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        taskId={id}
        employee={selectedEmployee}
        onSuccess={fetchData}
      />

      <CompleteConfirm
        open={completeOpen}
        onClose={() => setCompleteOpen(false)}
        taskId={id}
        onSuccess={() => { fetchData(); }}
      />
    </Layout>
  );
}

export default TaskDetail;
