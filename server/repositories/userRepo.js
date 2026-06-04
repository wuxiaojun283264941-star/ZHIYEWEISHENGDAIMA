import { getDB } from '../db/init.js';

/**
 * Unified user repository — single data access layer for the users table.
 * Replaces all old role-specific repos (factoryRepo, healthAgentRepo, adminRepo, cUnitAgentRepo).
 */

/** Find user by username */
export function findUserByUsername(username) {
  const db = getDB();
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
}

/** Find user by id */
export function findUserById(id) {
  const db = getDB();
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

/** Find user by phone */
export function findUserByPhone(phone) {
  const db = getDB();
  return db.prepare('SELECT * FROM users WHERE phone = ? AND role = ?').get(phone, 'health_agent');
}

/** Find all users with optional filters */
export function findUsers({ role = '', keyword = '', page = 1, pageSize = 20 } = {}) {
  const db = getDB();
  const offset = (page - 1) * pageSize;
  let countSql = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
  let listSql = 'SELECT id, username, role, name, org_name, phone, status, created_at, updated_at FROM users WHERE 1=1';
  const params = [];
  const countParams = [];

  if (role) {
    countSql += ' AND role = ?';
    listSql += ' AND role = ?';
    countParams.push(role);
    params.push(role);
  }
  if (keyword) {
    const like = `%${keyword}%`;
    countSql += ' AND (name LIKE ? OR username LIKE ? OR phone LIKE ? OR org_name LIKE ?)';
    listSql += ' AND (name LIKE ? OR username LIKE ? OR phone LIKE ? OR org_name LIKE ?)';
    countParams.push(like, like, like, like);
    params.push(like, like, like, like);
  }

  listSql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

  const { total } = db.prepare(countSql).get(...countParams);
  const list = db.prepare(listSql).all(...params, pageSize, offset);

  return { list, total, page, pageSize };
}

/** Create a new user */
export function createUser({ username, passwordHash, role, name, orgName = '', phone = '' }) {
  const db = getDB();
  const result = db.prepare(
    `INSERT INTO users (username, password_hash, role, name, org_name, phone, status)
     VALUES (?, ?, ?, ?, ?, ?, 'active')`
  ).run(username, passwordHash, role, name, orgName, phone);
  return {
    id: result.lastInsertRowid,
    username,
    role,
    name,
    org_name: orgName,
    phone,
    status: 'active',
  };
}

/** Update user profile (name, org_name, phone) */
export function updateUser(id, { name, orgName, phone }) {
  const db = getDB();
  db.prepare(
    `UPDATE users SET name = ?, org_name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(name, orgName || '', phone || '', id);
  return findUserById(id);
}

/** Update user password */
export function updateUserPassword(id, passwordHash) {
  const db = getDB();
  db.prepare(
    `UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(passwordHash, id);
  return true;
}

/** Update user status (active/disabled) */
export function updateUserStatus(id, status) {
  const db = getDB();
  db.prepare(
    `UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(status, id);
  return findUserById(id);
}

/** Delete user */
export function deleteUser(id) {
  const db = getDB();
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
  return result.changes > 0;
}

/** Find all users by role (for dropdowns) */
export function findUsersByRole(role) {
  const db = getDB();
  return db.prepare(
    `SELECT id, username, role, name, org_name, phone, status
     FROM users WHERE role = ? AND status = 'active' ORDER BY created_at DESC`
  ).all(role);
}

/** Find health agents bound to a specific factory (via exam_tasks) */
export function findBoundHealthAgentsForFactory(factoryId) {
  const db = getDB();
  return db.prepare(`
    SELECT DISTINCT u.id, u.name, u.org_name, u.phone
    FROM users u
    INNER JOIN exam_tasks et ON u.id = et.health_agent_id
    WHERE et.factory_id = ? AND u.role = 'health_agent' AND u.status = 'active'
    ORDER BY u.created_at DESC
  `).all(factoryId);
}

/** Get count of users by role */
export function countUsersByRole(role) {
  const db = getDB();
  const row = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ? AND status = ?').get(role, 'active');
  return row.count;
}
