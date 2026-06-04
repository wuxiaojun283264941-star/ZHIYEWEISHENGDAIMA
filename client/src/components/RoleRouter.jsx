import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/** Route user to their role-specific dashboard */
function RoleRouter() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'factory':
      return <Navigate to="/factory" replace />;
    case 'health_agent':
      return <Navigate to="/health-agent" replace />;
    case 'cunit':
      return <Navigate to="/cunit" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

export default RoleRouter;
