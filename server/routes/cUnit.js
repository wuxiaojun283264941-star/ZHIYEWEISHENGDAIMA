import { authMiddleware } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { success, paginated, fail } from '../utils/response.js';
import { findCompletedTasksForCUnit, findExamTaskDetailById, findExamTaskEmployees } from '../repositories/examTaskRepo.js';
import { findReportsByTaskId, findReportsByEmployeeId } from '../repositories/examReportRepo.js';

export default async function cUnitRoutes(fastify) {
  fastify.addHook('preHandler', authMiddleware);
  fastify.addHook('preHandler', roleGuard('cunit'));

  /** GET /api/cunit/tasks - completed task list for C-unit */
  fastify.get('/tasks', async (request, reply) => {
    try {
      const { page = 1, pageSize = 20 } = request.query;
      const result = findCompletedTasksForCUnit({ page: Number(page), pageSize: Number(pageSize) });
      return reply.send(paginated(result));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** GET /api/cunit/tasks/:id - task detail with employees and reports */
  fastify.get('/tasks/:id', async (request, reply) => {
    try {
      const taskId = Number(request.params.id);
      const task = findExamTaskDetailById(taskId);
      if (!task || task.status !== 'completed') {
        return reply.code(404).send(fail('任务不存在或未完成'));
      }
      const employees = findExamTaskEmployees(taskId);
      const reports = findReportsByTaskId(taskId);
      return reply.send(success({ ...task, employees, reports }));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** GET /api/cunit/employees/:id/reports - reports for a specific employee */
  fastify.get('/employees/:id/reports', async (request, reply) => {
    try {
      const employeeId = Number(request.params.id);
      const reports = findReportsByEmployeeId(employeeId);
      return reply.send(success(reports));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });
}
