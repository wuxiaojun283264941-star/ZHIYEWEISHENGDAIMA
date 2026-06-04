import { authMiddleware } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { success, paginated, fail } from '../utils/response.js';
import { getAdminStats, findAllFactories, findAllAgents, findAllCUnitAgents } from '../repositories/adminRepo.js';
import { getDB } from '../db/init.js';

export default async function adminRoutes(fastify) {
  fastify.addHook('preHandler', authMiddleware);
  fastify.addHook('preHandler', roleGuard('admin'));

  /** GET /api/admin/stats - overview stats */
  fastify.get('/stats', async (request, reply) => {
    try {
      const stats = getAdminStats();
      return reply.send(success(stats));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** GET /api/admin/factories - all factories */
  fastify.get('/factories', async (request, reply) => {
    try {
      const factories = findAllFactories();
      return reply.send(success(factories));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** GET /api/admin/agents - all health agents */
  fastify.get('/agents', async (request, reply) => {
    try {
      const agents = findAllAgents();
      return reply.send(success(agents));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** GET /api/admin/cunits - all C-unit agents */
  fastify.get('/cunits', async (request, reply) => {
    try {
      const cunits = findAllCUnitAgents();
      return reply.send(success(cunits));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** GET /api/admin/tasks - all tasks */
  fastify.get('/tasks', async (request, reply) => {
    try {
      const db = getDB();
      const { page = 1, pageSize = 20 } = request.query;
      const offset = (Number(page) - 1) * Number(pageSize);
      const { total } = db.prepare('SELECT COUNT(*) as total FROM exam_tasks').get();
      const list = db.prepare(`
        SELECT et.*, f.name as factory_name, ha.name as agent_name, ha.center_name as agent_center
        FROM exam_tasks et
        LEFT JOIN factories f ON et.factory_id = f.id
        LEFT JOIN health_agents ha ON et.health_agent_id = ha.id
        ORDER BY et.created_at DESC LIMIT ? OFFSET ?
      `).all(Number(pageSize), offset);
      return reply.send(paginated({ list, total, page: Number(page), pageSize: Number(pageSize) }));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });
}
