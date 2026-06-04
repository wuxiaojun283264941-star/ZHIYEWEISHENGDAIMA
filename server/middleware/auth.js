import { verifyToken } from '../services/authService.js';

/** Authentication middleware - verify JWT token (from header or query param) */
export async function authMiddleware(request, reply) {
  const authHeader = request.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (request.query && request.query.token) {
    // Support token from query parameter for browser direct navigation (e.g. PDF download)
    token = request.query.token;
  }

  if (!token) {
    reply.code(401).send({ code: 401, data: null, message: '未登录或登录已过期' });
    return;
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    reply.code(401).send({ code: 401, data: null, message: '登录已过期，请重新登录' });
    return;
  }

  request.user = decoded;
}
