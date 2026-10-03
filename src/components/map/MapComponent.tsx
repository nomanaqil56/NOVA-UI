import { useEffect, useRef, useState, useCallback } from 'react';
import { Map as MapLibreMap, setWorkerUrl, Marker, LngLatBounds, GeoJSONSource, AttributionControl } from 'maplibre-gl';
import type { StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Compass, LocateFixed, RefreshCw, AlertTriangle, Bug } from 'lucide-react';
import type { GPSLocation, RouteOption } from '../../types/navigation';
import { cn } from '../../lib/utils';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { novaStyle } from '../../map/novaStyle';
import { useNavigationEngine } from '../../hooks/useNavigationEngine';


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
  tripActive: boolean;
}

type CameraMode = 'INITIALIZING' | 'GPS_ACQUIRE' | 'NORMAL' | 'ROUTE_PREVIEW' | 'NAVIGATION' | 'USER_EXPLORE';

export const MapComponent = ({
  currentLocation,
  destination,
  activeRoute,
  isFollowing,
  setIsFollowing,
  tripActive
}: MapComponentProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const vehicleMarkerRef = useRef<Marker | null>(null);
  const destinationMarkerRef = useRef<Marker | null>(null);
  
  const cameraMode = useRef<CameraMode>('INITIALIZING');
  const cameraTransitionUntil = useRef<number>(0);
  const prevTripActive = useRef(tripActive);
  const latestLocation = useRef(currentLocation);
  latestLocation.current = currentLocation;

  const [is3D, setIs3D] = useState(false);
  const [mapStatus, setMapStatus] = useState<'INITIALIZING' | 'LOADING' | 'READY' | 'ERROR'>('INITIALIZING');
  const [diagnostics, setDiagnostics] = useState({
    style: 'WAITING',
    sources: 0,
    tiles: 'WAITING',
    errorCount: 0
  });
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);

  const initMap = useCallback(() => {
    if (!mapContainer.current) return;
    
    // StrictMode Cleanup / Retry Cleanup
    if (mapRef.current) {
      if (vehicleMarkerRef.current) vehicleMarkerRef.current.remove();
      if (destinationMarkerRef.current) destinationMarkerRef.current.remove();
      vehicleMarkerRef.current = null;
      destinationMarkerRef.current = null;
      cameraMode.current = 'INITIALIZING';
      mapRef.current.remove();
      mapRef.current = null;
    }

    setMapStatus('INITIALIZING');

    try {
      const map = new MapLibreMap({
        container: mapContainer.current,
        style: novaStyle as StyleSpecification,
        center: [0, 0], // Start zoomed out, jump to GPS instantly when available
        zoom: 2,
        pitch: 0,
        attributionControl: false,
      });
      map.addControl(new AttributionControl({ compact: true }), 'bottom-left');

      mapRef.current = map;

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
          setDiagnostics(d => ({ ...d, style: 'LOADING' }));
          setMapStatus('LOADING');
        } else if (e.dataType === 'source') {
          setDiagnostics(d => ({ ...d, tiles: 'LOADING' }));
        }
      });

      map.on('style.load', () => {
        setDiagnostics(d => ({ ...d, style: 'READY' }));
        initializeRouteLayers(map);
      });

      map.on('sourcedata', (e) => {
        if (e.isSourceLoaded) {
          const sourceCount = Object.keys(map.getStyle().sources || {}).length;
          setDiagnostics(d => ({ ...d, tiles: 'RECEIVED', sources: sourceCount }));
        }
      });

      map.on('load', () => {
        // Will set READY when idle
      });
      
      map.on('idle', () => {
        setMapStatus('READY');
      });

      map.on('dragstart', () => {
        if (cameraMode.current !== 'INITIALIZING' && cameraMode.current !== 'GPS_ACQUIRE') {
          cameraMode.current = 'USER_EXPLORE';
          setIsFollowing(false);
        }
      });

    } catch (err) {
      console.error('[MAP] Failed to initialize map engine:', err);
      setMapStatus('ERROR');
    }
  }, [retryTrigger, setIsFollowing]);

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

      if (!tripActive) {
        cameraMode.current = 'ROUTE_PREVIEW';
        setIsFollowing(false);
        const bounds = new LngLatBounds();
        activeRoute.geometry.coordinates.forEach(coord => {
          bounds.extend(coord as [number, number]);
        });
        
        mapRef.current.fitBounds(bounds, {
          padding: { top: 150, bottom: 250, left: 450, right: 100 },
          duration: 1500
        });
      }
    } else if (safeSource) {
      safeSource.setData({
        type: 'FeatureCollection',
        features: []
      });
    }
  }, [activeRoute, mapStatus, tripActive, setIsFollowing]);

  // Initialize camera when BOTH map is ready and GPS is available
  useEffect(() => {
    if (mapStatus === 'READY' && currentLocation && cameraMode.current === 'INITIALIZING' && mapRef.current) {
      cameraMode.current = 'GPS_ACQUIRE';
      cameraTransitionUntil.current = performance.now() + 4000;
      
      mapRef.current.flyTo({
        center: [currentLocation.longitude, currentLocation.latitude],
        zoom: 10,
        pitch: 0,
        bearing: 0,
        duration: 2000,
        essential: true, // Respects reduced-motion
      });

      mapRef.current.once('moveend', () => {
        if (!mapRef.current) return;
        
        const triggerFinalZoom = () => {
          if (cameraMode.current === 'GPS_ACQUIRE' && mapRef.current) {
            mapRef.current.flyTo({
              center: [currentLocation.longitude, currentLocation.latitude],
              zoom: 15.5,
              duration: 2000,
              essential: true,
            });
            mapRef.current.once('moveend', () => {
              if (cameraMode.current === 'GPS_ACQUIRE') {
                cameraMode.current = 'NORMAL';
                setIsFollowing(true);
              }
            });
          }
        };

        if (mapRef.current.areTilesLoaded()) {
          triggerFinalZoom();
        } else {
          mapRef.current.once('idle', triggerFinalZoom);
        }
      });
    }
  }, [mapStatus, currentLocation, setIsFollowing]);

  // Update Vehicle Marker & Camera smoothly via requestAnimationFrame
  const updateVisuals = useCallback((location: GPSLocation) => {
    if (!mapRef.current || mapStatus !== 'READY') return;
    const map = mapRef.current;
    const { longitude, latitude, heading } = location;

    if (!vehicleMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'vehicle-marker-wrapper';
      el.innerHTML = `
        <div class="absolute w-40 h-40 -ml-20 -mt-20 rounded-full bg-[radial-gradient(circle,rgba(0,210,255,0.15)_0%,transparent_70%)] opacity-0 transition-opacity duration-1000 \${tripActive ? 'opacity-100' : ''}"></div>
        <div class="relative flex items-center justify-center transition-transform duration-300" style="transform: translate(-50%, -50%);">
          <svg width="40" height="80" viewBox="0 0 100 200" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 10px 15px rgba(0,0,0,0.8));">
            <defs>
              <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#2a3344" />
                <stop offset="30%" stop-color="#1a202c" />
                <stop offset="100%" stop-color="#0f172a" />
              </linearGradient>
              <linearGradient id="glassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#020617" />
                <stop offset="100%" stop-color="#0f172a" />
              </linearGradient>
            </defs>
            <path d="M 20,20 C 20,5 80,5 80,20 L 85,170 C 85,190 15,190 15,170 Z" fill="url(#bodyGrad)" stroke="#3b82f6" stroke-width="1" stroke-opacity="0.3"/>
            <path d="M 30,22 C 50,15 50,15 70,22 L 65,55 L 35,55 Z" fill="#334155" opacity="0.5" />
            <path d="M 25,60 C 50,50 50,50 75,60 L 80,90 C 50,85 50,85 20,90 Z" fill="url(#glassGrad)" stroke="#1e293b" stroke-width="2"/>
            <path d="M 28,95 L 72,95 L 68,140 L 32,140 Z" fill="#0f172a" stroke="#1e293b" stroke-width="1"/>
            <path d="M 30,145 L 70,145 L 75,160 C 50,155 50,155 25,160 Z" fill="#020617" />
            <rect x="20" y="175" width="12" height="4" rx="2" fill="#ef4444" opacity="0.9" />
            <rect x="68" y="175" width="12" height="4" rx="2" fill="#ef4444" opacity="0.9" />
            <ellipse cx="25" cy="15" rx="6" ry="4" fill="#e0f2fe" opacity="0.9" />
            <ellipse cx="75" cy="15" rx="6" ry="4" fill="#e0f2fe" opacity="0.9" />
          </svg>
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

    if (cameraMode.current === 'NORMAL' || cameraMode.current === 'NAVIGATION') {
      // Allow animations to finish
      if (performance.now() < cameraTransitionUntil.current) return;
      
      // Using direct setters because we are inside a requestAnimationFrame loop
      map.setCenter([longitude, latitude]);
      
      if (cameraMode.current === 'NAVIGATION' && heading !== null) {
        map.setBearing(heading);
      } else if (cameraMode.current === 'NORMAL' && !is3D) {
        map.setBearing(0);
      }
      
      map.setPitch(cameraMode.current === 'NAVIGATION' ? 55 : (is3D ? 60 : 0));
      map.setPadding(cameraMode.current === 'NAVIGATION' ? { bottom: 250, top: 0, left: 0, right: 0 } : { bottom: 0, top: 0, left: 0, right: 0 });
    }
  }, [mapStatus, tripActive, is3D]);

  useNavigationEngine(currentLocation, updateVisuals);

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
          <div class="absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap text-center text-white font-medium text-sm destination-name-label" style="text-shadow: 0 0 10px rgba(0, 210, 255, 0.5);">
          </div>
        `;
        destinationMarkerRef.current = new Marker({ element: el, anchor: 'bottom' })
          .setLngLat([destination.lon, destination.lat])
          .addTo(map);
        const nameEl = el.querySelector('.destination-name-label');
        if (nameEl) nameEl.textContent = destination.name;
      } else {
        destinationMarkerRef.current.setLngLat([destination.lon, destination.lat]);
        const nameEl = destinationMarkerRef.current.getElement().querySelector('.destination-name-label');
        if (nameEl) nameEl.textContent = destination.name;
      }
    } else {
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.remove();
        destinationMarkerRef.current = null;
      }
    }
  }, [destination, mapStatus]);

  // Handle explicit Trip Active state transitions
  useEffect(() => {
    if (tripActive !== prevTripActive.current) {
      prevTripActive.current = tripActive;
      
      const loc = latestLocation.current;
      if (!mapRef.current || !loc || cameraMode.current === 'INITIALIZING' || cameraMode.current === 'GPS_ACQUIRE') return;

      cameraTransitionUntil.current = performance.now() + 1500;
      
      if (tripActive) {
        cameraMode.current = 'NAVIGATION';
        setIsFollowing(true);
        mapRef.current.easeTo({
          center: [loc.longitude, loc.latitude],
          pitch: 55,
          bearing: loc.heading || mapRef.current.getBearing(),
          padding: { bottom: 250, top: 0, left: 0, right: 0 },
          zoom: 15.5,
          duration: 1500
        });
      } else {
        cameraMode.current = 'NORMAL';
        setIsFollowing(true);
        mapRef.current.easeTo({
          center: [loc.longitude, loc.latitude],
          pitch: 0,
          bearing: 0,
          padding: { bottom: 0, top: 0, left: 0, right: 0 },
          zoom: 15.5,
          duration: 1500
        });
      }
    }
  }, [tripActive, setIsFollowing]);

  const handleRecenter = useCallback(() => {
    const loc = latestLocation.current;
    if (!mapRef.current || !loc) return;
    
    cameraTransitionUntil.current = performance.now() + 1500;
    cameraMode.current = tripActive ? 'NAVIGATION' : 'NORMAL';
    setIsFollowing(true);
    
    mapRef.current.easeTo({
      center: [loc.longitude, loc.latitude],
      pitch: tripActive ? 55 : (is3D ? 60 : 0),
      bearing: tripActive ? (loc.heading || mapRef.current.getBearing()) : 0,
      padding: tripActive ? { bottom: 250, top: 0, left: 0, right: 0 } : { bottom: 0, top: 0, left: 0, right: 0 },
      zoom: 15.5,
      duration: 1500
    });
  }, [tripActive, is3D, setIsFollowing]);

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
