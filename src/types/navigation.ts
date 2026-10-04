export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export interface GeocodingResult {
  placeId: string;
  name: string;
  displayName: string;
  lat: number;
  lon: number;
  type?: string;
  score?: number;
  distance?: number;
}

export interface RouteGeometry {
  coordinates: [number, number][]; // [longitude, latitude]
}

export interface RouteOption {
  id: string;
  name: string;
  distance: number; // in meters
  duration: number; // in seconds
  geometry: RouteGeometry;
  type: string;
}

export type GPSState = 'DISCONNECTED' | 'SEARCHING' | 'CONNECTED' | 'DENIED' | 'ERROR';
export type NavState = 'IDLE' | 'GPS_ACQUIRING' | 'READY' | 'ROUTE_PREVIEW' | 'NAVIGATING' | 'RECALCULATING' | 'ARRIVED' | 'CANCELLED' | 'ERROR';
export type CameraMode = 'INITIALIZING' | 'GPS_ACQUIRE' | 'OVERVIEW' | 'ROUTE_PREVIEW' | 'NAVIGATION' | 'USER_EXPLORE';

export interface RouteProgress {
  distanceRemaining: number;
  durationRemaining: number;
  progressPercentage: number;
  currentSegmentIndex: number;
  distanceToNextManeuver: number;
}
