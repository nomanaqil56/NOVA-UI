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
}

export type GPSState = 'DISCONNECTED' | 'SEARCHING' | 'CONNECTED' | 'DENIED' | 'ERROR';
