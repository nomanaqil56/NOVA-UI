import { useEffect, useRef, useState, useCallback } from 'react';
import { Map as MapLibreMap, setWorkerUrl, Marker, LngLatBounds, GeoJSONSource } from 'maplibre-gl';

import 'maplibre-gl/dist/maplibre-gl.css';
import { Compass, LocateFixed, RefreshCw, AlertTriangle, Bug } from 'lucide-react';
import type { GPSLocation, RouteOption } from '../../types/navigation';
import { cn } from '../../lib/utils';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';


setWorkerUrl(workerUrl);

function initializeRouteLayers(map: MapLibreMap) {
  if (!map.getSource('route')) {
    map.addSource('route', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });
  }

  if (!map.getLayer('route-glow')) {
    map.addLayer({
      id: 'route-glow',
      type: 'line',
      source: 'route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#00D2FF',
        'line-width': 12,
        'line-opacity': 0.2,
        'line-blur': 10
      }
    });
  }

  if (!map.getLayer('route-line')) {
    map.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#00D2FF',
        'line-width': 4,
        'line-opacity': 0.9
      }
    });
  }
}

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
  const mapRef = useRef<MapLibreMap | null>(null);
  const vehicleMarkerRef = useRef<Marker | null>(null);
  const destinationMarkerRef = useRef<Marker | null>(null);
  
  const [is3D, setIs3D] = useState(false);
  const [mapStatus, setMapStatus] = useState<'INITIALIZING' | 'LOADING' | 'READY' | 'ERROR'>('INITIALIZING');
  const [diagnostics, setDiagnostics] = useState({
    style: 'WAITING',
    sources: 0,
    tiles: 'WAITING',
    errorCount: 0
  });
  const [showDiagnostics, setShowDiagnostics] = useState(true);
  const [retryTrigger, setRetryTrigger] = useState(0);

  const initMap = useCallback(() => {
    if (!mapContainer.current) return;
    
    // StrictMode Cleanup
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    setMapStatus('INITIALIZING');

    try {
      const map = new MapLibreMap({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            'carto-dark': {
              type: 'raster',
              tiles: [
                'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
                'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
                'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
                'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
              ],
              tileSize: 256
            }
          },
          layers: [{
            id: 'carto-dark-layer',
            type: 'raster',
            source: 'carto-dark',
            paint: {
              'raster-opacity': 1
            }
          }]
        },
        center: [77.2090, 28.6139],
        zoom: 13,
        pitch: 0,
        attributionControl: false,
      });

      // IMMEDIATELY ASSIGN REF
      mapRef.current = map;

      // Event Listeners for Diagnostics & State
      map.on('error', (e) => {
        console.error('[MAP ERROR]', e);
        setDiagnostics(d => ({ ...d, errorCount: d.errorCount + 1 }));
        if (e.error && (e.error.message?.includes('style') || e.error.message?.includes('source'))) {
          setMapStatus('ERROR');
          setDiagnostics(d => ({ ...d, style: 'ERROR' }));
        }
      });

      map.on('dataloading', (e) => {
        if (e.dataType === 'style') {
          console.log('[MAP] style loading');
          setDiagnostics(d => ({ ...d, style: 'LOADING' }));
          setMapStatus('LOADING');
        } else if (e.dataType === 'source') {
          console.log('[MAP] source loading');
          setDiagnostics(d => ({ ...d, tiles: 'LOADING' }));
        }
      });

      map.on('style.load', () => {
        console.log('[MAP] style loaded');
        setDiagnostics(d => ({ ...d, style: 'READY' }));
        initializeRouteLayers(map);
      });

      map.on('dataloading', (e) => {
        if (e.dataType === 'source') {
          console.log('[MAP] source dataloading (tile requested)');
          setDiagnostics(d => ({ ...d, tiles: 'LOADING' }));
        }
      });

      map.on('sourcedata', (e) => {
        if (e.isSourceLoaded) {
          console.log('[MAP] source loaded');
          const sourceCount = Object.keys(map.getStyle().sources || {}).length;
          setDiagnostics(d => ({ ...d, tiles: 'RECEIVED', sources: sourceCount }));
        }
      });

      map.on('load', () => {
        console.log('[MAP] map loaded');
        setMapStatus('READY');
        
        // Test Marker to verify MapLibre coordinate space
        new Marker({ color: '#FF0000' })
          .setLngLat([77.2090, 28.6139])
          .addTo(map);
      });

      map.on('idle', () => {
        console.log('[MAP] idle');
      });

      map.on('dragstart', () => {
        setIsFollowing(false);
      });

    } catch (err) {
      console.error('[MAP] Failed to initialize map engine:', err);
      setMapStatus('ERROR');
    }
  }, [retryTrigger]);

  useEffect(() => {
    initMap();

    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    });

    if (mapContainer.current) {
      resizeObserver.observe(mapContainer.current);
    }

    return () => {
      resizeObserver.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [initMap]);



  // Sync Route Data (Wait until ready)
  useEffect(() => {
    if (mapStatus !== 'READY' || !mapRef.current || !mapRef.current.isStyleLoaded()) return;
    
    const source = mapRef.current.getSource('route') as GeoJSONSource;
    if (!source) {
      // Re-init if missing
      initializeRouteLayers(mapRef.current);
    }
    const safeSource = mapRef.current.getSource('route') as GeoJSONSource;
    
    if (activeRoute && safeSource) {
      safeSource.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: activeRoute.geometry.coordinates
        }
      });

      const bounds = new LngLatBounds();
      activeRoute.geometry.coordinates.forEach(coord => {
        bounds.extend(coord as [number, number]);
      });
      
      setIsFollowing(false);
      mapRef.current.fitBounds(bounds, {
        padding: { top: 150, bottom: 250, left: 450, right: 100 },
        duration: 1500
      });
    } else if (safeSource) {
      safeSource.setData({
        type: 'FeatureCollection',
        features: []
      });
    }
  }, [activeRoute, mapStatus]);

  // Update Vehicle Marker (Immediate if Ready)
  useEffect(() => {
    if (!mapRef.current || !currentLocation || mapStatus !== 'READY') return;
    const map = mapRef.current;
    const { longitude, latitude, heading } = currentLocation;

    if (!vehicleMarkerRef.current) {
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
      vehicleMarkerRef.current = new Marker({
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
  }, [currentLocation, isFollowing, mapStatus]);

  // Destination Marker
  useEffect(() => {
    if (!mapRef.current || mapStatus !== 'READY') return;
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
        destinationMarkerRef.current = new Marker({ element: el, anchor: 'bottom' })
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
  }, [destination, mapStatus]);

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
    mapRef.current.easeTo({ pitch: newPitch, duration: 1000 });
  };

  return (
    <div className="absolute inset-0 bg-[#080A0D]">
      {(mapStatus === 'INITIALIZING' || mapStatus === 'LOADING') && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#080A0D]/90 backdrop-blur-sm text-primary transition-opacity duration-500">
          <RefreshCw className="w-8 h-8 text-accent animate-spin mb-4" />
          <h3 className="text-xl font-bold tracking-widest mb-2">MAP INITIALIZING</h3>
          <p className="text-primary-muted font-medium">Loading navigation data...</p>
        </div>
      )}

      {mapStatus === 'ERROR' && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#080A0D]/90 backdrop-blur-sm text-primary">
          <AlertTriangle className="w-8 h-8 text-red-500 mb-4" />
          <h3 className="text-xl font-bold tracking-widest mb-2 text-red-500">MAP UNAVAILABLE</h3>
          <p className="text-primary-muted font-medium mb-6">Unable to load navigation data.</p>
          <button 
            onClick={() => setRetryTrigger(prev => prev + 1)} 
            className="px-6 py-2 bg-surface-elevated border border-border rounded-full hover:text-accent hover:border-accent transition-colors text-sm font-bold tracking-wider"
          >
            RETRY
          </button>
        </div>
      )}

      {showDiagnostics && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-black/80 backdrop-blur border border-accent/30 rounded-lg p-4 font-mono text-xs w-64 shadow-2xl">
          <div className="text-accent font-bold mb-2 border-b border-accent/20 pb-1">MAP ENGINE DIAGNOSTICS</div>
          <div className="grid grid-cols-2 gap-y-1">
            <span className="text-primary-muted">Status:</span><span className={mapStatus === 'READY' ? 'text-green-400' : 'text-amber-400'}>{mapStatus}</span>
            <span className="text-primary-muted">Style:</span><span className={diagnostics.style === 'READY' ? 'text-green-400' : 'text-amber-400'}>{diagnostics.style}</span>
            <span className="text-primary-muted">Tiles:</span><span className={diagnostics.tiles === 'READY' ? 'text-green-400' : 'text-amber-400'}>{diagnostics.tiles}</span>
            <span className="text-primary-muted">Sources:</span><span className="text-primary">{diagnostics.sources}</span>
            <span className="text-primary-muted">Errors:</span><span className={diagnostics.errorCount > 0 ? 'text-red-400' : 'text-green-400'}>{diagnostics.errorCount}</span>
            <span className="text-primary-muted">GPS:</span><span className={currentLocation ? 'text-green-400' : 'text-red-400'}>{currentLocation ? 'CONNECTED' : 'WAITING'}</span>
            <span className="text-primary-muted">Route:</span><span className={activeRoute ? 'text-green-400' : 'text-primary'}>{activeRoute ? 'ACTIVE' : 'NONE'}</span>
          </div>
        </div>
      )}

      <div ref={mapContainer} className="w-full h-full" />
      
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,#080A0D_100%)] opacity-60 z-10" />

      <div className="absolute bottom-8 right-8 flex flex-col gap-3 z-30">
        <button 
          onClick={() => setShowDiagnostics(!showDiagnostics)}
          className="w-12 h-12 rounded-full glass-panel flex items-center justify-center transition-all shadow-lg text-primary hover:text-accent opacity-50 hover:opacity-100"
        >
          <Bug className="w-5 h-5" />
        </button>
        {!isFollowing && currentLocation && mapStatus === 'READY' && (
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
