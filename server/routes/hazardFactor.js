import { authMiddleware } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { success, fail } from '../utils/response.js';
import {
  getHazardFactors, getHazardFactor, addHazardFactor,
  editHazardFactor, removeHazardFactor, getCategories,
} from '../services/hazardFactorService.js';

export default async function hazardFactorRoutes(fastify) {
  fastify.addHook('preHandler', authMiddleware);
  fastify.addHook('preHandler', roleGuard('admin'));

  /** GET /api/hazard-factors — list with category/keyword filter */
  fastify.get('/', async (request, reply) => {
    try {
      const { category = '', keyword = '' } = request.query;
      const list = getHazardFactors({ category, keyword });
      return reply.send(success(list));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** GET /api/hazard-factors/categories — distinct categories */
  fastify.get('/categories', async (request, reply) => {
    try {
      const cats = getCategories();
      return reply.send(success(cats));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** POST /api/hazard-factors — create */
  fastify.post('/', async (request, reply) => {
    try {
      const { code, category, name, description, exam_frequency } = request.body || {};
      const hf = addHazardFactor({ code, category, name, description, examFrequency: exam_frequency });
      return reply.send(success(hf, '创建成功'));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** PUT /api/hazard-factors/:id — update */
  fastify.put('/:id', async (request, reply) => {
    try {
      const hf = editHazardFactor(Number(request.params.id), request.body || {});
      return reply.send(success(hf, '更新成功'));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** DELETE /api/hazard-factors/:id — delete */
  fastify.delete('/:id', async (request, reply) => {
    try {
      removeHazardFactor(Number(request.params.id));
      return reply.send(success(null, '删除成功'));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });
}
