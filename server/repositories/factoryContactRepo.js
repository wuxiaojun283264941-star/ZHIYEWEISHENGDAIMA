import { getDB } from '../db/init.js';

/** Find all contacts for a factory */
export function findContactsByFactory(factoryId) {
  const db = getDB();
  return db.prepare('SELECT * FROM factory_contacts WHERE factory_id = ? ORDER BY created_at DESC').all(factoryId);
}

/** Find contact by id */
export function findContactById(id) {
  const db = getDB();
  return db.prepare('SELECT * FROM factory_contacts WHERE id = ?').get(id);
}

/** Create contact */
export function createContact(factoryId, { name, position = '', phone }) {
  const db = getDB();
  const result = db.prepare(
    `INSERT INTO factory_contacts (factory_id, name, position, phone) VALUES (?, ?, ?, ?)`
  ).run(factoryId, name, position, phone);
  return { id: result.lastInsertRowid, factory_id: factoryId, name, position, phone };
}

/** Update contact */
export function updateContact(id, factoryId, { name, position, phone }) {
  const db = getDB();
  db.prepare(
    `UPDATE factory_contacts SET name = ?, position = ?, phone = ? WHERE id = ? AND factory_id = ?`
  ).run(name, position, phone, id, factoryId);
  return findContactById(id);
}

/** Delete contact */
export function deleteContact(id, factoryId) {
  const db = getDB();
  const result = db.prepare('DELETE FROM factory_contacts WHERE id = ? AND factory_id = ?').run(id, factoryId);
  return result.changes > 0;
}
