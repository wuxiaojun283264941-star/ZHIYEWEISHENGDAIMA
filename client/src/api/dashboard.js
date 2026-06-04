import apiClient from './client';

/** Get admin stats */
export function getAdminStats() {
  return apiClient.get('/dashboard/admin');
}

/** Get factory stats */
export function getFactoryStats() {
  return apiClient.get('/dashboard/factory');
}

/** Get health agent stats */
export function getHealthAgentStats() {
  return apiClient.get('/dashboard/health-agent');
}

/** Get C-unit stats */
export function getCUnitStats() {
  return apiClient.get('/dashboard/c-unit');
}
