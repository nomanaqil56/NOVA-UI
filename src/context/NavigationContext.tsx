import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { GPSLocation, GPSState, RouteOption, GeocodingResult, NavState, CameraMode, RouteProgress } from '../types/navigation';
import { getRoute } from '../services/routing';
import { startGPS, stopGPS } from '../services/geolocation';

interface NavigationContextType {
  navState: NavState;
  gpsState: GPSState;
  cameraMode: CameraMode;
  currentLocation: GPSLocation | null;
  destination: GeocodingResult | null;
  routes: RouteOption[];
  activeRoute: RouteOption | null;
  routeProgress: RouteProgress | null;
  isDemoMode: boolean;
  is3D: boolean;
  
  startTrip: () => void;
  cancelTrip: () => void;
  finishTrip: () => void;
  setDestination: (dest: GeocodingResult | null) => void;
  setActiveRouteId: (id: string | null) => void;
  setIsDemoMode: (val: boolean) => void;
  setIs3D: (val: boolean) => void;
  setCameraMode: (mode: CameraMode) => void;
  triggerOverview: () => void;
  triggerRecenter: () => void;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export const useNavigation = () => {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider');
  return ctx;
};

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const p1 = lat1 * Math.PI/180;
  const p2 = lat2 * Math.PI/180;
  const dp = (lat2-lat1) * Math.PI/180;
  const dl = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

const getProjectedPointOnSegment = (lat: number, lon: number, lat1: number, lon1: number, lat2: number, lon2: number) => {
  const x = (lon2 - lon1) * Math.cos((lat1 + lat2) / 2 * Math.PI / 180);
  const y = lat2 - lat1;
  const d2 = x * x + y * y;
  if (d2 === 0) return { projLat: lat1, projLon: lon1 };
  
  const x0 = (lon - lon1) * Math.cos((lat1 + lat) / 2 * Math.PI / 180);
  const y0 = lat - lat1;
  const t = Math.max(0, Math.min(1, (x0 * x + y0 * y) / d2));
  
  return {
    projLon: lon1 + t * (lon2 - lon1),
    projLat: lat1 + t * (lat2 - lat1)
  };
};

const getDistanceToSegment = (lat: number, lon: number, lat1: number, lon1: number, lat2: number, lon2: number) => {
  const { projLat, projLon } = getProjectedPointOnSegment(lat, lon, lat1, lon1, lat2, lon2);
  return getDistance(lat, lon, projLat, projLon);
};

export const NavigationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [navState, setNavState] = useState<NavState>('IDLE');
  const [gpsState, setGpsState] = useState<GPSState>('DISCONNECTED');
  const [cameraMode, setCameraMode] = useState<CameraMode>('INITIALIZING');
  
  const [currentLocation, setCurrentLocation] = useState<GPSLocation | null>(null);
  const [destination, setDestinationState] = useState<GeocodingResult | null>(null);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [activeRouteIdState, setActiveRouteIdState] = useState<string | null>(null);
  const [routeProgress, setRouteProgress] = useState<RouteProgress | null>(null);
  
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [is3D, setIs3D] = useState(false);

  const routeAbortController = useRef<AbortController | null>(null);
  const routeRequestId = useRef(0);
  const offRouteCount = useRef(0);
  const lastValidLocation = useRef<GPSLocation | null>(null);
  const gpsSessionRef = useRef(0);
  
  // Use a ref for the active route so demo GPS can access it without restarting the GPS watcher
  const activeRouteRef = useRef<RouteOption | null>(null);
  useEffect(() => {
    activeRouteRef.current = routes.find(r => r.id === activeRouteIdState) || null;
  }, [routes, activeRouteIdState]);

  const handleLocationUpdate = useCallback((loc: GPSLocation, sessionId: number) => {
    if (sessionId !== gpsSessionRef.current) return;
    
    if (lastValidLocation.current) {
        const dist = getDistance(lastValidLocation.current.latitude, lastValidLocation.current.longitude, loc.latitude, loc.longitude);
        const timeDiff = (loc.timestamp - lastValidLocation.current.timestamp) / 1000;
        if (timeDiff > 0 && (dist / timeDiff) > 100) {
            console.warn('[GPS] Ignoring unrealistic jump:', dist, 'meters');
            return;
        }
    }
    lastValidLocation.current = loc;
    setCurrentLocation(loc);
  }, []);

  useEffect(() => {
    lastValidLocation.current = null;
    setCurrentLocation(null);
    const sessionId = ++gpsSessionRef.current;
    
    startGPS(
      isDemoMode, 
      (loc) => handleLocationUpdate(loc, sessionId), 
      setGpsState,
      () => activeRouteRef.current
    );
    return () => { stopGPS(); };
  }, [isDemoMode, handleLocationUpdate]);

  const calculateRoute = async (dest: GeocodingResult, startLoc: GPSLocation) => {
    const currentId = ++routeRequestId.current;
    setNavState('RECALCULATING');
    
    if (routeAbortController.current) {
      routeAbortController.current.abort();
    }
    const abortController = new AbortController();
    routeAbortController.current = abortController;
    
    try {
      const result = await getRoute([startLoc.longitude, startLoc.latitude], [dest.lon, dest.lat], abortController.signal);
      if (routeRequestId.current !== currentId) return;
      
      if (result.status === 'success' && result.routes.length > 0) {
        setRoutes(result.routes);
        setActiveRouteIdState(result.routes[0].id);
        offRouteCount.current = 0;
        setNavState(prev => (prev === 'NAVIGATING' || prev === 'RECALCULATING') ? 'NAVIGATING' : 'ROUTE_PREVIEW');
        setCameraMode(prev => (prev === 'NAVIGATION' ? 'NAVIGATION' : 'ROUTE_PREVIEW'));
      } else {
        setRoutes([]);
        setNavState('ERROR');
      }
    } catch {
      if (routeRequestId.current === currentId) setNavState('ERROR');
    }
  };

