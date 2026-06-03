import { findEmployeesByFactory, findEmployeeById, createEmployee, updateEmployee, deleteEmployee } from '../repositories/employeeRepo.js';

/** Get paginated employees for a factory */
export function getEmployees(factoryId, { page, pageSize, keyword }) {
  return findEmployeesByFactory(factoryId, { page, pageSize, keyword });
}

/** Get single employee */
export function getEmployee(id, factoryId) {
  const employee = findEmployeeById(id);
  if (!employee || employee.factory_id !== factoryId) {
    throw new Error('员工不存在');
  }
  return employee;
}

/** Create employee */
export function addEmployee(factoryId, data) {
  if (!data.name || !data.idCard) {
    throw new Error('姓名和身份证号不能为空');
  }
  return createEmployee(factoryId, data);
}

/** Update employee */
export function editEmployee(id, factoryId, data) {
  if (!data.name || !data.idCard) {
    throw new Error('姓名和身份证号不能为空');
  }
  const existing = findEmployeeById(id);
  if (!existing || existing.factory_id !== factoryId) {
    throw new Error('员工不存在');
  }
  return updateEmployee(id, factoryId, data);
}

/** Remove employee */
export function removeEmployee(id, factoryId) {
  const deleted = deleteEmployee(id, factoryId);
  if (!deleted) {
    throw new Error('员工不存在或无权删除');
  }
  return true;
}
