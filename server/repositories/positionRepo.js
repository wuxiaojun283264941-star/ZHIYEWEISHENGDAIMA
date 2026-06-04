import { getDB } from '../db/init.js';

/** Get all positions for a factory (flat list) */
export function findPositionsByFactory(factoryId) {
  const db = getDB();
  return db.prepare(
    `SELECT p.*,
      (SELECT COUNT(*) FROM positions WHERE parent_id = p.id) as child_count
     FROM positions p
     WHERE p.factory_id = ?
     ORDER BY p.parent_id, p.order_index, p.id`
  ).all(factoryId);
}

/** Find position by id */
export function findPositionById(id) {
  const db = getDB();
  return db.prepare('SELECT * FROM positions WHERE id = ?').get(id);
}

/** Create position node */
export function createPosition({ factoryId, parentId, name, level, orderIndex = 0 }) {
  const db = getDB();
  const result = db.prepare(
    `INSERT INTO positions (factory_id, parent_id, name, level, order_index)
     VALUES (?, ?, ?, ?, ?)`
  ).run(factoryId, parentId || null, name, level, orderIndex);
  return { id: result.lastInsertRowid, factory_id: factoryId, parent_id: parentId, name, level, order_index: orderIndex };
}

/** Update position node */
export function updatePosition(id, { name, parentId, orderIndex }) {
  const db = getDB();
  db.prepare(
    `UPDATE positions SET name = ?, parent_id = ?, order_index = ? WHERE id = ?`
  ).run(name, parentId !== undefined ? parentId : null, orderIndex !== undefined ? orderIndex : 0, id);
  return findPositionById(id);
}

/** Delete position node and all its descendants recursively */
export function deletePosition(id) {
  const db = getDB();
  // Collect all descendant IDs
  const ids = [id];
  const stack = [id];
  while (stack.length > 0) {
    const current = stack.pop();
    const children = db.prepare('SELECT id FROM positions WHERE parent_id = ?').all(current);
    for (const child of children) {
      ids.push(child.id);
      stack.push(child.id);
    }
  }
  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`DELETE FROM positions WHERE id IN (${placeholders})`).run(...ids);
  return true;
}

/** Find hazards bound to a position */
export function findHazardsByPosition(positionId) {
  const db = getDB();
  return db.prepare(`
    SELECT hf.*, ph.id as binding_id
    FROM hazard_factors hf
    INNER JOIN position_hazards ph ON hf.id = ph.hazard_factor_id
    WHERE ph.position_id = ?
    ORDER BY hf.category, hf.name
  `).all(positionId);
}

/** Bind hazards to a position (replaces all bindings) */
export function bindHazardsToPosition(positionId, hazardFactorIds) {
  const db = getDB();
  const transaction = db.transaction((ids) => {
    // Delete existing bindings
    db.prepare('DELETE FROM position_hazards WHERE position_id = ?').run(positionId);
    // Insert new bindings
    const insert = db.prepare(
      'INSERT OR IGNORE INTO position_hazards (position_id, hazard_factor_id) VALUES (?, ?)'
    );
    for (const hfId of ids) {
      insert.run(positionId, hfId);
    }
  });
  transaction(hazardFactorIds);
  return findHazardsByPosition(positionId);
}

/** Unbind a single hazard from position */
export function unbindHazard(positionId, hazardFactorId) {
  const db = getDB();
  db.prepare('DELETE FROM position_hazards WHERE position_id = ? AND hazard_factor_id = ?')
    .run(positionId, hazardFactorId);
  return true;
}
