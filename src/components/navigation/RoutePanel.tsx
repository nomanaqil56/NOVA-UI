import { MapPin } from 'lucide-react';
import type { RouteOption, GPSLocation } from '../../types/navigation';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface RoutePanelProps {
  currentLocation?: GPSLocation | null;
  destination: { name: string } | null;
  routes: RouteOption[];
  activeRouteId: string | null;
  onSelectRoute: (id: string) => void;
  onStartNavigation: () => void;
  onCancelTrip: () => void;
  tripActive: boolean;
}

export const RoutePanel = ({ currentLocation, destination, routes, activeRouteId, onSelectRoute, onStartNavigation, onCancelTrip, tripActive }: RoutePanelProps) => {
  if (!destination || routes.length === 0) return null;

  const activeRoute = routes.find(r => r.id === activeRouteId) || routes[0];
  
  let displayDistance = activeRoute.distance;
  let displayDuration = activeRoute.duration;

  if (tripActive && currentLocation) {
    // Isolate ETA calculation so a future routing provider can replace it
    const calculateRemaining = () => {
       const coords = activeRoute.geometry.coordinates;
       if (!coords || coords.length === 0) return { distance: displayDistance, duration: displayDuration };
       
       let closestIdx = 0;
       let minDist = Infinity;
       
       const getDist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
         const R = 6371e3;
         const p1 = lat1 * Math.PI/180;
         const p2 = lat2 * Math.PI/180;
         const dp = (lat2-lat1) * Math.PI/180;
         const dl = (lon2-lon1) * Math.PI/180;
         const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
         return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
       };

       for(let i=0; i<coords.length; i++) {
          const d = getDist(currentLocation.latitude, currentLocation.longitude, coords[i][1], coords[i][0]);
          if(d < minDist) { minDist = d; closestIdx = i; }
       }
       
       let remainingDist = 0;
       for(let i=closestIdx; i<coords.length-1; i++) {
          remainingDist += getDist(coords[i][1], coords[i][0], coords[i+1][1], coords[i+1][0]);
       }
       
       const avgSpeed = activeRoute.distance > 0 ? (activeRoute.distance / activeRoute.duration) : 1;
       return { 
          distance: remainingDist, 
          duration: remainingDist / avgSpeed 
       };
    };

    const remaining = calculateRemaining();
    displayDistance = remaining.distance;
    displayDuration = remaining.duration;
  }

  // Convert meters to km
  const distKm = (displayDistance / 1000).toFixed(1);
  // Convert seconds to min
  const durationMin = Math.max(1, Math.round(displayDuration / 60));

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
      
      {!tripActive ? (
        <div className="flex flex-col gap-3">
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
          <button 
            onClick={onStartNavigation}
            className="w-full py-3 bg-accent/90 hover:bg-accent text-black font-bold tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(0,210,255,0.4)] hover:shadow-[0_0_25px_rgba(0,210,255,0.6)]"
          >
            START NAVIGATION
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button 
            onClick={onCancelTrip}
            className="flex-1 py-3 bg-surface border border-border hover:border-red-500/50 hover:text-red-400 text-primary-muted font-bold tracking-widest rounded-xl transition-all text-xs"
          >
            CANCEL TRIP
          </button>
        </div>
      )}
    </motion.div>
  );
};
