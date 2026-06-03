import { getDB } from '../db/init.js';

/** Find C-unit agent by username */
export function findCUnitAgentByUsername(username) {
  const db = getDB();
  return db.prepare('SELECT * FROM c_unit_agents WHERE username = ?').get(username);
}

/** Find C-unit agent by id */
export function findCUnitAgentById(id) {
  const db = getDB();
  return db.prepare('SELECT * FROM c_unit_agents WHERE id = ?').get(id);
}
