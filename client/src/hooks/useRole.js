import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

/** Hook to check user role */
export function useRole() {
  const { role, user } = useContext(AuthContext);
  return {
    role,
    user,
    isAdmin: role === 'admin',
    isFactory: role === 'factory',
    isHealthAgent: role === 'health_agent',
    isCUnit: role === 'cunit',
  };
}
