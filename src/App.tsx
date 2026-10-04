import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DriverDashboard } from './pages/driver/DriverDashboard';
import { NavigationPage } from './pages/driver/NavigationPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { TechnicianDashboard } from './pages/technician/TechnicianDashboard';
import { useRole } from './context/RoleContext';

import { ModulePage } from './components/shared/ModulePage';

function App() {
  const { role } = useRole();

  const getRootRedirect = () => {
    switch (role) {
      case 'DRIVER': return <Navigate to="/driver" replace />;
      case 'ADMIN': return <Navigate to="/admin" replace />;
      case 'TECHNICIAN': return <Navigate to="/tech" replace />;
      default: return <Navigate to="/driver" replace />;
    }
  };

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={getRootRedirect()} />
        
        <Route path="driver">
          <Route element={<DriverDashboard />}>
            <Route index element={null} />
            <Route path="nav" element={<NavigationPage />} />
          </Route>
          <Route path="vehicle" element={<ModulePage title="Vehicle" />} />
          <Route path="trips" element={<ModulePage title="Trips" />} />
          <Route path="alerts" element={<ModulePage title="Alerts" />} />
          <Route path="*" element={<Navigate to="/driver" replace />} />
        </Route>
        
        <Route path="admin">
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<ModulePage title="Users" />} />
          <Route path="system" element={<ModulePage title="System" />} />
          <Route path="software" element={<ModulePage title="Software" />} />
          <Route path="alerts" element={<ModulePage title="Alerts" />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
        
        <Route path="tech">
          <Route index element={<TechnicianDashboard />} />
          <Route path="diagnostics" element={<ModulePage title="Diagnostics" />} />
          <Route path="issues" element={<ModulePage title="Issues" />} />
          <Route path="tests" element={<ModulePage title="Tests" />} />
          <Route path="maintenance" element={<ModulePage title="Maintenance" />} />
          <Route path="*" element={<Navigate to="/tech" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
