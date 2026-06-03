import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRouter from './components/RoleRouter';
import Login from './pages/Login';
import FactoryDashboard from './pages/factory/Dashboard';
import EmployeeList from './pages/factory/EmployeeList';
import EmployeeForm from './pages/factory/EmployeeForm';
import ContactManage from './pages/factory/ContactManage';
import PushHistory from './pages/factory/PushHistory';
import HealthAgentDashboard from './pages/healthAgent/Dashboard';
import TaskList from './pages/healthAgent/TaskList';
import TaskDetail from './pages/healthAgent/TaskDetail';
import History from './pages/healthAgent/History';
import CUnitDashboard from './pages/cUnit/Dashboard';
import ReportList from './pages/cUnit/ReportList';
import EmployeeDetail from './pages/cUnit/EmployeeDetail';
import ReportViewer from './pages/cUnit/ReportViewer';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><RoleRouter /></ProtectedRoute>} />

      {/* Factory routes */}
      <Route path="/factory" element={<ProtectedRoute role="factory"><FactoryDashboard /></ProtectedRoute>} />
      <Route path="/factory/employees" element={<ProtectedRoute role="factory"><EmployeeList /></ProtectedRoute>} />
      <Route path="/factory/employees/new" element={<ProtectedRoute role="factory"><EmployeeForm /></ProtectedRoute>} />
      <Route path="/factory/employees/:id/edit" element={<ProtectedRoute role="factory"><EmployeeForm /></ProtectedRoute>} />
      <Route path="/factory/contacts" element={<ProtectedRoute role="factory"><ContactManage /></ProtectedRoute>} />
      <Route path="/factory/push-history" element={<ProtectedRoute role="factory"><PushHistory /></ProtectedRoute>} />

      {/* Health Agent routes */}
      <Route path="/health-agent" element={<ProtectedRoute role="health_agent"><HealthAgentDashboard /></ProtectedRoute>} />
      <Route path="/health-agent/tasks" element={<ProtectedRoute role="health_agent"><TaskList /></ProtectedRoute>} />
      <Route path="/health-agent/tasks/:id" element={<ProtectedRoute role="health_agent"><TaskDetail /></ProtectedRoute>} />
      <Route path="/health-agent/history" element={<ProtectedRoute role="health_agent"><History /></ProtectedRoute>} />

      {/* C-Unit routes */}
      <Route path="/cunit" element={<ProtectedRoute role="cunit"><CUnitDashboard /></ProtectedRoute>} />
      <Route path="/cunit/reports" element={<ProtectedRoute role="cunit"><ReportList /></ProtectedRoute>} />
      <Route path="/cunit/employees/:id" element={<ProtectedRoute role="cunit"><EmployeeDetail /></ProtectedRoute>} />
      <Route path="/cunit/reports/:id/view" element={<ProtectedRoute role="cunit"><ReportViewer /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
