import { getDB } from '../db/init.js';

/** Find admin by username */
export function findAdminByUsername(username) {
  const db = getDB();
  return db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
}

/** Find admin by id */
export function findAdminById(id) {
  const db = getDB();
  return db.prepare('SELECT * FROM admins WHERE id = ?').get(id);
}

/** Get system overview stats for admin dashboard */
export function getAdminStats() {
  const db = getDB();
  const factoryCount = db.prepare('SELECT COUNT(*) as count FROM factories').get().count;
  const employeeCount = db.prepare('SELECT COUNT(*) as count FROM employees').get().count;
  const agentCount = db.prepare('SELECT COUNT(*) as count FROM health_agents').get().count;
  const cUnitCount = db.prepare('SELECT COUNT(*) as count FROM c_unit_agents').get().count;
  const taskCount = db.prepare('SELECT COUNT(*) as count FROM exam_tasks').get().count;
  const completedCount = db.prepare("SELECT COUNT(*) as count FROM exam_tasks WHERE status = 'completed'").get().count;
  const reportCount = db.prepare('SELECT COUNT(*) as count FROM exam_reports').get().count;
  return { factoryCount, employeeCount, agentCount, cUnitCount, taskCount, completedCount, reportCount };
}

/** Get all factories */
export function findAllFactories() {
  const db = getDB();
  return db.prepare('SELECT * FROM factories ORDER BY created_at DESC').all();
}

/** Get all health agents */
export function findAllAgents() {
  const db = getDB();
  return db.prepare('SELECT * FROM health_agents ORDER BY created_at DESC').all();
}

/** Get all C-unit agents */
export function findAllCUnitAgents() {
  const db = getDB();
  return db.prepare('SELECT * FROM c_unit_agents ORDER BY created_at DESC').all();
}
