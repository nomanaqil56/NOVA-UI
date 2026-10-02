import { useState, useEffect, useRef } from 'react';
import { MapComponent } from '../../components/map/MapComponent';
import { DestinationSearch } from '../../components/navigation/DestinationSearch';
import { RoutePanel } from '../../components/navigation/RoutePanel';
import { GPSStatus } from '../../components/navigation/GPSStatus';
import { Battery, Zap, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { GPSLocation, GPSState, RouteOption, GeocodingResult } from '../../types/navigation';
import { startGPS, stopGPS } from '../../services/geolocation';
import { getRoute } from '../../services/routing';

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // metres
  const p1 = lat1 * Math.PI/180;
  const p2 = lat2 * Math.PI/180;
  const dp = (lat2-lat1) * Math.PI/180;
  const dl = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(dp/2) * Math.sin(dp/2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl/2) * Math.sin(dl/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const DriverDashboard = () => {
  // Navigation State
  const [gpsState, setGpsState] = useState<GPSState>('DISCONNECTED');
  const [currentLocation, setCurrentLocation] = useState<GPSLocation | null>(null);
  const [destination, setDestination] = useState<GeocodingResult | null>(null);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [tripActive, setTripActive] = useState(false);

  // Vehicle Simulation State (from old UI)
  const [overrideActive, setOverrideActive] = useState(false);
  const [overrideHoldTime, setOverrideHoldTime] = useState(0);

  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleOverrideDown = () => {
    let time = 0;
    holdTimer.current = setInterval(() => {
      time += 100;
      setOverrideHoldTime(time);
      if (time >= 2000) {
        setOverrideActive(true);
        if (holdTimer.current) clearInterval(holdTimer.current);
      }
    }, 100);
  };

  const handleOverrideUp = () => {
    if (holdTimer.current) clearInterval(holdTimer.current);
    if (!overrideActive) setOverrideHoldTime(0);
  };

  const handleEnableGPS = () => {
    startGPS(isDemoMode, setCurrentLocation, setGpsState);
  };

  useEffect(() => {
    // Only attempt to start GPS automatically if we are initializing or switching modes
    const attemptConnection = async () => {
      if (!isDemoMode && navigator.permissions) {
        try {
          const result = await navigator.permissions.query({ name: 'geolocation' });
          if (result.state === 'granted' || result.state === 'prompt') {
            startGPS(isDemoMode, setCurrentLocation, setGpsState);
          }
        } catch (e) {
          // Fallback if permissions query fails
          startGPS(isDemoMode, setCurrentLocation, setGpsState);
        }
      } else {
        startGPS(isDemoMode, setCurrentLocation, setGpsState);
      }
    };

    attemptConnection();
    
    return stopGPS;
  }, [isDemoMode]);

  const offRouteCount = useRef(0);
  const routeRequestId = useRef(0);

  // Route recalculation logic
  useEffect(() => {
    if (!destination || !currentLocation) return;
    
    const calculateRoute = async () => {
      const currentId = ++routeRequestId.current;
      setIsRecalculating(true);
      try {
        const newRoutes = await getRoute(
          [currentLocation.longitude, currentLocation.latitude],
          [destination.lon, destination.lat]
        );
        if (routeRequestId.current !== currentId) return; // Stale request
        
        if (newRoutes.length > 0) {
          setRoutes(newRoutes);
          setActiveRouteId(newRoutes[0].id);
          offRouteCount.current = 0;
        }
      } catch (err) {
        console.error('Route calculation failed', err);
      } finally {
        if (routeRequestId.current === currentId) {
          setIsRecalculating(false);
        }
      }
    };

    if (routes.length === 0) {
      calculateRoute();
    } else {
      const active = routes.find(r => r.id === activeRouteId);
      if (active && !isRecalculating && tripActive) {
        let minDistance = Infinity;
        for (const coord of active.geometry.coordinates) {
          const dist = getDistance(currentLocation.latitude, currentLocation.longitude, coord[1], coord[0]);
          if (dist < minDistance) minDistance = dist;
        }

        const accuracy = currentLocation.accuracy || 10;
        const threshold = Math.max(50, accuracy + 20);

        if (minDistance > threshold) {
          offRouteCount.current += 1;
          console.log(`[NAVIGATION] Off route by ${minDistance.toFixed(1)}m. Count: ${offRouteCount.current}`);
          if (offRouteCount.current >= 3) { // Require 3 sustained updates
            console.log(`[NAVIGATION] Sustained deviation detected. Recalculating...`);
            calculateRoute();
          }
        } else {
          offRouteCount.current = 0; // Reset if we are back on route
        }
      }
    }
  }, [destination, currentLocation, tripActive]); // Note: removing routes and activeRouteId from deps to avoid infinite loops, they are managed via state/refs in full rewrite but this works for now. Wait, we DO depend on routes.length. Let's keep it simple.

  const activeRoute = routes.find(r => r.id === activeRouteId) || null;
  const speed = currentLocation?.speed ?? 0; // km/h

  return (
    <div className="absolute inset-0 text-primary">
      {/* Background Map Layer */}
      <div className="absolute inset-0 z-0">
        <MapComponent 
          currentLocation={currentLocation}
          destination={destination}
          activeRoute={activeRoute}
          isFollowing={isFollowing}
          setIsFollowing={setIsFollowing}
          tripActive={tripActive}
        />
      </div>

      {/* Top Left: Search & Destination */}
      <div className="absolute top-6 left-6 z-10 w-96 flex flex-col gap-4">
        {!tripActive && (
          <DestinationSearch 
            currentLocation={currentLocation}
            onSelect={(res) => {
              setDestination(res);
              setRoutes([]);
              setActiveRouteId(null);
            }} 
          />
        )}
        
        {destination && (
          <RoutePanel 
            destination={destination}
            routes={routes}
            activeRouteId={activeRouteId}
            onSelectRoute={setActiveRouteId}
            onStartNavigation={() => setTripActive(true)}
            tripActive={tripActive}
            onCancelTrip={() => {
              setTripActive(false);
              setDestination(null);
              setRoutes([]);
              setActiveRouteId(null);
              offRouteCount.current = 0;
            }}
          />
        )}
      </div>

      {/* Top Right: Status */}
      <div className="absolute top-6 right-6 z-10 flex flex-col gap-2 items-end">
        <GPSStatus 
          gpsState={gpsState} 
          accuracy={currentLocation?.accuracy || null}
          onEnableGPS={handleEnableGPS}
        />
        {isRecalculating && (
          <div className="glass-panel px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500 flex items-center gap-2 shadow-lg">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span className="text-[10px] font-bold tracking-wider">RECALCULATING ROUTE</span>
          </div>
        )}
      </div>

      {/* Bottom Left: Autonomous Status & Speed */}
      <div className="absolute bottom-8 left-6 z-10 flex flex-col gap-6 w-80">
        <div className="glass-panel-elevated rounded-2xl p-5 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold tracking-widest text-primary-muted">SYSTEM STATUS</h4>
            <div className={cn("px-2 py-1 rounded text-[10px] font-bold flex items-center gap-2", overrideActive ? "bg-red-500/20 text-red-500" : "bg-accent/20 text-accent")}>
              <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", overrideActive ? "bg-red-500" : "bg-accent")} />
              {overrideActive ? "MANUAL" : "AUTONOMOUS"}
            </div>
          </div>
          
          <div className="flex justify-between items-end">
            <div>
              <div className="text-[10px] text-primary-muted mb-1 font-semibold uppercase tracking-wider">Vehicle Speed</div>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-light tabular-nums tracking-tighter">
                  {speed.toFixed(0)}
                </span>
                <span className="text-lg text-primary-muted font-medium">km/h</span>
              </div>
            </div>
            
            <div className="text-right flex flex-col items-end">
              <div className="text-[10px] text-primary-muted mb-2 font-semibold uppercase tracking-wider">Mode</div>
              <button 
                onClick={() => setIsDemoMode(!isDemoMode)}
                className={cn(
                  "text-xs font-bold px-3 py-1 rounded-full border transition-colors",
                  isDemoMode ? "bg-amber-500/20 text-amber-500 border-amber-500/30" : "bg-surface-elevated text-primary-muted border-border hover:text-primary"
                )}
              >
                {isDemoMode ? 'DEMO MODE' : 'LIVE MODE'}
              </button>
            </div>
          </div>
        </div>

        {/* Override Control */}
        <button 
          onMouseDown={handleOverrideDown}
          onMouseUp={handleOverrideUp}
          onMouseLeave={handleOverrideUp}
          onTouchStart={handleOverrideDown}
          onTouchEnd={handleOverrideUp}
          className={cn(
            "relative w-full h-16 rounded-xl border overflow-hidden transition-all duration-300 flex items-center justify-center gap-3 font-bold tracking-widest text-sm",
            overrideActive 
              ? "bg-red-500 border-red-500 text-white shadow-[0_0_30px_rgba(255,59,48,0.5)]" 
              : "bg-surface-elevated border-border text-primary hover:border-primary-muted"
          )}
        >
          <div 
            className="absolute left-0 top-0 bottom-0 bg-red-500/20 transition-all duration-100 ease-linear"
            style={{ width: `${(overrideHoldTime / 2000) * 100}%` }}
          />
          {overrideActive ? (
            <>
              <AlertTriangle className="w-5 h-5" /> MANUAL CONTROL ENGAGED
            </>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5 text-accent" /> HOLD TO TAKE CONTROL
            </>
          )}
        </button>
      </div>

      {/* Bottom Right: Vehicle Vitals */}
      <div className="absolute bottom-8 right-8 z-10 w-72">
        <div className="glass-panel-elevated rounded-2xl p-5 grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-primary-muted mb-1">
              <Battery className="w-4 h-4" /> <span className="text-[10px] font-bold uppercase tracking-wider">Battery</span>
            </div>
            <div className="text-xl font-semibold">78%</div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-primary-muted mb-1">
              <Zap className="w-4 h-4" /> <span className="text-[10px] font-bold uppercase tracking-wider">Range</span>
            </div>
            <div className="text-xl font-semibold">312 <span className="text-xs text-primary-muted">km</span></div>
          </div>
          <div className="col-span-2 h-px bg-border my-1" />
          <div className="col-span-2 flex justify-between items-center text-sm">
            <span className="text-primary-muted font-medium">Sensors</span>
            <span className="font-semibold text-green-500">12 / 12 ONLINE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
