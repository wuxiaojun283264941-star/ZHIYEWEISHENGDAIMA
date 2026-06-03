import { fail } from '../utils/response.js';

/** Role guard middleware factory - check user has required role(s) */
export function roleGuard(...allowedRoles) {
  return async (request, reply) => {
    if (!request.user) {
      return reply.code(401).send(fail('未登录', 401));
    }
    if (!allowedRoles.includes(request.user.role)) {
      return reply.code(403).send(fail('无权限访问', 403));
    }
  };
}
