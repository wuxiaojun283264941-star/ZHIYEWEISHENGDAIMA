import { verifyToken } from '../services/authService.js';

/** Authentication middleware - verify JWT token */
export async function authMiddleware(request, reply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.code(401).send({ code: 401, data: null, message: '未登录或登录已过期' });
    return;
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    reply.code(401).send({ code: 401, data: null, message: '登录已过期，请重新登录' });
    return;
  }

  request.user = decoded;
}
