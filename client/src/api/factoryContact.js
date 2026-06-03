import apiClient from './client';

/** Get factory contacts */
export function getContacts() {
  return apiClient.get('/factory-contacts');
}

/** Create contact */
export function createContact(data) {
  return apiClient.post('/factory-contacts', data);
}

/** Update contact */
export function updateContact(id, data) {
  return apiClient.put(`/factory-contacts/${id}`, data);
}

/** Delete contact */
export function deleteContact(id) {
  return apiClient.delete(`/factory-contacts/${id}`);
}
