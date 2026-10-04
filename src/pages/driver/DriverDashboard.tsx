import { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { MapComponent } from '../../components/map/MapComponent';
import { DestinationSearch } from '../../components/navigation/DestinationSearch';
import { RoutePanel } from '../../components/navigation/RoutePanel';
import { GPSStatus } from '../../components/navigation/GPSStatus';
import { Battery, Zap, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { GPSLocation, GPSState, RouteOption, GeocodingResult } from '../../types/navigation';
import { startGPS, stopGPS } from '../../services/geolocation';
import { getRoute } from '../../services/routing';
import { reverseGeocode } from '../../services/geocoding';

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

const getDistanceToSegment = (lat: number, lon: number, lat1: number, lon1: number, lat2: number, lon2: number) => {
  const x = (lon2 - lon1) * Math.cos((lat1 + lat2) / 2 * Math.PI / 180);
  const y = lat2 - lat1;
  const d2 = x * x + y * y;
  const x0 = (lon - lon1) * Math.cos((lat1 + lat) / 2 * Math.PI / 180);
  const y0 = lat - lat1;
  if (d2 === 0) return getDistance(lat, lon, lat1, lon1);
  let t = (x0 * x + y0 * y) / d2;
  t = Math.max(0, Math.min(1, t));
  const projLon = lon1 + t * (lon2 - lon1);
  const projLat = lat1 + t * (lat2 - lat1);
  return getDistance(lat, lon, projLat, projLon);
};

export const DriverDashboard = () => {
  const location = useLocation();
  const isIndex = location.pathname === '/driver' || location.pathname === '/driver/';

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
  const [pickedLocation, setPickedLocation] = useState<{lat: number, lon: number, name?: string, loading: boolean, result?: GeocodingResult} | null>(null);
  
  const [is3D, setIs3D] = useState(false);
  const [triggerOverview, setTriggerOverview] = useState(0);

  // Vehicle Simulation State (from old UI)
  const [overrideState, setOverrideState] = useState<'AUTONOMOUS' | 'TAKING_CONTROL' | 'MANUAL'>('AUTONOMOUS');
  const [overrideHoldTime, setOverrideHoldTime] = useState(0);

  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const routeAbortController = useRef<AbortController | null>(null);
  const isRecalculatingRef = useRef(false);

  const handleOverrideDown = (e?: React.PointerEvent) => {
    if (e) {
      if (e.pointerId && e.target) (e.target as HTMLElement).setPointerCapture(e.pointerId);
      e.preventDefault();
    }
    setOverrideState('TAKING_CONTROL');
    setOverrideHoldTime(0);
    if (holdTimer.current) clearInterval(holdTimer.current);
    
    let time = 0;
    holdTimer.current = setInterval(() => {
      time += 100;
      setOverrideHoldTime(time);
      if (time >= 2000) {
        setOverrideState('MANUAL');
        if (holdTimer.current) {
          clearInterval(holdTimer.current);
          holdTimer.current = null;
        }
      }
    }, 100);
  };

  const handleOverrideUp = (e?: React.PointerEvent) => {
    if (e) {
      if (e.pointerId && e.target) (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      e.preventDefault();
    }
    if (holdTimer.current) {
      clearInterval(holdTimer.current);
      holdTimer.current = null;
    }
    setOverrideState('AUTONOMOUS');
    setOverrideHoldTime(0);
  };

  useEffect(() => {
    return () => {
      if (holdTimer.current) clearInterval(holdTimer.current);
    };
  }, []);

  useEffect(() => {
    if (holdTimer.current) clearInterval(holdTimer.current);
    setOverrideState('AUTONOMOUS');
    setOverrideHoldTime(0);
  }, [tripActive, activeRouteId]);

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
  const prevDestId = useRef<string | null>(null);

  // Route recalculation logic
  useEffect(() => {
    if (!destination || !currentLocation) return;
    const destId = destination ? `${destination.placeId}-${destination.lat}-${destination.lon}` : null;
    const isNewDest = prevDestId.current !== destId;
    if (isNewDest) {
      prevDestId.current = destId;
    }

    const calculateRoute = async () => {
      const currentId = ++routeRequestId.current;
      isRecalculatingRef.current = true;
      setIsRecalculating(true);
      
      if (routeAbortController.current) {
        routeAbortController.current.abort();
      }
      const abortController = new AbortController();
      routeAbortController.current = abortController;
      
      try {
        const result = await getRoute(
          [currentLocation.longitude, currentLocation.latitude],
          [destination.lon, destination.lat],
          abortController.signal
        );
        if (routeRequestId.current !== currentId) return; // Stale request
        
        if (result.status === 'success' && result.routes.length > 0) {
          setRoutes(result.routes);
          setActiveRouteId(result.routes[0].id);
          offRouteCount.current = 0;
        } else {
          setRoutes([]);
        }
      } catch (err) {
        console.error('Route calculation failed', err);
      } finally {
        if (routeRequestId.current === currentId) {
          isRecalculatingRef.current = false;
          setIsRecalculating(false);
        }
      }
    };

    if (isNewDest) {
      calculateRoute();
    } else {
      const active = routes.find(r => r.id === activeRouteId);
      if (active && !isRecalculatingRef.current && tripActive) {
        let minDistance = Infinity;
        const coords = active.geometry.coordinates;
        for (let i = 0; i < coords.length - 1; i++) {
          const dist = getDistanceToSegment(
            currentLocation.latitude, currentLocation.longitude,
            coords[i][1], coords[i][0],
            coords[i+1][1], coords[i+1][0]
          );
          if (dist < minDistance) minDistance = dist;
        }
        if (coords.length === 1) {
          minDistance = getDistance(currentLocation.latitude, currentLocation.longitude, coords[0][1], coords[0][0]);
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
  }, [destination, currentLocation, tripActive, routes, activeRouteId]); 

  const handleMapClick = async (lat: number, lon: number, featureName?: string) => {
    if (tripActive) return;
    
    setPickedLocation({ lat, lon, name: featureName, loading: true });
    
    if (destination) {
      setDestination(null);
      setRoutes([]);
      setActiveRouteId(null);
    }

    try {
      const result = await reverseGeocode(lat, lon);
      setPickedLocation({ lat, lon, name: result.name, loading: false, result });
    } catch (err) {
      setPickedLocation({ lat, lon, name: 'Selected Location', loading: false, result: {
        placeId: `${lat},${lon}`,
        name: 'Selected Location',
        displayName: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        lat, lon, type: 'coordinate', score: 0, distance: 0
      } });
    }
  };

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
          onMapClick={handleMapClick}
          pickedLocation={pickedLocation}
          is3D={is3D}
          setIs3D={setIs3D}
          triggerOverview={triggerOverview}
        />
      </div>

      <Outlet context={{
        destination, setDestination,
        routes, setRoutes,
        activeRouteId, setActiveRouteId,
        tripActive, setTripActive,
        currentLocation, gpsState, handleEnableGPS,
        speed, overrideActive: overrideState === 'MANUAL', isDemoMode, setIsDemoMode,
        is3D, setIs3D, isFollowing, setIsFollowing,
        triggerOverview: () => setTriggerOverview(Date.now())
      }} />

      {isIndex && (
        <>
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
            currentLocation={currentLocation}
            destination={destination}
            routes={routes}
            activeRouteId={activeRouteId}
            onSelectRoute={setActiveRouteId}
            onStartNavigation={() => setTripActive(true)}
            tripActive={tripActive}
            onCancelTrip={() => {
              if (routeAbortController.current) {
                routeAbortController.current.abort();
              }
              routeRequestId.current += 1; // Invalidate active request
              setTripActive(false);
              setDestination(null);
              setRoutes([]);
              setActiveRouteId(null);
              offRouteCount.current = 0;
              isRecalculatingRef.current = false;
              setIsRecalculating(false);
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

      {/* Picked Location Confirmation */}
      {pickedLocation && !tripActive && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20 w-80 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="glass-panel-elevated rounded-2xl p-5 border border-accent/50 shadow-[0_0_20px_rgba(0,210,255,0.1)] backdrop-blur-md">
            <h4 className="text-[10px] font-bold tracking-widest text-accent mb-3 uppercase">Select Destination</h4>
            {pickedLocation.loading ? (
              <div className="flex items-center gap-3">
                <RefreshCw className="w-4 h-4 animate-spin text-primary-muted" />
                <span className="text-xs font-medium text-primary-muted tracking-wider">Acquiring location...</span>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <div className="font-semibold text-lg text-primary">{pickedLocation.result?.name || pickedLocation.name}</div>
                  <div className="text-xs text-primary-muted">{pickedLocation.result?.displayName || `${pickedLocation.lat.toFixed(4)}, ${pickedLocation.lon.toFixed(4)}`}</div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setPickedLocation(null)}
                    className="flex-1 py-2 rounded-lg border border-border text-primary-muted hover:text-primary hover:bg-surface font-bold text-[10px] tracking-wider transition-colors"
                  >
                    CANCEL
                  </button>
                  <button 
                    onClick={() => {
                      if (pickedLocation.result) {
                        setDestination(pickedLocation.result);
                      }
                      setPickedLocation(null);
                    }}
                    className="flex-1 py-2 rounded-lg bg-accent text-black font-bold text-[10px] tracking-wider hover:bg-[#33dbff] transition-colors shadow-[0_0_15px_rgba(0,210,255,0.3)]"
                  >
                    NAVIGATE HERE
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bottom Left: Autonomous Status & Speed */}
      <div className="absolute bottom-8 left-6 z-10 flex flex-col gap-6 w-80">
        <div className="glass-panel-elevated rounded-2xl p-5 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold tracking-widest text-primary-muted">SYSTEM STATUS</h4>
            <div className={cn("px-2 py-1 rounded text-[10px] font-bold flex items-center gap-2", overrideState === 'MANUAL' ? "bg-red-500/20 text-red-500" : overrideState === 'TAKING_CONTROL' ? "bg-amber-500/20 text-amber-500" : "bg-accent/20 text-accent")}>
              <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", overrideState === 'MANUAL' ? "bg-red-500" : overrideState === 'TAKING_CONTROL' ? "bg-amber-500" : "bg-accent")} />
              {overrideState === 'MANUAL' ? "MANUAL" : overrideState === 'TAKING_CONTROL' ? "TAKING CONTROL..." : "AUTONOMOUS"}
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
                onClick={() => {
                  setIsDemoMode(!isDemoMode);
                  setCurrentLocation(null);
                  setGpsState('DISCONNECTED');
                }}
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
          onPointerDown={handleOverrideDown}
          onPointerUp={handleOverrideUp}
          onPointerLeave={handleOverrideUp}
          className={cn(
            "relative w-full h-16 rounded-xl border overflow-hidden transition-all duration-300 flex items-center justify-center gap-3 font-bold tracking-widest text-sm",
            overrideState === 'MANUAL' 
              ? "bg-red-500 border-red-500 text-white shadow-[0_0_30px_rgba(255,59,48,0.5)]" 
              : "bg-surface-elevated border-border text-primary hover:border-primary-muted touch-none"
          )}
        >
          <div 
            className="absolute left-0 top-0 bottom-0 bg-red-500/20 transition-all duration-100 ease-linear"
            style={{ width: `${(overrideHoldTime / 2000) * 100}%` }}
          />
          {overrideState === 'MANUAL' ? (
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
      </>
      )}
    </div>
  );
};