  const setDestination = useCallback((dest: GeocodingResult | null) => {
    setDestinationState(dest);
    setRoutes([]);
    setActiveRouteIdState(null);
    setRouteProgress(null);
    if (!dest) {
      setNavState('IDLE');
      setCameraMode('OVERVIEW');
      if (routeAbortController.current) {
        routeAbortController.current.abort();
      }
    } else if (currentLocation) {
      calculateRoute(dest, currentLocation);
    }
  }, [currentLocation]);

  const setActiveRouteId = useCallback((id: string | null) => {
      setActiveRouteIdState(id);
  }, []);

  const startTrip = useCallback(() => {
    if (activeRouteIdState && destination) {
      setNavState('NAVIGATING');
      setCameraMode('NAVIGATION');
      offRouteCount.current = 0;
    }
  }, [activeRouteIdState, destination]);

  const cancelTrip = useCallback(() => {
    if (routeAbortController.current) routeAbortController.current.abort();
    routeRequestId.current++;
    setNavState('CANCELLED');
    setCameraMode('OVERVIEW');
    setDestinationState(null);
    setRoutes([]);
    setActiveRouteIdState(null);
    setRouteProgress(null);
    offRouteCount.current = 0;
    setTimeout(() => {
        setNavState(prev => prev === 'CANCELLED' ? 'IDLE' : prev);
    }, 1000);
  }, []);

  const finishTrip = useCallback(() => {
    setNavState('ARRIVED');
    setCameraMode('OVERVIEW');
  }, []);

  const triggerOverview = useCallback(() => setCameraMode('OVERVIEW'), []);
  const triggerRecenter = useCallback(() => {
      if (navState === 'NAVIGATING') setCameraMode('NAVIGATION');
      else if (destination) setCameraMode('ROUTE_PREVIEW');
      else setCameraMode('OVERVIEW');
  }, [navState, destination]);

  useEffect(() => {
    if (navState !== 'NAVIGATING' || !currentLocation || !activeRouteIdState) return;
    const activeRoute = routes.find(r => r.id === activeRouteIdState);
    if (!activeRoute) return;

    const coords = activeRoute.geometry.coordinates;
    let minDistance = Infinity;
    let closestIdx = 0;

    for (let i = 0; i < coords.length - 1; i++) {
      const dist = getDistanceToSegment(
        currentLocation.latitude, currentLocation.longitude,
        coords[i][1], coords[i][0], coords[i+1][1], coords[i+1][0]
      );
      if (dist < minDistance) { minDistance = dist; closestIdx = i; }
    }

    const threshold = Math.max(40, (currentLocation.accuracy || 10) + 20);
    if (minDistance > threshold) {
      offRouteCount.current++;
      if (offRouteCount.current >= 5 && destination) { // Wait for 5 samples
        calculateRoute(destination, currentLocation);
        offRouteCount.current = 0; // Cooldown immediately to avoid rapid requests
      }
    } else {
      offRouteCount.current = 0;
    }

    const { projLat, projLon } = getProjectedPointOnSegment(
      currentLocation.latitude, currentLocation.longitude,
      coords[closestIdx][1], coords[closestIdx][0],
      coords[closestIdx+1][1], coords[closestIdx+1][0]
    );

    // Distance from vehicle to projection + distance from projection to end of current segment
    let remainingDist = getDistance(currentLocation.latitude, currentLocation.longitude, projLat, projLon)
                      + getDistance(projLat, projLon, coords[closestIdx+1][1], coords[closestIdx+1][0]);

    for (let i = closestIdx + 1; i < coords.length - 1; i++) {
      remainingDist += getDistance(coords[i][1], coords[i][0], coords[i+1][1], coords[i+1][0]);
    }

    const avgSpeed = activeRoute.distance > 0 ? (activeRoute.distance / activeRoute.duration) : 1;
    let remainingDur = remainingDist / avgSpeed;
    
    remainingDist = Math.max(0, remainingDist);
    let progressPercentage = 100 - ((remainingDist / activeRoute.distance) * 100);
    progressPercentage = Math.max(0, Math.min(100, progressPercentage));
    
    if (remainingDist < 30) {
       // arrival threshold
       finishTrip();
    } else {
      setRouteProgress({
        distanceRemaining: remainingDist,
        durationRemaining: remainingDur,
        progressPercentage: progressPercentage,
        currentSegmentIndex: closestIdx,
        distanceToNextManeuver: 0
      });
    }
  }, [currentLocation, activeRouteIdState, navState, destination, routes, finishTrip]);

  const activeRoute = routes.find(r => r.id === activeRouteIdState) || null;

  return (
    <NavigationContext.Provider value={{
      navState, gpsState, cameraMode, currentLocation, destination,
      routes, activeRoute, routeProgress, isDemoMode, is3D,
      startTrip, cancelTrip, finishTrip, setDestination, setActiveRouteId,
      setIsDemoMode, setIs3D, setCameraMode, triggerOverview, triggerRecenter
    }}>
      {children}
    </NavigationContext.Provider>
  );
};
