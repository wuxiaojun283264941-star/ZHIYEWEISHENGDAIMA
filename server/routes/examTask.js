import { authMiddleware } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { success, paginated, fail } from '../utils/response.js';
import { pushExamTask, getPushedTasks, getExamTaskDetail } from '../services/examTaskService.js';
import { findPendingTasksByAgent, findCompletedTasksByAgent, updateTaskToInProgress, updateTaskToCompleted, findExamTaskEmployees } from '../repositories/examTaskRepo.js';
import { findCompletedTasksForCUnit } from '../repositories/examTaskRepo.js';
import { notifyTaskPushed, notifyTaskCompleted } from '../services/notificationService.js';
import { findExamTaskDetailById } from '../repositories/examTaskRepo.js';

export default async function examTaskRoutes(fastify) {
  fastify.addHook('preHandler', authMiddleware);

  /** POST /api/exam-tasks/push - factory push task */
  fastify.post('/push', { preHandler: roleGuard('factory') }, async (request, reply) => {
    try {
      const { health_agent_id, factory_contact_id, employee_ids } = request.body || {};
      const task = pushExamTask(request.user.id, { health_agent_id, factory_contact_id, employee_ids });
      notifyTaskPushed('', request.user.name, employee_ids?.length || 0);
      return reply.send(success(task));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** GET /api/exam-tasks/pushed - factory push history */
  fastify.get('/pushed', { preHandler: roleGuard('factory') }, async (request, reply) => {
    try {
      const { page = 1, pageSize = 20 } = request.query;
      const result = getPushedTasks(request.user.id, { page: Number(page), pageSize: Number(pageSize) });
      return reply.send(paginated(result));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** GET /api/exam-tasks/pending - health agent pending tasks */
  fastify.get('/pending', { preHandler: roleGuard('health_agent') }, async (request, reply) => {
    try {
      const { page = 1, pageSize = 20 } = request.query;
      const result = findPendingTasksByAgent(request.user.id, { page: Number(page), pageSize: Number(pageSize) });
      return reply.send(paginated(result));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** GET /api/exam-tasks/:id - task detail */
  fastify.get('/:id', async (request, reply) => {
    try {
      const task = getExamTaskDetail(Number(request.params.id));
      // Visibility check
      if (request.user.role === 'factory' && task.factory_id !== request.user.id) {
        return reply.code(403).send(fail('无权查看此任务', 403));
      }
      if (request.user.role === 'health_agent' && task.health_agent_id !== request.user.id) {
        return reply.code(403).send(fail('无权查看此任务', 403));
      }
      return reply.send(success(task));
    } catch (err) {
      return reply.code(404).send(fail(err.message));
    }
  });

  /** POST /api/exam-tasks/:id/fetch - agent fetch task */
  fastify.post('/:id/fetch', { preHandler: roleGuard('health_agent') }, async (request, reply) => {
    try {
      const task = updateTaskToInProgress(Number(request.params.id));
      if (!task) throw new Error('任务不存在或状态不允许拉取');
      if (task.health_agent_id !== request.user.id) {
        return reply.code(403).send(fail('无权操作此任务', 403));
      }
      return reply.send(success(task));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** POST /api/exam-tasks/:id/complete - agent complete task */
  fastify.post('/:id/complete', { preHandler: roleGuard('health_agent') }, async (request, reply) => {
    try {
      const task = updateTaskToCompleted(Number(request.params.id));
      if (!task) throw new Error('任务不存在或状态不允许完成');
      if (task.health_agent_id !== request.user.id) {
        return reply.code(403).send(fail('无权操作此任务', 403));
      }
      notifyTaskCompleted('', request.user.name);
      return reply.send(success(task));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** GET /api/exam-tasks/history - agent history */
  fastify.get('/history', { preHandler: roleGuard('health_agent') }, async (request, reply) => {
    try {
      const { page = 1, pageSize = 20 } = request.query;
      const result = findCompletedTasksByAgent(request.user.id, { page: Number(page), pageSize: Number(pageSize) });
      return reply.send(paginated(result));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** GET /api/exam-tasks/cunit-list - C-unit completed task list */
  fastify.get('/cunit-list', { preHandler: roleGuard('cunit') }, async (request, reply) => {
    try {
      const { page = 1, pageSize = 20 } = request.query;
      const result = findCompletedTasksForCUnit({ page: Number(page), pageSize: Number(pageSize) });
      return reply.send(paginated(result));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });
}
