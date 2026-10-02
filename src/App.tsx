import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DriverDashboard } from './pages/driver/DriverDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { TechnicianDashboard } from './pages/technician/TechnicianDashboard';
import { useRole } from './context/RoleContext';

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
          <Route index element={<DriverDashboard />} />
          <Route path="*" element={<Navigate to="/driver" replace />} />
        </Route>
        
        <Route path="admin">
          <Route index element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
        
        <Route path="tech">
          <Route index element={<TechnicianDashboard />} />
          <Route path="*" element={<Navigate to="/tech" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
