import { getDB } from '../db/init.js';

/** Find health agent by phone */
export function findHealthAgentByPhone(phone) {
  const db = getDB();
  return db.prepare('SELECT * FROM health_agents WHERE phone = ?').get(phone);
}

/** Find health agent by id */
export function findHealthAgentById(id) {
  const db = getDB();
  return db.prepare('SELECT * FROM health_agents WHERE id = ?').get(id);
}

/** Find all health agents */
export function findAllHealthAgents() {
  const db = getDB();
  return db.prepare('SELECT * FROM health_agents ORDER BY created_at DESC').all();
}

/** Find health agents bound to a specific factory (via exam_tasks) */
export function findBoundHealthAgents(factoryId) {
  const db = getDB();
  return db.prepare(`
    SELECT DISTINCT ha.* FROM health_agents ha
    INNER JOIN exam_tasks et ON ha.id = et.health_agent_id
    WHERE et.factory_id = ?
    ORDER BY ha.created_at DESC
  `).all(factoryId);
}
