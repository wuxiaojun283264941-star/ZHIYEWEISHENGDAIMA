import path from 'path';
import {
  createExamReport, findReportsByTaskId, findReportById, deleteReport as deleteReportRepo
} from '../repositories/examReportRepo.js';
import { findExamTaskById, findExamTaskEmployees, updateTaskToCompleted } from '../repositories/examTaskRepo.js';
import { generateReportFilename, validateReportFile, saveUploadedFile, deleteFile, getReportFilePath } from '../utils/fileUpload.js';

/** Upload exam report */
export async function uploadExamReport({ taskId, employeeId, file }) {
  // Validate task
  const task = findExamTaskById(taskId);
  if (!task) throw new Error('体检任务不存在');
  if (task.status === 'completed') throw new Error('任务已完成，无法上传报告');

  // Validate employee belongs to this task
  const taskEmployees = findExamTaskEmployees(taskId);
  const empInTask = taskEmployees.find((e) => e.employee_id === employeeId);
  if (!empInTask) throw new Error('该员工不在此体检任务中');

  // Validate file
  validateReportFile(file);

  // Save file
  const filename = generateReportFilename(taskId, employeeId, file.filename);
  const filePath = await saveUploadedFile(file, filename);

  // Create record
  const report = createExamReport({
    examTaskId: taskId,
    employeeId,
    filePath: filename,
    originalName: file.filename,
    fileSize: file.filesize,
  });

  return report;
}

/** Get reports for a task */
export function getTaskReports(taskId) {
  return findReportsByTaskId(taskId);
}

/** Get report by id */
export function getReport(id) {
  const report = findReportById(id);
  if (!report) throw new Error('报告不存在');
  return report;
}

/** Get report file path for download */
export function getReportDownloadPath(id) {
  const report = findReportById(id);
  if (!report) throw new Error('报告不存在');
  return getReportFilePath(report.file_path);
}

/** Delete report */
export function removeReport(id) {
  const report = deleteReportRepo(id);
  if (!report) throw new Error('报告不存在');
  // Try to delete the file from disk
  deleteFile(getReportFilePath(report.file_path));
  return true;
}
