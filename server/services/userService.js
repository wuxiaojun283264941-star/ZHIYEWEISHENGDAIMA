import {
  findUsers, findUserById, createUser, updateUser,
  updateUserPassword, updateUserStatus, deleteUser,
  countUsersByRole, findUsersByRole,
} from '../repositories/userRepo.js';
import { hashPassword } from './authService.js';

/** Get paginated user list with filters */
export function getUserList({ role, keyword, page, pageSize }) {
  return findUsers({ role, keyword, page, pageSize });
}

/** Get single user detail */
export function getUserDetail(id) {
  const user = findUserById(id);
  if (!user) throw new Error('用户不存在');
  // Don't expose password_hash
  const { password_hash, ...safe } = user;
  return safe;
}

/** Create a new sub-account (admin only) */
export function createUserAccount({ username, password, role, name, orgName, phone }) {
  if (!username || !password || !role || !name) {
    throw new Error('用户名、密码、角色和姓名不能为空');
  }
  if (!['admin', 'factory', 'health_agent', 'c_unit'].includes(role)) {
    throw new Error('无效的角色类型');
  }
  const passwordHash = hashPassword(password);
  const user = createUser({ username, passwordHash: passwordHash, role, name, orgName, phone });
  const { password_hash, ...safe } = user;
  return safe;
}

/** Edit user profile */
export function editUserProfile(id, { name, orgName, phone }) {
  const user = findUserById(id);
  if (!user) throw new Error('用户不存在');
  const updated = updateUser(id, { name, orgName, phone });
  const { password_hash, ...safe } = updated;
  return safe;
}

/** Reset user password */
export function resetUserPassword(id, password) {
  const user = findUserById(id);
  if (!user) throw new Error('用户不存在');
  if (!password || password.length < 6) {
    throw new Error('密码长度不能少于6位');
  }
  const passwordHash = hashPassword(password);
  updateUserPassword(id, passwordHash);
  return true;
}

/** Toggle user status (active/disabled) */
export function toggleUserStatus(id, status) {
  const user = findUserById(id);
  if (!user) throw new Error('用户不存在');
  if (!['active', 'disabled'].includes(status)) {
    throw new Error('无效的状态值');
  }
  const updated = updateUserStatus(id, status);
  const { password_hash, ...safe } = updated;
  return safe;
}

/** Remove user */
export function removeUser(id) {
  const user = findUserById(id);
  if (!user) throw new Error('用户不存在');
  // Prevent deleting the last admin
  if (user.role === 'admin') {
    const adminCount = countUsersByRole('admin');
    if (adminCount <= 1) {
      throw new Error('不能删除最后一个管理员账号');
    }
  }
  const deleted = deleteUser(id);
  if (!deleted) throw new Error('删除失败');
  return true;
}
