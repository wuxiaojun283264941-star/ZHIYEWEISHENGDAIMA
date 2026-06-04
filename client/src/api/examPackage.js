import apiClient from './client';

/** Get packages */
export function getPackages() {
  return apiClient.get('/exam-packages');
}

/** Create package */
export function createPackage(data) {
  return apiClient.post('/exam-packages', data);
}

/** Update package */
export function updatePackage(id, data) {
  return apiClient.put(`/exam-packages/${id}`, data);
}

/** Delete package */
export function deletePackage(id) {
  return apiClient.delete(`/exam-packages/${id}`);
}
