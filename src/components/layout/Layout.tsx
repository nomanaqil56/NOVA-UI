import { Sidebar } from './Sidebar';
import { Outlet } from 'react-router-dom';
import { VehicleConnectionOverlay } from './VehicleConnectionOverlay';

export const Layout = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-primary">
      <Sidebar />
      <main className="flex-1 relative overflow-hidden">
        <Outlet />
      </main>
      <VehicleConnectionOverlay />
    </div>
  );
};
