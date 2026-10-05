import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DriverDashboard } from './pages/driver/DriverDashboard';
import { NavigationPage } from './pages/driver/NavigationPage';
import { VehiclePage } from './pages/driver/VehiclePage';
import { TripsPage } from './pages/driver/TripsPage';
import { AlertsPage } from './pages/driver/AlertsPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UsersPage } from './pages/admin/UsersPage';
import { SystemPage } from './pages/admin/SystemPage';
import { SoftwarePage } from './pages/admin/SoftwarePage';
import { TechnicianDashboard } from './pages/technician/TechnicianDashboard';
import { DiagnosticsPage } from './pages/technician/DiagnosticsPage';
import { IssuesPage } from './pages/technician/IssuesPage';
import { TestsPage } from './pages/technician/TestsPage';
import { MaintenancePage } from './pages/technician/MaintenancePage';
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
          <Route element={<DriverDashboard />}>
            <Route index element={null} />
            <Route path="nav" element={<NavigationPage />} />
          </Route>
          <Route path="vehicle" element={<VehiclePage />} />
          <Route path="trips" element={<TripsPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="*" element={<Navigate to="/driver" replace />} />
        </Route>
        
        <Route path="admin">
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="system" element={<SystemPage />} />
          <Route path="software" element={<SoftwarePage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
        
        <Route path="tech">
          <Route index element={<TechnicianDashboard />} />
          <Route path="diagnostics" element={<DiagnosticsPage />} />
          <Route path="issues" element={<IssuesPage />} />
          <Route path="tests" element={<TestsPage />} />
          <Route path="maintenance" element={<MaintenancePage />} />
          <Route path="*" element={<Navigate to="/tech" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
