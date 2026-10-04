import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DriverDashboard } from './pages/driver/DriverDashboard';
import { NavigationPage } from './pages/driver/NavigationPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { TechnicianDashboard } from './pages/technician/TechnicianDashboard';
import { useRole } from './context/RoleContext';

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="w-full h-full bg-background p-8 flex flex-col items-center justify-center text-primary-muted">
      <h1 className="text-2xl font-light tracking-widest mb-2">{title.toUpperCase()}</h1>
      <p className="text-sm">Module coming soon</p>
    </div>
  );
}

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
          <Route path="vehicle" element={<PlaceholderPage title="Vehicle" />} />
          <Route path="trips" element={<PlaceholderPage title="Trips" />} />
          <Route path="alerts" element={<PlaceholderPage title="Alerts" />} />
          <Route path="*" element={<Navigate to="/driver" replace />} />
        </Route>
        
        <Route path="admin">
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<PlaceholderPage title="Users" />} />
          <Route path="system" element={<PlaceholderPage title="System" />} />
          <Route path="software" element={<PlaceholderPage title="Software" />} />
          <Route path="alerts" element={<PlaceholderPage title="Alerts" />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
        
        <Route path="tech">
          <Route index element={<TechnicianDashboard />} />
          <Route path="diagnostics" element={<PlaceholderPage title="Diagnostics" />} />
          <Route path="issues" element={<PlaceholderPage title="Issues" />} />
          <Route path="tests" element={<PlaceholderPage title="Tests" />} />
          <Route path="maintenance" element={<PlaceholderPage title="Maintenance" />} />
          <Route path="*" element={<Navigate to="/tech" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
