import apiClient from './client';

/** Get employees with pagination */
export function getEmployees({ page = 1, pageSize = 20, keyword = '' } = {}) {
  return apiClient.get('/employees', { params: { page, pageSize, keyword } });
}

/** Get single employee */
export function getEmployee(id) {
  return apiClient.get(`/employees/${id}`);
}

/** Create employee */
export function createEmployee(data) {
  return apiClient.post('/employees', data);
}

/** Update employee */
export function updateEmployee(id, data) {
  return apiClient.put(`/employees/${id}`, data);
}

/** Delete employee */
export function deleteEmployee(id) {
  return apiClient.delete(`/employees/${id}`);
}
