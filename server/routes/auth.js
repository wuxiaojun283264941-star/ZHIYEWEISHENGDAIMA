import { factoryLogin, agentSendCode, agentLogin, cunitLogin } from '../services/authService.js';
import { success, fail } from '../utils/response.js';
import { authMiddleware } from '../middleware/auth.js';

export default async function authRoutes(fastify) {
  /** POST /api/auth/factory-login */
  fastify.post('/factory-login', async (request, reply) => {
    try {
      const { username, password } = request.body || {};
      if (!username || !password) {
        return reply.code(400).send(fail('用户名和密码不能为空'));
      }
      const result = factoryLogin(username, password);
      return reply.send(success(result));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** POST /api/auth/agent-send-code */
  fastify.post('/agent-send-code', async (request, reply) => {
    try {
      const { phone } = request.body || {};
      if (!phone) {
        return reply.code(400).send(fail('手机号不能为空'));
      }
      const result = agentSendCode(phone);
      return reply.send(success(result));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** POST /api/auth/agent-login */
  fastify.post('/agent-login', async (request, reply) => {
    try {
      const { phone, code } = request.body || {};
      if (!phone || !code) {
        return reply.code(400).send(fail('手机号和验证码不能为空'));
      }
      const result = agentLogin(phone, code);
      return reply.send(success(result));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** POST /api/auth/cunit-login */
  fastify.post('/cunit-login', async (request, reply) => {
    try {
      const { username, password } = request.body || {};
      if (!username || !password) {
        return reply.code(400).send(fail('用户名和密码不能为空'));
      }
      const result = cunitLogin(username, password);
      return reply.send(success(result));
    } catch (err) {
      return reply.code(400).send(fail(err.message));
    }
  });

  /** GET /api/auth/me - get current user info */
  fastify.get('/me', { preHandler: [authMiddleware] }, async (request, reply) => {
    return reply.send(success(request.user));
  });
}
