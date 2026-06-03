import { getDB } from '../db/init.js';

/** Find factory by username */
export function findFactoryByUsername(username) {
  const db = getDB();
  return db.prepare('SELECT * FROM factories WHERE username = ?').get(username);
}

/** Find factory by id */
export function findFactoryById(id) {
  const db = getDB();
  return db.prepare('SELECT * FROM factories WHERE id = ?').get(id);
}

/** Create a factory */
export function createFactory({ name, username, passwordHash, industryType = '' }) {
  const db = getDB();
  const result = db.prepare(
    `INSERT INTO factories (name, username, password_hash, industry_type) VALUES (?, ?, ?, ?)`
  ).run(name, username, passwordHash, industryType);
  return { id: result.lastInsertRowid, name, username, industry_type: industryType };
}

/** Update factory */
export function updateFactory(id, { name, industryType }) {
  const db = getDB();
  db.prepare(
    `UPDATE factories SET name = ?, industry_type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(name, industryType, id);
  return findFactoryById(id);
}
