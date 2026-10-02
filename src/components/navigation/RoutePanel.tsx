import { MapPin } from 'lucide-react';
import type { RouteOption } from '../../types/navigation';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface RoutePanelProps {
  destination: { name: string } | null;
  routes: RouteOption[];
  activeRouteId: string | null;
  onSelectRoute: (id: string) => void;
}

export const RoutePanel = ({ destination, routes, activeRouteId, onSelectRoute }: RoutePanelProps) => {
  if (!destination || routes.length === 0) return null;

  const activeRoute = routes.find(r => r.id === activeRouteId) || routes[0];
  
  // Convert meters to km
  const distKm = (activeRoute.distance / 1000).toFixed(1);
  // Convert seconds to min
  const durationMin = Math.round(activeRoute.duration / 60);

  // ETA Calculation
  const now = new Date();
  now.setMinutes(now.getMinutes() + durationMin);
  const eta = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel-elevated rounded-2xl p-5 border-l-2 border-l-accent w-full mt-4"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold mb-1 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-accent" /> {destination.name}
          </h3>
          <p className="text-primary-muted text-sm">Current Location → {destination.name} · {distKm} km</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-accent text-shadow-glow">
            {durationMin}<span className="text-sm font-medium text-primary ml-1">min</span>
          </div>
          <div className="text-primary-muted text-sm mt-1">ETA {eta}</div>
        </div>
      </div>
      
      <div className="flex gap-2">
        {routes.map(r => (
          <button 
            key={r.id}
            onClick={() => onSelectRoute(r.id)}
            className={cn(
              "flex-1 rounded-lg py-2 text-xs font-semibold transition-colors",
              r.id === activeRouteId 
                ? "bg-accent/20 border border-accent/40 text-accent" 
                : "bg-surface/50 border border-border text-primary-muted hover:text-primary hover:bg-surface"
            )}
          >
            {r.name}
          </button>
        ))}
      </div>
    </motion.div>
  );
};
