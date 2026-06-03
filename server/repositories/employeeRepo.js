import { getDB } from '../db/init.js';

/** Find employees by factory with pagination and keyword search */
export function findEmployeesByFactory(factoryId, { page = 1, pageSize = 20, keyword = '' } = {}) {
  const db = getDB();
  const offset = (page - 1) * pageSize;
  let countSql = 'SELECT COUNT(*) as total FROM employees WHERE factory_id = ?';
  let listSql = 'SELECT * FROM employees WHERE factory_id = ?';
  const params = [factoryId];

  if (keyword) {
    const likeKeyword = `%${keyword}%`;
    countSql += ' AND (name LIKE ? OR id_card LIKE ? OR phone LIKE ? OR position LIKE ?)';
    listSql += ' AND (name LIKE ? OR id_card LIKE ? OR phone LIKE ? OR position LIKE ?)';
    params.push(likeKeyword, likeKeyword, likeKeyword, likeKeyword);
  }

  listSql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

  const countParams = [...params];
  const listParams = [...params, pageSize, offset];

  const { total } = db.prepare(countSql).get(...countParams);
  const list = db.prepare(listSql).all(...listParams);

  return { list, total, page, pageSize };
}

/** Find employee by id */
export function findEmployeeById(id) {
  const db = getDB();
  return db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
}

/** Create employee */
export function createEmployee(factoryId, { name, age = 0, workYears = 0, position = '', phone = '', idCard }) {
  const db = getDB();
  const result = db.prepare(
    `INSERT INTO employees (factory_id, name, age, work_years, position, phone, id_card) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(factoryId, name, age, workYears, position, phone, idCard);
  return { id: result.lastInsertRowid, factory_id: factoryId, name, age, work_years: workYears, position, phone, id_card: idCard };
}

/** Update employee */
export function updateEmployee(id, factoryId, { name, age, workYears, position, phone, idCard }) {
  const db = getDB();
  db.prepare(
    `UPDATE employees SET name = ?, age = ?, work_years = ?, position = ?, phone = ?, id_card = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND factory_id = ?`
  ).run(name, age, workYears, position, phone, idCard, id, factoryId);
  return findEmployeeById(id);
}

/** Delete employee */
export function deleteEmployee(id, factoryId) {
  const db = getDB();
  const result = db.prepare('DELETE FROM employees WHERE id = ? AND factory_id = ?').run(id, factoryId);
  return result.changes > 0;
}

/** Find employees by IDs */
export function findEmployeesByIds(ids) {
  const db = getDB();
  if (!ids || ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(',');
  return db.prepare(`SELECT * FROM employees WHERE id IN (${placeholders})`).all(...ids);
}
