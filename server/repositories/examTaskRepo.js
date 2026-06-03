import { getDB } from '../db/init.js';

/** Create exam task with employees in a transaction */
export function createExamTask({ factoryId, healthAgentId, factoryContactId, employeeIds }) {
  const db = getDB();
  const result = db.prepare(
    `INSERT INTO exam_tasks (factory_id, health_agent_id, factory_contact_id, status) VALUES (?, ?, ?, 'pushed')`
  ).run(factoryId, healthAgentId, factoryContactId || null);
  const taskId = result.lastInsertRowid;

  const insertTaskEmp = db.prepare(
    `INSERT INTO exam_task_employees (exam_task_id, employee_id, exam_status) VALUES (?, ?, 'pending')`
  );
  const insertMany = db.transaction((tId, empIds) => {
    for (const empId of empIds) {
      insertTaskEmp.run(tId, empId);
    }
  });
  insertMany(taskId, employeeIds);

  return taskId;
}

/** Find exam task by id */
export function findExamTaskById(id) {
  const db = getDB();
  return db.prepare('SELECT * FROM exam_tasks WHERE id = ?').get(id);
}

/** Find exam task with details (joined with factory, agent, contact info) */
export function findExamTaskDetailById(id) {
  const db = getDB();
  return db.prepare(`
    SELECT et.*,
      f.name as factory_name,
      ha.name as agent_name, ha.phone as agent_phone, ha.center_name as agent_center,
      fc.name as contact_name, fc.phone as contact_phone
    FROM exam_tasks et
    LEFT JOIN factories f ON et.factory_id = f.id
    LEFT JOIN health_agents ha ON et.health_agent_id = ha.id
    LEFT JOIN factory_contacts fc ON et.factory_contact_id = fc.id
    WHERE et.id = ?
  `).get(id);
}

/** Find employees for an exam task */
export function findExamTaskEmployees(taskId) {
  const db = getDB();
  return db.prepare(`
    SELECT ete.*, e.name as employee_name, e.id_card, e.position, e.phone, e.age, e.work_years
    FROM exam_task_employees ete
    INNER JOIN employees e ON ete.employee_id = e.id
    WHERE ete.exam_task_id = ?
  `).all(taskId);
}

/** Find pushed tasks by factory */
export function findPushedTasksByFactory(factoryId, { page = 1, pageSize = 20 } = {}) {
  const db = getDB();
  const offset = (page - 1) * pageSize;
  const { total } = db.prepare('SELECT COUNT(*) as total FROM exam_tasks WHERE factory_id = ?').get(factoryId);
  const list = db.prepare(`
    SELECT et.*, ha.name as agent_name, ha.center_name as agent_center, fc.name as contact_name
    FROM exam_tasks et
    LEFT JOIN health_agents ha ON et.health_agent_id = ha.id
    LEFT JOIN factory_contacts fc ON et.factory_contact_id = fc.id
    WHERE et.factory_id = ?
    ORDER BY et.created_at DESC
    LIMIT ? OFFSET ?
  `).all(factoryId, pageSize, offset);
  return { list, total, page, pageSize };
}

/** Find pending tasks for a health agent */
export function findPendingTasksByAgent(agentId, { page = 1, pageSize = 20 } = {}) {
  const db = getDB();
  const offset = (page - 1) * pageSize;
  const { total } = db.prepare(
    "SELECT COUNT(*) as total FROM exam_tasks WHERE health_agent_id = ? AND status IN ('pushed', 'in_progress')"
  ).get(agentId);
  const list = db.prepare(`
    SELECT et.*, f.name as factory_name, fc.name as contact_name, fc.phone as contact_phone
    FROM exam_tasks et
    LEFT JOIN factories f ON et.factory_id = f.id
    LEFT JOIN factory_contacts fc ON et.factory_contact_id = fc.id
    WHERE et.health_agent_id = ? AND et.status IN ('pushed', 'in_progress')
    ORDER BY et.pushed_at DESC
    LIMIT ? OFFSET ?
  `).all(agentId, pageSize, offset);
  return { list, total, page, pageSize };
}

/** Find completed tasks by agent (history) */
export function findCompletedTasksByAgent(agentId, { page = 1, pageSize = 20 } = {}) {
  const db = getDB();
  const offset = (page - 1) * pageSize;
  const { total } = db.prepare(
    "SELECT COUNT(*) as total FROM exam_tasks WHERE health_agent_id = ? AND status = 'completed'"
  ).get(agentId);
  const list = db.prepare(`
    SELECT et.*, f.name as factory_name
    FROM exam_tasks et
    LEFT JOIN factories f ON et.factory_id = f.id
    WHERE et.health_agent_id = ? AND et.status = 'completed'
    ORDER BY et.completed_at DESC
    LIMIT ? OFFSET ?
  `).all(agentId, pageSize, offset);
  return { list, total, page, pageSize };
}

/** Update task status to in_progress (fetch) */
export function updateTaskToInProgress(id) {
  const db = getDB();
  db.prepare("UPDATE exam_tasks SET status = 'in_progress' WHERE id = ? AND status = 'pushed'").run(id);
  return findExamTaskById(id);
}

/** Update task status to completed */
export function updateTaskToCompleted(id) {
  const db = getDB();
  db.prepare("UPDATE exam_tasks SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'in_progress'").run(id);
  return findExamTaskById(id);
}

/** Find completed tasks for C-unit view */
export function findCompletedTasksForCUnit({ page = 1, pageSize = 20 } = {}) {
  const db = getDB();
  const offset = (page - 1) * pageSize;
  const { total } = db.prepare("SELECT COUNT(*) as total FROM exam_tasks WHERE status = 'completed'").get();
  const list = db.prepare(`
    SELECT et.*, f.name as factory_name, ha.name as agent_name, ha.center_name as agent_center
    FROM exam_tasks et
    LEFT JOIN factories f ON et.factory_id = f.id
    LEFT JOIN health_agents ha ON et.health_agent_id = ha.id
    WHERE et.status = 'completed'
    ORDER BY et.completed_at DESC
    LIMIT ? OFFSET ?
  `).all(pageSize, offset);
  return { list, total, page, pageSize };
}
