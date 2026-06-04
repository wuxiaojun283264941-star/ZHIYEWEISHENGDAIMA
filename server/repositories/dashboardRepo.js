import { getDB } from '../db/init.js';

/** Get admin dashboard stats */
export function getAdminDashboardStats() {
  const db = getDB();
  const factoryCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'factory' AND status = 'active'").get().count;
  const agentCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'health_agent' AND status = 'active'").get().count;
  const cUnitCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'c_unit' AND status = 'active'").get().count;
  const employeeCount = db.prepare('SELECT COUNT(*) as count FROM employees').get().count;
  const taskCount = db.prepare('SELECT COUNT(*) as count FROM exam_tasks').get().count;
  const completedCount = db.prepare("SELECT COUNT(*) as count FROM exam_tasks WHERE status = 'completed'").get().count;
  const reportCount = db.prepare('SELECT COUNT(*) as count FROM exam_reports').get().count;
  return { factoryCount, agentCount, cUnitCount, employeeCount, taskCount, completedCount, reportCount };
}

/** Get factory dashboard stats */
export function getFactoryDashboardStats(factoryId) {
  const db = getDB();
  const employeeCount = db.prepare('SELECT COUNT(*) as count FROM employees WHERE factory_id = ?').get(factoryId).count;
  const taskCount = db.prepare('SELECT COUNT(*) as count FROM exam_tasks WHERE factory_id = ?').get(factoryId).count;
  const pushedCount = db.prepare("SELECT COUNT(*) as count FROM exam_tasks WHERE factory_id = ? AND status = 'pushed'").get(factoryId).count;
  const inProgressCount = db.prepare("SELECT COUNT(*) as count FROM exam_tasks WHERE factory_id = ? AND status IN ('accepted','in_progress')").get(factoryId).count;
  const completedCount = db.prepare("SELECT COUNT(*) as count FROM exam_tasks WHERE factory_id = ? AND status = 'completed'").get(factoryId).count;

  // Recent tasks (last 5)
  const recentTasks = db.prepare(`
    SELECT et.*, ha.name as agent_name, ha.org_name as agent_center
    FROM exam_tasks et
    LEFT JOIN users ha ON et.health_agent_id = ha.id
    WHERE et.factory_id = ?
    ORDER BY et.created_at DESC LIMIT 5
  `).all(factoryId);

  return { employeeCount, taskCount, pushedCount, inProgressCount, completedCount, recentTasks };
}

/** Get health agent dashboard stats */
export function getHealthAgentDashboardStats(agentId) {
  const db = getDB();
  const pendingCount = db.prepare(
    "SELECT COUNT(*) as count FROM exam_tasks WHERE health_agent_id = ? AND status IN ('pushed','accepted','in_progress')"
  ).get(agentId).count;
  const completedCount = db.prepare(
    "SELECT COUNT(*) as count FROM exam_tasks WHERE health_agent_id = ? AND status = 'completed'"
  ).get(agentId).count;
  const reportCount = db.prepare(
    'SELECT COUNT(*) as count FROM exam_reports WHERE uploaded_by = ?'
  ).get(agentId).count;

  // This month's completed
  const monthCompleted = db.prepare(
    "SELECT COUNT(*) as count FROM exam_tasks WHERE health_agent_id = ? AND status = 'completed' AND completed_at >= date('now','start of month')"
  ).get(agentId).count;

  return { pendingCount, completedCount, reportCount, monthCompleted };
}

/** Get C-unit dashboard stats */
export function getCUnitDashboardStats() {
  const db = getDB();
  const completedCount = db.prepare("SELECT COUNT(*) as count FROM exam_tasks WHERE status = 'completed'").get().count;
  const reportCount = db.prepare('SELECT COUNT(*) as count FROM exam_reports').get().count;
  // By factory
  const byFactory = db.prepare(`
    SELECT f.name as factory_name, COUNT(et.id) as task_count
    FROM exam_tasks et
    INNER JOIN users f ON et.factory_id = f.id
    WHERE et.status = 'completed'
    GROUP BY f.id
    ORDER BY task_count DESC
    LIMIT 10
  `).all();
  return { completedCount, reportCount, byFactory };
}
