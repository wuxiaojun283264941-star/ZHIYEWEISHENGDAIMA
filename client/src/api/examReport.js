import apiClient from './client';

/** Upload exam report */
export function uploadExamReport(formData) {
  return apiClient.post('/exam-reports/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
}

/** Get reports by task */
export function getTaskReports(taskId) {
  return apiClient.get(`/exam-reports/task/${taskId}`);
}

/** Get report by id */
export function getReport(id) {
  return apiClient.get(`/exam-reports/${id}`);
}

/** Get report download URL with auth token for browser direct navigation */
export function getReportDownloadUrl(id) {
  const token = localStorage.getItem('token');
  return `/api/exam-reports/${id}/download?token=${encodeURIComponent(token || '')}`;
}

/** Delete report */
export function deleteReport(id) {
  return apiClient.delete(`/exam-reports/${id}`);
}
