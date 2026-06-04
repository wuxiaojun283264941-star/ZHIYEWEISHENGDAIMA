import apiClient from './client';

/** Get admin overview stats */
export function getAdminStats() {
  return apiClient.get('/admin/stats');
}

/** Get all factories */
export function getAdminFactories() {
  return apiClient.get('/admin/factories');
}

/** Get all health agents */
export function getAdminAgents() {
  return apiClient.get('/admin/agents');
}

/** Get all C-units */
export function getAdminCUnits() {
  return apiClient.get('/admin/cunits');
}

/** Get all tasks (admin view) */
export function getAdminTasks({ page = 1, pageSize = 20 } = {}) {
  return apiClient.get('/admin/tasks', { params: { page, pageSize } });
}
