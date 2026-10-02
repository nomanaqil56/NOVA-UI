import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Compass, LocateFixed } from 'lucide-react';
import type { GPSLocation, RouteOption } from '../../types/navigation';
import { cn } from '../../lib/utils';

interface MapComponentProps {
  currentLocation: GPSLocation | null;
  destination: { lat: number; lon: number; name: string } | null;
  activeRoute: RouteOption | null;
  isFollowing: boolean;
  setIsFollowing: (follow: boolean) => void;
}

export const MapComponent = ({
  currentLocation,
  destination,
  activeRoute,
  isFollowing,
  setIsFollowing
}: MapComponentProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const vehicleMarkerRef = useRef<maplibregl.Marker | null>(null);
  const destinationMarkerRef = useRef<maplibregl.Marker | null>(null);
  const [is3D, setIs3D] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [77.2090, 28.6139], // Default to New Delhi
      zoom: 13,
      pitch: 0,
      attributionControl: false,
    });

    map.on('load', () => {
      // Add route source
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        }
      });

      // Add route layer (Glow effect)
      map.addLayer({
        id: 'route-glow',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#00D2FF',
          'line-width': 12,
          'line-opacity': 0.2,
          'line-blur': 10
        }
      });

      // Add route layer (Core line)
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#00D2FF',
          'line-width': 4,
          'line-opacity': 0.9
        }
      });

      mapRef.current = map;
    });

    // Detect manual panning to disable auto-follow
    map.on('dragstart', () => {
      setIsFollowing(false);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Vehicle Marker & Auto-Follow
  useEffect(() => {
    if (!mapRef.current || !currentLocation) return;
    const map = mapRef.current;

    const { longitude, latitude, heading } = currentLocation;

    if (!vehicleMarkerRef.current) {
      // Create custom DOM element for vehicle marker
      const el = document.createElement('div');
      el.className = 'vehicle-marker-wrapper';
      el.innerHTML = `
        <div class="absolute w-32 h-32 -ml-16 -mt-16 border border-[#00D2FF]/30 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
        <div class="relative w-8 h-16 bg-gradient-to-b from-white to-[#9299A3] rounded-t-full rounded-b-md shadow-[0_0_20px_rgba(0,210,255,0.8)] flex items-center justify-center overflow-hidden" style="transform: translate(-50%, -50%);">
          <div class="absolute top-2 w-5 h-4 bg-black/40 rounded-t-sm"></div>
          <div class="absolute top-7 w-6 h-3 bg-black/30"></div>
          <div class="absolute bottom-2 w-5 h-2 bg-red-500/80 blur-[1px]"></div>
        </div>
      `;
      
      vehicleMarkerRef.current = new maplibregl.Marker({
        element: el,
        rotationAlignment: 'map',
        pitchAlignment: 'map'
      })
      .setLngLat([longitude, latitude])
      .addTo(map);
    } else {
      vehicleMarkerRef.current.setLngLat([longitude, latitude]);
    }

    if (heading !== null) {
      vehicleMarkerRef.current.setRotation(heading);
    }

    if (isFollowing) {
      map.easeTo({
        center: [longitude, latitude],
        bearing: heading !== null ? heading : map.getBearing(),
        padding: { bottom: 150, top: 0, left: 0, right: 0 },
        duration: 1000,
        easing: (t: number) => t
      });
    }
  }, [currentLocation, isFollowing]);

  // Update Destination Marker
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (destination) {
      if (!destinationMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'destination-marker-wrapper relative';
        el.innerHTML = `
          <div class="w-4 h-4 bg-white rounded-full mx-auto shadow-[0_0_15px_white]"></div>
          <div class="w-0.5 h-8 bg-white/50 mx-auto"></div>
          <div class="absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap text-center text-white font-medium text-sm" style="text-shadow: 0 0 10px rgba(0, 210, 255, 0.5);">
            ${destination.name}
          </div>
        `;
        destinationMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([destination.lon, destination.lat])
          .addTo(map);
      } else {
        destinationMarkerRef.current.setLngLat([destination.lon, destination.lat]);
        const nameEl = destinationMarkerRef.current.getElement().querySelector('.whitespace-nowrap');
        if (nameEl) nameEl.textContent = destination.name;
      }
    } else {
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.remove();
        destinationMarkerRef.current = null;
      }
    }
  }, [destination]);

  // Update Route
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;
    const map = mapRef.current;
    
    const source = map.getSource('route') as maplibregl.GeoJSONSource;
    if (!source) return;

    if (activeRoute) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: activeRoute.geometry.coordinates
        }
      });

      // Fit bounds to route
      const bounds = new maplibregl.LngLatBounds();
      activeRoute.geometry.coordinates.forEach(coord => {
        bounds.extend(coord as [number, number]);
      });
      
      setIsFollowing(false);
      map.fitBounds(bounds, {
        padding: { top: 150, bottom: 250, left: 450, right: 100 },
        duration: 1500
      });

    } else {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: []
        }
      });
    }
  }, [activeRoute]);

  const handleRecenter = () => {
    setIsFollowing(true);
    if (!mapRef.current || !currentLocation) return;
    setIs3D(true);
    mapRef.current.easeTo({
      center: [currentLocation.longitude, currentLocation.latitude],
      pitch: 60,
      zoom: 16,
      duration: 1500
    });
  };

  const toggle3D = () => {
    if (!mapRef.current) return;
    const newPitch = is3D ? 0 : 60;
    setIs3D(!is3D);
    mapRef.current.easeTo({
      pitch: newPitch,
      duration: 1000
    });
  };

  return (
    <div className="absolute inset-0 bg-[#06080A]">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Map Vignette Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,#06080A_100%)] opacity-60" />

      {/* Map Controls */}
      <div className="absolute bottom-8 right-8 flex flex-col gap-3 z-20">
        {!isFollowing && currentLocation && (
          <button 
            onClick={handleRecenter}
            className="glass-panel text-primary hover:text-accent font-bold text-[10px] tracking-wider px-4 py-3 rounded-full flex items-center gap-2 mb-2 transition-all border-accent/30 bg-surface-elevated shadow-lg"
          >
            <LocateFixed className="w-4 h-4" /> RE-CENTER
          </button>
        )}
        <button 
          onClick={toggle3D}
          className={cn("w-12 h-12 rounded-full glass-panel flex items-center justify-center transition-all shadow-lg", is3D ? "text-accent border-accent/50 bg-accent/10" : "text-primary hover:text-accent")}
        >
          <Compass className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
