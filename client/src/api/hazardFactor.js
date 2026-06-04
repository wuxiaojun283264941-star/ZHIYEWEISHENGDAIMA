import apiClient from './client';

/** Get all hazard factors */
export function getHazardFactors({ category = '', keyword = '' } = {}) {
  return apiClient.get('/hazard-factors', { params: { category, keyword } });
}

/** Get hazard categories */
export function getHazardCategories() {
  return apiClient.get('/hazard-factors/categories');
}

/** Create hazard factor */
export function createHazardFactor(data) {
  return apiClient.post('/hazard-factors', data);
}

/** Update hazard factor */
export function updateHazardFactor(id, data) {
  return apiClient.put(`/hazard-factors/${id}`, data);
}

/** Delete hazard factor */
export function deleteHazardFactor(id) {
  return apiClient.delete(`/hazard-factors/${id}`);
}
