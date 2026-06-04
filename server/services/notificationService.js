/**
 * Notification Service
 * Mock implementation - in production would integrate with SMS/email providers
 */

/** Send notification when exam task is pushed */
export function notifyTaskPushed(agentPhone, factoryName, employeeCount) {
  console.log(`[NOTIFICATION] 体检任务推送通知 -> ${agentPhone}: ${factoryName} 推送了 ${employeeCount} 名员工的体检任务`);
  return true;
}

/** Send notification when task is completed */
export function notifyTaskCompleted(factoryName, agentName) {
  console.log(`[NOTIFICATION] 任务完成通知 -> ${factoryName}: ${agentName} 已完成体检推送至卫生托管`);
  return true;
}

/** Send notification when reports are uploaded */
export function notifyReportsUploaded(employeeName, taskName) {
  console.log(`[NOTIFICATION] 报告上传通知 -> ${employeeName} 的体检报告已上传至任务 ${taskName}`);
  return true;
}
