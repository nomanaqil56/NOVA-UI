import { useState } from 'react';
import { useRole } from '../../context/RoleContext';
import { cn } from '../../lib/utils';
import { 
  Car, Map, Activity, MapPin, 
  Users, Settings, ShieldAlert, 
  Cpu, Wrench, FileText, CheckSquare
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const ROLE_NAV_ITEMS = {
  DRIVER: [
    { name: 'Overview', path: '/driver', icon: Activity },
    { name: 'Navigation', path: '/driver/nav', icon: Map },
    { name: 'Vehicle', path: '/driver/vehicle', icon: Car },
    { name: 'Trips', path: '/driver/trips', icon: MapPin },
    { name: 'Alerts', path: '/driver/alerts', icon: ShieldAlert },
  ],
  ADMIN: [
    { name: 'Overview', path: '/admin', icon: Activity },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'System', path: '/admin/system', icon: Cpu },
    { name: 'Software', path: '/admin/software', icon: FileText },
    { name: 'Alerts', path: '/admin/alerts', icon: ShieldAlert },
  ],
  TECHNICIAN: [
    { name: 'Overview', path: '/tech', icon: Activity },
    { name: 'Diagnostics', path: '/tech/diagnostics', icon: Cpu },
    { name: 'Issues', path: '/tech/issues', icon: ShieldAlert },
    { name: 'Tests', path: '/tech/tests', icon: CheckSquare },
    { name: 'Maintenance', path: '/tech/maintenance', icon: Wrench },
  ]
};

export const Sidebar = () => {
  const { role, setRole } = useRole();
  const navigate = useNavigate();
  const location = useLocation();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const navItems = ROLE_NAV_ITEMS[role];

  const handleRoleChange = (newRole: 'DRIVER' | 'ADMIN' | 'TECHNICIAN') => {
    setRole(newRole);
    setRoleMenuOpen(false);
    if (newRole === 'DRIVER') navigate('/driver');
    if (newRole === 'ADMIN') navigate('/admin');
    if (newRole === 'TECHNICIAN') navigate('/tech');
  };

  return (
    <div className="w-[88px] h-screen bg-background border-r border-border flex flex-col items-center py-6 z-50 relative">
      
      {/* Role Switcher */}
      <div className="relative mb-8 z-50">
        <button 
          onClick={() => setRoleMenuOpen(!roleMenuOpen)}
          className="w-14 h-14 rounded-full bg-surface-elevated flex items-center justify-center border border-border hover:bg-surface/80 transition-colors"
        >
          {role === 'DRIVER' && <Car className="w-6 h-6 text-accent" />}
          {role === 'ADMIN' && <ShieldAlert className="w-6 h-6 text-accent" />}
          {role === 'TECHNICIAN' && <Wrench className="w-6 h-6 text-accent" />}
        </button>
        
        <AnimatePresence>
          {roleMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="absolute left-[70px] top-0 bg-surface-elevated border border-border rounded-xl shadow-2xl py-2 w-48 z-50"
            >
              <div className="px-4 py-2 text-xs font-semibold text-primary-muted uppercase tracking-wider">
                System Mode
              </div>
              <button 
                onClick={() => handleRoleChange('DRIVER')}
                className={cn("w-full text-left px-4 py-3 hover:bg-surface flex items-center gap-3 transition-colors", role === 'DRIVER' ? 'text-accent' : 'text-primary')}
              >
                <Car className="w-4 h-4" /> Driver
              </button>
              <button 
                onClick={() => handleRoleChange('ADMIN')}
                className={cn("w-full text-left px-4 py-3 hover:bg-surface flex items-center gap-3 transition-colors", role === 'ADMIN' ? 'text-accent' : 'text-primary')}
              >
                <ShieldAlert className="w-4 h-4" /> Admin
              </button>
              <button 
                onClick={() => handleRoleChange('TECHNICIAN')}
                className={cn("w-full text-left px-4 py-3 hover:bg-surface flex items-center gap-3 transition-colors", role === 'TECHNICIAN' ? 'text-accent' : 'text-primary')}
              >
                <Wrench className="w-4 h-4" /> Technician
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-4 w-full px-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path) && item.path !== '/driver' && item.path !== '/admin' && item.path !== '/tech');
          const isExactActive = location.pathname === item.path;
          const active = isActive || isExactActive;
          
          return (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className={cn(
                "relative flex flex-col items-center justify-center w-full aspect-square rounded-2xl transition-all duration-300 group",
                active 
                  ? "bg-accent/10 text-accent" 
                  : "text-primary-muted hover:text-primary hover:bg-surface-elevated"
              )}
            >
              <item.icon className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-medium tracking-wide">{item.name}</span>
              {active && (
                <motion.div 
                  layoutId="activeNav"
                  className="absolute left-0 w-1 h-8 bg-accent rounded-r-full shadow-[0_0_10px_rgba(0,210,255,0.5)]"
                />
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="flex flex-col gap-4 w-full px-3 mt-auto">
        <button className="flex flex-col items-center justify-center w-full aspect-square rounded-2xl text-primary-muted hover:text-primary hover:bg-surface-elevated transition-all">
          <Settings className="w-6 h-6" />
        </button>
        <div className="w-full flex justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-green-500 overflow-hidden relative">
            <img src="https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff" alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </div>
  );
};
