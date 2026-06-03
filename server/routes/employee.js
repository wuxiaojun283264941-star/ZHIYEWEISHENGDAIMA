import { authMiddleware } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { success, paginated, fail } from '../utils/response.js';
import { getEmployees, getEmployee, addEmployee, editEmployee, removeEmployee } from '../services/employeeService.js';

export default async function employeeRoutes(fastify) {
  // All routes require factory auth
  fastify.addHook('preHandler', authMiddleware);
  fastify.addHook('preHandler', roleGuard('factory'));

  /** GET /api/employees - list with pagination */
  fastify.get('/', async (request, reply) => {
    try {
      const { page = 1, pageSize = 20, keyword = '' } = request.query;
      const result = getEmployees(request.user.id, { page: Number(page), pageSize: Number(pageSize), keyword });
      return reply.send(paginated(result));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** GET /api/employees/:id */
  fastify.get('/:id', async (request, reply) => {
    try {
      const employee = getEmployee(Number(request.params.id), request.user.id);
      return reply.send(success(employee));
    } catch (err) {
      return reply.code(404).send(fail(err.message));
    }
  });

  /** POST /api/employees */
  fastify.post('/', async (request, reply) => {
    try {
      const { name, age, work_years, position, phone, id_card } = request.body || {};
      const employee = addEmployee(request.user.id, { name, age, workYears: work_years, position, phone, idCard: id_card });
      return reply.send(success(employee));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** PUT /api/employees/:id */
  fastify.put('/:id', async (request, reply) => {
    try {
      const { name, age, work_years, position, phone, id_card } = request.body || {};
      const employee = editEmployee(Number(request.params.id), request.user.id, { name, age, workYears: work_years, position, phone, idCard: id_card });
      return reply.send(success(employee));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** DELETE /api/employees/:id */
  fastify.delete('/:id', async (request, reply) => {
    try {
      removeEmployee(Number(request.params.id), request.user.id);
      return reply.send(success(null, '删除成功'));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });
}
