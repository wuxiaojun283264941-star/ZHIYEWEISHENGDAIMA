import apiClient from './client';

/** Admin login */
export function adminLogin(username, password) {
  return apiClient.post('/auth/admin-login', { username, password });
}

/** Factory login */
export function factoryLogin(username, password) {
  return apiClient.post('/auth/factory-login', { username, password });
}

/** Health agent (体检) login */
export function agentLogin(username, password) {
  return apiClient.post('/auth/agent-login', { username, password });
}

/** C-unit (卫生托管) login */
export function cunitLogin(username, password) {
  return apiClient.post('/auth/cunit-login', { username, password });
}

/** Get current user info */
export function getMe() {
  return apiClient.get('/auth/me');
}
