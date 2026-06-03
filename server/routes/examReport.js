import fs from 'fs';
import { authMiddleware } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { success, fail } from '../utils/response.js';
import { uploadExamReport, getTaskReports, getReport, getReportDownloadPath, removeReport } from '../services/examReportService.js';
import { getReportFilePath } from '../utils/fileUpload.js';

export default async function examReportRoutes(fastify) {
  fastify.addHook('preHandler', authMiddleware);

  /** POST /api/exam-reports/upload - upload report file */
  fastify.post('/upload', { preHandler: roleGuard('health_agent') }, async (request, reply) => {
    try {
      const data = await request.file();
      if (!data) throw new Error('请上传文件');

      const taskId = Number(data.fields.task_id?.value);
      const employeeId = Number(data.fields.employee_id?.value);

      if (!taskId || !employeeId) throw new Error('缺少任务ID或员工ID');

      const report = await uploadExamReport({
        taskId,
        employeeId,
        file: data,
      });

      return reply.send(success(report));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** GET /api/exam-reports/task/:taskId - get reports for a task */
  fastify.get('/task/:taskId', async (request, reply) => {
    try {
      const reports = getTaskReports(Number(request.params.taskId));
      return reply.send(success(reports));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** GET /api/exam-reports/:id - get report info */
  fastify.get('/:id', async (request, reply) => {
    try {
      const report = getReport(Number(request.params.id));
      return reply.send(success(report));
    } catch (err) {
      return reply.code(404).send(fail(err.message));
    }
  });

  /** GET /api/exam-reports/:id/download - download report PDF */
  fastify.get('/:id/download', async (request, reply) => {
    try {
      const report = getReport(Number(request.params.id));
      const filePath = getReportDownloadPath(Number(request.params.id));

      if (!fs.existsSync(filePath)) {
        return reply.code(404).send(fail('文件不存在'));
      }

      const stream = fs.createReadStream(filePath);
      reply.header('Content-Type', 'application/pdf');
      reply.header('Content-Disposition', `inline; filename="${encodeURIComponent(report.original_name)}"`);
      return reply.send(stream);
    } catch (err) {
      return reply.code(404).send(fail(err.message));
    }
  });

  /** DELETE /api/exam-reports/:id - delete report */
  fastify.delete('/:id', { preHandler: roleGuard('health_agent') }, async (request, reply) => {
    try {
      await removeReport(Number(request.params.id));
      return reply.send(success(null, '删除成功'));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });
}
