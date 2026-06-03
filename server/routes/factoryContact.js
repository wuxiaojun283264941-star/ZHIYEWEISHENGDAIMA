import { authMiddleware } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { success, fail } from '../utils/response.js';
import { getContacts, addContact, editContact, removeContact } from '../services/factoryContactService.js';

export default async function factoryContactRoutes(fastify) {
  fastify.addHook('preHandler', authMiddleware);
  fastify.addHook('preHandler', roleGuard('factory'));

  /** GET /api/factory-contacts */
  fastify.get('/', async (request, reply) => {
    try {
      const contacts = getContacts(request.user.id);
      return reply.send(success(contacts));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** POST /api/factory-contacts */
  fastify.post('/', async (request, reply) => {
    try {
      const { name, position, phone } = request.body || {};
      const contact = addContact(request.user.id, { name, position, phone });
      return reply.send(success(contact));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** PUT /api/factory-contacts/:id */
  fastify.put('/:id', async (request, reply) => {
    try {
      const { name, position, phone } = request.body || {};
      const contact = editContact(Number(request.params.id), request.user.id, { name, position, phone });
      return reply.send(success(contact));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** DELETE /api/factory-contacts/:id */
  fastify.delete('/:id', async (request, reply) => {
    try {
      removeContact(Number(request.params.id), request.user.id);
      return reply.send(success(null, '删除成功'));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });
}
