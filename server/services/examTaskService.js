import { createExamTask, findPushedTasksByFactory, findExamTaskDetailById, findExamTaskEmployees } from '../repositories/examTaskRepo.js';
import { findEmployeesByIds } from '../repositories/employeeRepo.js';

/** Push exam task from factory */
export function pushExamTask(factoryId, { health_agent_id, factory_contact_id, employee_ids }) {
  if (!health_agent_id) throw new Error('请选择体检对接人');
  if (!employee_ids || employee_ids.length === 0) throw new Error('请选择体检员工');

  // Validate employee_ids belong to this factory
  const employees = findEmployeesByIds(employee_ids);
  const invalidEmployees = employees.filter((e) => e.factory_id !== factoryId);
  if (invalidEmployees.length > 0) {
    throw new Error('存在不属于本工厂的员工');
  }

  const taskId = createExamTask({
    factoryId,
    healthAgentId: health_agent_id,
    factoryContactId: factory_contact_id,
    employeeIds: employee_ids,
  });

  return findExamTaskDetailById(taskId);
}

/** Get pushed tasks for factory */
export function getPushedTasks(factoryId, { page, pageSize }) {
  return findPushedTasksByFactory(factoryId, { page, pageSize });
}

/** Get exam task detail */
export function getExamTaskDetail(id) {
  const task = findExamTaskDetailById(id);
  if (!task) throw new Error('任务不存在');
  const employees = findExamTaskEmployees(id);
  return { ...task, employees };
}
