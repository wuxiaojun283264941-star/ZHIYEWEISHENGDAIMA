import { authMiddleware } from '../middleware/auth.js';
import { success, fail } from '../utils/response.js';
import { getDashboard } from '../services/dashboardService.js';

export default async function dashboardRoutes(fastify) {
  fastify.addHook('preHandler', authMiddleware);

  /** GET /api/dashboard/admin — admin stats */
  fastify.get('/admin', async (request, reply) => {
    try {
      if (request.user.role !== 'admin') {
        return reply.code(403).send(fail('无权限', 403));
      }
      const stats = getDashboard('admin', request.user.id);
      return reply.send(success(stats));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** GET /api/dashboard/factory — factory stats */
  fastify.get('/factory', async (request, reply) => {
    try {
      if (request.user.role !== 'factory') {
        return reply.code(403).send(fail('无权限', 403));
      }
      const stats = getDashboard('factory', request.user.id);
      return reply.send(success(stats));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** GET /api/dashboard/health-agent — health agent stats */
  fastify.get('/health-agent', async (request, reply) => {
    try {
      if (request.user.role !== 'health_agent') {
        return reply.code(403).send(fail('无权限', 403));
      }
      const stats = getDashboard('health_agent', request.user.id);
      return reply.send(success(stats));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** GET /api/dashboard/c-unit — C-unit stats */
  fastify.get('/c-unit', async (request, reply) => {
    try {
      if (request.user.role !== 'c_unit') {
        return reply.code(403).send(fail('无权限', 403));
      }
      const stats = getDashboard('c_unit', request.user.id);
      return reply.send(success(stats));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });
}
