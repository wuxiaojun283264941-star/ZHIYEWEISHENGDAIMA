import { getDB } from '../db/init.js';

/** Find all packages for a health agent */
export function findPackagesByAgent(agentId) {
  const db = getDB();
  return db.prepare(
    'SELECT * FROM exam_packages WHERE health_agent_id = ? ORDER BY created_at DESC'
  ).all(agentId);
}

/** Find package by id */
export function findPackageById(id) {
  const db = getDB();
  return db.prepare('SELECT * FROM exam_packages WHERE id = ?').get(id);
}

/** Create exam package */
export function createPackage({ healthAgentId, name, description = '', price = 0, examItems = '' }) {
  const db = getDB();
  const result = db.prepare(
    `INSERT INTO exam_packages (health_agent_id, name, description, price, exam_items)
     VALUES (?, ?, ?, ?, ?)`
  ).run(healthAgentId, name, description, price, examItems);
  return {
    id: result.lastInsertRowid, health_agent_id: healthAgentId, name,
    description, price, exam_items: examItems, is_active: 1,
  };
}

/** Update exam package */
export function updatePackage(id, { name, description, price, examItems, isActive }) {
  const db = getDB();
  db.prepare(
    `UPDATE exam_packages
     SET name = ?, description = ?, price = ?, exam_items = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(name, description, price, examItems, isActive !== undefined ? isActive : 1, id);
  return findPackageById(id);
}

/** Delete exam package */
export function deletePackage(id, agentId) {
  const db = getDB();
  const result = db.prepare(
    'DELETE FROM exam_packages WHERE id = ? AND health_agent_id = ?'
  ).run(id, agentId);
  return result.changes > 0;
}
