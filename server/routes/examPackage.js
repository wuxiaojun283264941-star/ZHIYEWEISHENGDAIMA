import { authMiddleware } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { success, fail } from '../utils/response.js';
import { getPackages, addPackage, editPackage, removePackage } from '../services/examPackageService.js';

export default async function examPackageRoutes(fastify) {
  fastify.addHook('preHandler', authMiddleware);
  fastify.addHook('preHandler', roleGuard('health_agent'));

  /** GET /api/exam-packages — list packages */
  fastify.get('/', async (request, reply) => {
    try {
      const packages = getPackages(request.user.id);
      return reply.send(success(packages));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** POST /api/exam-packages — create package */
  fastify.post('/', async (request, reply) => {
    try {
      const { name, description, price, exam_items } = request.body || {};
      const pkg = addPackage(request.user.id, { name, description, price, examItems: exam_items });
      return reply.send(success(pkg, '创建成功'));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** PUT /api/exam-packages/:id — update package */
  fastify.put('/:id', async (request, reply) => {
    try {
      const pkg = editPackage(Number(request.params.id), request.user.id, request.body || {});
      return reply.send(success(pkg, '更新成功'));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** DELETE /api/exam-packages/:id — delete package */
  fastify.delete('/:id', async (request, reply) => {
    try {
      removePackage(Number(request.params.id), request.user.id);
      return reply.send(success(null, '删除成功'));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });
}
