import { authMiddleware } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { success, fail } from '../utils/response.js';
import { findBoundHealthAgents, findAllHealthAgents } from '../repositories/healthAgentRepo.js';

export default async function healthAgentRoutes(fastify) {
  fastify.addHook('preHandler', authMiddleware);
  fastify.addHook('preHandler', roleGuard('factory'));

  /** GET /api/health-agents - bound agents for this factory */
  fastify.get('/', async (request, reply) => {
    try {
      const agents = findBoundHealthAgents(request.user.id);
      return reply.send(success(agents));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** GET /api/health-agents/all - all agents for push selection */
  fastify.get('/all', async (request, reply) => {
    try {
      const agents = findAllHealthAgents();
      return reply.send(success(agents));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });
}
