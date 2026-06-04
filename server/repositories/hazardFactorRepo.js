import { getDB } from '../db/init.js';

/** Find all hazard factors with optional category filter and keyword search */
export function findHazardFactors({ category = '', keyword = '' } = {}) {
  const db = getDB();
  let sql = 'SELECT * FROM hazard_factors WHERE 1=1';
  const params = [];

  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (keyword) {
    sql += ' AND (name LIKE ? OR code LIKE ? OR description LIKE ?)';
    const like = `%${keyword}%`;
    params.push(like, like, like);
  }
  sql += ' ORDER BY category, code';

  return db.prepare(sql).all(...params);
}

/** Find hazard factor by id */
export function findHazardFactorById(id) {
  const db = getDB();
  return db.prepare('SELECT * FROM hazard_factors WHERE id = ?').get(id);
}

/** Find hazard factor by code */
export function findHazardFactorByCode(code) {
  const db = getDB();
  return db.prepare('SELECT * FROM hazard_factors WHERE code = ?').get(code);
}

/** Create hazard factor */
export function createHazardFactor({ code, category, name, description = '', examFrequency = '' }) {
  const db = getDB();
  const result = db.prepare(
    `INSERT INTO hazard_factors (code, category, name, description, exam_frequency)
     VALUES (?, ?, ?, ?, ?)`
  ).run(code, category, name, description, examFrequency);
  return { id: result.lastInsertRowid, code, category, name, description, exam_frequency: examFrequency };
}

/** Update hazard factor */
export function updateHazardFactor(id, { code, category, name, description, examFrequency }) {
  const db = getDB();
  db.prepare(
    `UPDATE hazard_factors SET code = ?, category = ?, name = ?, description = ?, exam_frequency = ? WHERE id = ?`
  ).run(code, category, name, description || '', examFrequency || '', id);
  return findHazardFactorById(id);
}

/** Delete hazard factor */
export function deleteHazardFactor(id) {
  const db = getDB();
  const result = db.prepare('DELETE FROM hazard_factors WHERE id = ?').run(id);
  return result.changes > 0;
}

/** Get distinct categories */
export function getHazardCategories() {
  const db = getDB();
  return db.prepare('SELECT DISTINCT category FROM hazard_factors ORDER BY category').all().map(r => r.category);
}
