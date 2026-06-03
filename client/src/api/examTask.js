import apiClient from './client';

/** Push exam task */
export function pushExamTask(data) {
  return apiClient.post('/exam-tasks/push', data);
}

/** Get pushed tasks (factory) */
export function getPushedTasks({ page = 1, pageSize = 20 } = {}) {
  return apiClient.get('/exam-tasks/pushed', { params: { page, pageSize } });
}

/** Get pending tasks (health agent) */
export function getPendingTasks({ page = 1, pageSize = 20 } = {}) {
  return apiClient.get('/exam-tasks/pending', { params: { page, pageSize } });
}

/** Get task detail */
export function getExamTaskDetail(id) {
  return apiClient.get(`/exam-tasks/${id}`);
}

/** Agent fetch task */
export function fetchExamTask(id) {
  return apiClient.post(`/exam-tasks/${id}/fetch`);
}

/** Agent complete task */
export function completeExamTask(id) {
  return apiClient.post(`/exam-tasks/${id}/complete`);
}

/** Get agent history */
export function getAgentHistory({ page = 1, pageSize = 20 } = {}) {
  return apiClient.get('/exam-tasks/history', { params: { page, pageSize } });
}

/** Get C-unit completed tasks */
export function getCUnitTasks({ page = 1, pageSize = 20 } = {}) {
  return apiClient.get('/exam-tasks/cunit-list', { params: { page, pageSize } });
}
