import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Button, Card, CardContent, Divider, Alert
} from '@mui/material';
import { ArrowBack, Download } from '@mui/icons-material';
import Layout from '../../components/Layout';
import { getCUnitTaskDetail } from '../../api/cUnit';
import { getReportDownloadUrl } from '../../api/examReport';

function ReportViewer() {
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
        <Typography variant="h5" fontWeight={600}>报告查看 #{id}</Typography>
        <Chip label="已完成" color="success" sx={{ ml: 1 }} />
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary">任务信息</Typography>
          <Divider sx={{ my: 1 }} />
          <Typography variant="body2"><strong>工厂：</strong>{task.factory_name}</Typography>
          <Typography variant="body2"><strong>对接人：</strong>{task.agent_name} - {task.agent_center}</Typography>
          <Typography variant="body2"><strong>完成时间：</strong>{task.completed_at}</Typography>
          <Typography variant="body2"><strong>员工人数：</strong>{(task.employees || []).length}</Typography>
          <Typography variant="body2"><strong>报告数量：</strong>{(task.reports || []).length}</Typography>
        </CardContent>
      </Card>

      <Typography variant="h6" sx={{ mb: 2 }}>报告列表</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>员工姓名</TableCell>
              <TableCell>身份证</TableCell>
              <TableCell>文件名</TableCell>
              <TableCell>上传时间</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(task.reports || []).length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center">暂无报告</TableCell></TableRow>
            ) : (
              (task.reports || []).map((report) => {
                const emp = (task.employees || []).find((e) => e.employee_id === report.employee_id);
                return (
                  <TableRow key={report.id} hover>
                    <TableCell>{emp?.employee_name || '-'}</TableCell>
                    <TableCell>{emp?.id_card || '-'}</TableCell>
                    <TableCell>{report.original_name}</TableCell>
                    <TableCell>{report.uploaded_at}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Download />}
                        href={getReportDownloadUrl(report.id)}
                        target="_blank"
                      >
                        查看/下载
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Layout>
  );
}

export default ReportViewer;
