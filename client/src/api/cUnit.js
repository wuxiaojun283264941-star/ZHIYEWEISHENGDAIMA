import apiClient from './client';

/** Get C-unit completed tasks */
export function getCUnitTasks({ page = 1, pageSize = 20 } = {}) {
  return apiClient.get('/cunit/tasks', { params: { page, pageSize } });
}

/** Get C-unit task detail */
export function getCUnitTaskDetail(id) {
  return apiClient.get(`/cunit/tasks/${id}`);
}

/** Get employee reports for C-unit */
export function getCUnitEmployeeReports(employeeId) {
  return apiClient.get(`/cunit/employees/${employeeId}/reports`);
}
