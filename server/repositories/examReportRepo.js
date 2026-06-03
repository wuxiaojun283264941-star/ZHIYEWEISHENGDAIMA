import { getDB } from '../db/init.js';

/** Create exam report */
export function createExamReport({ examTaskId, employeeId, filePath, originalName, fileSize }) {
  const db = getDB();
  const result = db.prepare(
    `INSERT INTO exam_reports (exam_task_id, employee_id, file_path, original_name, file_size) VALUES (?, ?, ?, ?, ?)`
  ).run(examTaskId, employeeId, filePath, originalName, fileSize);

  // Update employee exam status to examined
  db.prepare(
    `UPDATE exam_task_employees SET exam_status = 'examined' WHERE exam_task_id = ? AND employee_id = ?`
  ).run(examTaskId, employeeId);

  return { id: result.lastInsertRowid, exam_task_id: examTaskId, employee_id: employeeId, file_path: filePath, original_name: originalName, file_size: fileSize };
}

/** Find reports by task id */
export function findReportsByTaskId(taskId) {
  const db = getDB();
  return db.prepare(`
    SELECT er.*, e.name as employee_name, e.id_card
    FROM exam_reports er
    INNER JOIN employees e ON er.employee_id = e.id
    WHERE er.exam_task_id = ?
    ORDER BY er.uploaded_at DESC
  `).all(taskId);
}

/** Find report by id */
export function findReportById(id) {
  const db = getDB();
  return db.prepare(`
    SELECT er.*, e.name as employee_name, e.id_card, et.factory_id
    FROM exam_reports er
    INNER JOIN employees e ON er.employee_id = e.id
    INNER JOIN exam_tasks et ON er.exam_task_id = et.id
    WHERE er.id = ?
  `).get(id);
}

/** Delete report by id */
export function deleteReport(id) {
  const db = getDB();
  const report = findReportById(id);
  if (!report) return null;
  const result = db.prepare('DELETE FROM exam_reports WHERE id = ?').run(id);

  // Check if all employees in the task are still examined; if not, revert status
  const remaining = db.prepare(
    `SELECT COUNT(*) as count FROM exam_reports WHERE exam_task_id = ? AND employee_id = ?`
  ).get(report.exam_task_id, report.employee_id);
  if (remaining.count === 0) {
    db.prepare(
      `UPDATE exam_task_employees SET exam_status = 'pending' WHERE exam_task_id = ? AND employee_id = ?`
    ).run(report.exam_task_id, report.employee_id);
  }

  return report;
}

/** Find reports by employee id across all tasks */
export function findReportsByEmployeeId(employeeId) {
  const db = getDB();
  return db.prepare(`
    SELECT er.*, et.id as task_id, et.status as task_status, et.factory_id
    FROM exam_reports er
    INNER JOIN exam_tasks et ON er.exam_task_id = et.id
    WHERE er.employee_id = ?
    ORDER BY er.uploaded_at DESC
  `).all(employeeId);
}
