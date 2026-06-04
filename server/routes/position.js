import { authMiddleware } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { success, fail } from '../utils/response.js';
import {
  getPositionTree, addPosition, editPosition, removePosition,
  getPositionHazards, bindPositionHazards, unbindPositionHazard,
} from '../services/positionService.js';

export default async function positionRoutes(fastify) {
  fastify.addHook('preHandler', authMiddleware);
  fastify.addHook('preHandler', roleGuard('factory'));

  /** GET /api/positions — position tree for this factory */
  fastify.get('/', async (request, reply) => {
    try {
      const tree = getPositionTree(request.user.id);
      return reply.send(success(tree));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** POST /api/positions — create position node */
  fastify.post('/', async (request, reply) => {
    try {
      const { parent_id, name, level } = request.body || {};
      const pos = addPosition(request.user.id, { parentId: parent_id, name, level });
      return reply.send(success(pos, '创建成功'));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** PUT /api/positions/:id — edit position node */
  fastify.put('/:id', async (request, reply) => {
    try {
      const pos = editPosition(Number(request.params.id), request.user.id, request.body || {});
      return reply.send(success(pos, '更新成功'));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** DELETE /api/positions/:id — delete position (cascades children) */
  fastify.delete('/:id', async (request, reply) => {
    try {
      removePosition(Number(request.params.id), request.user.id);
      return reply.send(success(null, '删除成功'));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** GET /api/positions/:id/hazards — hazards bound to position */
  fastify.get('/:id/hazards', async (request, reply) => {
    try {
      const hazards = getPositionHazards(Number(request.params.id), request.user.id);
      return reply.send(success(hazards));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** POST /api/positions/:id/hazards — bind hazards */
  fastify.post('/:id/hazards', async (request, reply) => {
    try {
      const { hazard_factor_ids } = request.body || {};
      if (!hazard_factor_ids || !Array.isArray(hazard_factor_ids)) {
        return reply.code(400).send(fail('请提供危害因素ID列表'));
      }
      const hazards = bindPositionHazards(Number(request.params.id), request.user.id, hazard_factor_ids);
      return reply.send(success(hazards, '绑定成功'));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** DELETE /api/positions/:id/hazards/:hazardId — unbind hazard */
  fastify.delete('/:id/hazards/:hazardId', async (request, reply) => {
    try {
      unbindPositionHazard(Number(request.params.id), Number(request.params.hazardId), request.user.id);
      return reply.send(success(null, '解绑成功'));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });
}
