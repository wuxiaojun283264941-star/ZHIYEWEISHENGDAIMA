import apiClient from './client';

/** Get position tree */
export function getPositionTree() {
  return apiClient.get('/positions');
}

/** Create position node */
export function createPosition(data) {
  return apiClient.post('/positions', data);
}

/** Update position node */
export function updatePosition(id, data) {
  return apiClient.put(`/positions/${id}`, data);
}

/** Delete position node */
export function deletePosition(id) {
  return apiClient.delete(`/positions/${id}`);
}

/** Get hazards bound to position */
export function getPositionHazards(positionId) {
  return apiClient.get(`/positions/${positionId}/hazards`);
}

/** Bind hazards to position */
export function bindPositionHazards(positionId, hazardFactorIds) {
  return apiClient.post(`/positions/${positionId}/hazards`, { hazard_factor_ids: hazardFactorIds });
}

/** Unbind hazard from position */
export function unbindPositionHazard(positionId, hazardId) {
  return apiClient.delete(`/positions/${positionId}/hazards/${hazardId}`);
}
