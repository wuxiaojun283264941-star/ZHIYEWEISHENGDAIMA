import {
  getAdminDashboardStats, getFactoryDashboardStats,
  getHealthAgentDashboardStats, getCUnitDashboardStats,
} from '../repositories/dashboardRepo.js';

/** Get dashboard stats based on role */
export function getDashboard(role, userId) {
  switch (role) {
    case 'admin':
      return getAdminDashboardStats();
    case 'factory':
      return getFactoryDashboardStats(userId);
    case 'health_agent':
      return getHealthAgentDashboardStats(userId);
    case 'c_unit':
      return getCUnitDashboardStats();
    default:
      throw new Error('无效的角色');
  }
}
