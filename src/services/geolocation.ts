import type { GPSLocation, GPSState } from '../types/navigation';

let watchId: number | null = null;
let demoInterval: ReturnType<typeof setInterval> | null = null;

export const startGPS = (
  isDemo: boolean,
  onLocationUpdate: (loc: GPSLocation) => void,
  onStateChange: (state: GPSState) => void
) => {
  stopGPS();

  if (isDemo) {
    onStateChange('CONNECTED');
    
    // Simulate vehicle movement in New Delhi
    let lat = 28.6139;
    let lon = 77.2090;
    let heading = 0;
    
    demoInterval = setInterval(() => {
      lat += 0.0001; // moving slightly
      lon += 0.0001;
      heading = (heading + 2) % 360;
      
      onLocationUpdate({
        latitude: lat,
        longitude: lon,
        accuracy: 2.5,
        heading: heading,
        speed: 45, // km/h (mock)
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
        speed: position.coords.speed !== null ? position.coords.speed * 3.6 : null, // m/s to km/h
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
