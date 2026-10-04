import type { GPSLocation, GPSState, RouteOption } from '../types/navigation';

let watchId: number | null = null;
let demoInterval: ReturnType<typeof setInterval> | null = null;

export const startGPS = (
  isDemo: boolean,
  onLocationUpdate: (loc: GPSLocation) => void,
  onStateChange: (state: GPSState) => void,
  getDemoActiveRoute?: () => RouteOption | null
) => {
  stopGPS();

  if (isDemo) {
    onStateChange('CONNECTED');
    
    // Simulate vehicle movement
    let lat = 28.6139;
    let lon = 77.2090;
    let heading = 0;
    
    // Demo state tracking for route following
    let demoRouteProgressIndex = 0;
    let demoRouteId: string | null = null;
    
    demoInterval = setInterval(() => {
      const activeRoute = getDemoActiveRoute ? getDemoActiveRoute() : null;
      
      if (activeRoute && activeRoute.geometry.coordinates.length > 1) {
        if (demoRouteId !== activeRoute.id) {
            demoRouteId = activeRoute.id;
            demoRouteProgressIndex = 0; // reset on new route
        }
        
        const coords = activeRoute.geometry.coordinates;
        if (demoRouteProgressIndex < coords.length - 1) {
            const p1 = coords[demoRouteProgressIndex];
            const p2 = coords[demoRouteProgressIndex + 1];
            
            // Move from p1 to p2
            const dLon = p2[0] - p1[0];
            
            // Calc distance and bearing
            const lat1Rad = p1[1] * Math.PI / 180;
            const lat2Rad = p2[1] * Math.PI / 180;
            const dLonRad = dLon * Math.PI / 180;
            
            // Bearing
            const y = Math.sin(dLonRad) * Math.cos(lat2Rad);
            const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLonRad);
            let bearing = Math.atan2(y, x) * 180 / Math.PI;
            bearing = (bearing + 360) % 360;
            
            lat = p1[1];
            lon = p1[0];
            heading = bearing;
            
            // Advance for next tick
            demoRouteProgressIndex++;
        }
      } else {
         // Free roam demo if no route
         lat += 0.00005;
         lon += 0.00005;
         heading = 45;
      }
      
      onLocationUpdate({
        latitude: lat,
        longitude: lon,
        accuracy: 2.5,
        heading: heading,
        speed: 40, // km/h (mock)
        timestamp: Date.now()
      });
    }, 1000);
    return;
  }

  if (!navigator.geolocation) {
    onStateChange('ERROR');
    return;
  }

  onStateChange('SEARCHING');

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      onStateChange('CONNECTED');
      onLocationUpdate({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        heading: position.coords.heading,
        speed: position.coords.speed !== null ? position.coords.speed * 3.6 : 0, // m/s to km/h
        timestamp: position.timestamp
      });
    },
    (error) => {
      if (error.code === error.PERMISSION_DENIED) {
        onStateChange('DENIED');
      } else {
        onStateChange('ERROR');
      }
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000
    }
  );
};

export const stopGPS = () => {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  if (demoInterval !== null) {
    clearInterval(demoInterval);
    demoInterval = null;
  }
};
