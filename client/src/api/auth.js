import apiClient from './client';

/** Factory login */
export function factoryLogin(username, password) {
  return apiClient.post('/auth/factory-login', { username, password });
}

/** Send SMS code to health agent */
export function agentSendCode(phone) {
  return apiClient.post('/auth/agent-send-code', { phone });
}

/** Health agent login */
export function agentLogin(phone, code) {
  return apiClient.post('/auth/agent-login', { phone, code });
}

/** C-unit login */
export function cunitLogin(username, password) {
  return apiClient.post('/auth/cunit-login', { username, password });
}

/** Get current user info */
export function getMe() {
  return apiClient.get('/auth/me');
}
