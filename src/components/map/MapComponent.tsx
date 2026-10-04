import { useEffect, useRef, useState, useCallback } from 'react';
import { Map as MapLibreMap, setWorkerUrl, Marker, LngLatBounds, GeoJSONSource, AttributionControl } from 'maplibre-gl';
import type { StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Compass, LocateFixed, RefreshCw, AlertTriangle, Bug, MapPin } from 'lucide-react';
import type { GPSLocation } from '../../types/navigation';
import { cn } from '../../lib/utils';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { novaStyle } from '../../map/novaStyle';
import { useNavigationEngine } from '../../hooks/useNavigationEngine';
import { useNavigation } from '../../context/NavigationContext';
import { NovaVehicle3DLayer } from '../../map/NovaVehicle3D';

setWorkerUrl(workerUrl);

function initializeRouteLayers(map: MapLibreMap) {
  if (!map.getSource('route')) {
    map.addSource('route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  }
  if (!map.getLayer('route-glow')) {
    map.addLayer({ id: 'route-glow', type: 'line', source: 'route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#00D2FF', 'line-width': 12, 'line-opacity': 0.2, 'line-blur': 10 } });
  }
  if (!map.getLayer('route-line')) {
    map.addLayer({ id: 'route-line', type: 'line', source: 'route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#00D2FF', 'line-width': 4, 'line-opacity': 0.9 } });
  }
}

interface MapComponentProps {
  onMapClick?: (lat: number, lon: number, featureName?: string) => void;
  pickedLocation?: { lat: number; lon: number; name?: string } | null;
}

export const MapComponent = ({ onMapClick, pickedLocation }: MapComponentProps) => {
  const { 
    cameraMode, setCameraMode, currentLocation, destination, activeRoute, 
    navState, is3D, setIs3D, triggerRecenter
  } = useNavigation();

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const destinationMarkerRef = useRef<Marker | null>(null);
  const vehicle3DRef = useRef<NovaVehicle3DLayer | null>(null);
  
  const cameraTransitionUntil = useRef<number>(0);
  const cameraModeRef = useRef(cameraMode);
  const currentLocationRef = useRef(currentLocation);
  const onMapClickRef = useRef(onMapClick);

  useEffect(() => { cameraModeRef.current = cameraMode; }, [cameraMode]);
  useEffect(() => { currentLocationRef.current = currentLocation; }, [currentLocation]);
  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);
  
  const [mapStatus, setMapStatus] = useState<'INITIALIZING' | 'LOADING' | 'READY' | 'ERROR'>('INITIALIZING');
  const [diagnostics, setDiagnostics] = useState({ style: 'WAITING', sources: 0, tiles: 'WAITING', errorCount: 0 });
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);

  // Initialize Map (Strictly once or on retry, independent of navigation state)
  const initMap = useCallback(() => {
    if (!mapContainer.current) return;
    
    if (mapRef.current) {
      if (destinationMarkerRef.current) destinationMarkerRef.current.remove();
      destinationMarkerRef.current = null;
      mapRef.current.remove();
      mapRef.current = null;
      vehicle3DRef.current = null;
    }

    setMapStatus('INITIALIZING');

    try {
      const map = new MapLibreMap({
        container: mapContainer.current,
        style: novaStyle as StyleSpecification,
        center: [-122.4194, 37.7749], // Phase 3: Known coordinate (San Francisco)
        zoom: 18, // Phase 4: Forced zoom
        pitch: 60, // Phase 4: Forced pitch
        attributionControl: false,
        canvasContextAttributes: {
            antialias: true
        }
      });
      console.log('[NOVA 3D] MAP CREATED');
      map.addControl(new AttributionControl({ compact: true }), 'top-right');
      mapRef.current = map;
      vehicle3DRef.current = new NovaVehicle3DLayer();
      console.log('[NOVA 3D] LAYER CREATED');

      map.on('error', (e) => {
        setDiagnostics(d => ({ ...d, errorCount: d.errorCount + 1 }));
        if (e.error && (e.error.message?.includes('style') || e.error.message?.includes('source'))) {
          setMapStatus('ERROR');
          setDiagnostics(d => ({ ...d, style: 'ERROR' }));
        }
      });
      map.on('dataloading', (e) => {
        if (e.dataType === 'style') { setDiagnostics(d => ({ ...d, style: 'LOADING' })); setMapStatus('LOADING'); }
        else if (e.dataType === 'source') { setDiagnostics(d => ({ ...d, tiles: 'LOADING' })); }
      });
      map.on('style.load', () => {
        console.log('[NOVA 3D] STYLE LOADED');
        setDiagnostics(d => ({ ...d, style: 'READY' }));
        initializeRouteLayers(map);
        if (vehicle3DRef.current && !map.getLayer(vehicle3DRef.current.id)) {
            // Phase 3: Override GPS with forced coordinate
            const loc = { longitude: -122.4194, latitude: 37.7749, heading: 0 };
            
            console.log('[NOVA 3D] GPS RECEIVED', loc);
            vehicle3DRef.current.updatePosition(loc.longitude, loc.latitude);
            if (loc.heading !== null) vehicle3DRef.current.updateHeading(loc.heading);
            
            console.log('[NOVA 3D] ADDING LAYER');
            map.addLayer(vehicle3DRef.current as any);
            console.log('[NOVA 3D] LAYER REGISTERED', map.getLayer('nova-vehicle-3d') !== undefined);
        }
      });
      map.on('sourcedata', (e) => {
        if (e.isSourceLoaded) {
          const sourceCount = Object.keys(map.getStyle().sources || {}).length;
          setDiagnostics(d => ({ ...d, sources: sourceCount }));
        }
      });
      map.on('idle', () => {
        setMapStatus('READY');
        setDiagnostics(d => ({ ...d, tiles: 'READY' }));
      });
      map.on('dragstart', () => {
        const mode = cameraModeRef.current;
        if (mode !== 'INITIALIZING' && mode !== 'GPS_ACQUIRE') {
          setCameraMode('USER_EXPLORE');
        }
      });
      map.on('click', (e) => {
        const mode = cameraModeRef.current;
        if (mode === 'INITIALIZING' || mode === 'GPS_ACQUIRE') return;
        const features = map.queryRenderedFeatures(e.point);
        let featureName;
        for (const f of features) { if (f.properties && f.properties.name) { featureName = f.properties.name; break; } }
        if (onMapClickRef.current) onMapClickRef.current(e.lngLat.lat, e.lngLat.lng, featureName);
      });
    } catch {
      setMapStatus('ERROR');
    }
  }, [setCameraMode]); // Removed onMapClick to prevent re-instantiation

  useEffect(() => {
    initMap();
    const resizeObserver = new ResizeObserver(() => { if (mapRef.current) mapRef.current.resize(); });
    if (mapContainer.current) resizeObserver.observe(mapContainer.current);
    return () => {
      resizeObserver.disconnect();
      if (mapRef.current) {
        if (destinationMarkerRef.current) destinationMarkerRef.current.remove();
        mapRef.current.remove();
        mapRef.current = null;
        vehicle3DRef.current = null;
      }
    };
  }, [initMap, retryTrigger]);

  // Sync Route Data
  useEffect(() => {
    if (mapStatus !== 'READY' || !mapRef.current || !mapRef.current.isStyleLoaded()) return;
    
    const safeSource = mapRef.current.getSource('route') as GeoJSONSource;
    if (!safeSource) {
      initializeRouteLayers(mapRef.current);
    }
    
    if (activeRoute && safeSource) {
      safeSource.setData({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: activeRoute.geometry.coordinates }
      });
    } else if (safeSource) {
      safeSource.setData({ type: 'FeatureCollection', features: [] });
    }
  }, [activeRoute, mapStatus]);

  // Handle Camera Mode Transitions (Only modifying existing map)
  const lastHandledCameraMode = useRef<string | null>(null);

  useEffect(() => {
    if (mapStatus !== 'READY' || !mapRef.current) return;
    const map = mapRef.current;
    
    if (lastHandledCameraMode.current === cameraMode) {
        // Allow re-triggering OVERVIEW for 3D toggle, or ROUTE_PREVIEW for activeRoute changes
        if (cameraMode !== 'OVERVIEW' && cameraMode !== 'ROUTE_PREVIEW') {
            return;
        }
    }
    
    const loc = currentLocationRef.current;
    
    if (cameraMode === 'ROUTE_PREVIEW' && activeRoute) {
        lastHandledCameraMode.current = cameraMode;
        cameraTransitionUntil.current = performance.now() + 1500;
        const bounds = new LngLatBounds();
        activeRoute.geometry.coordinates.forEach(coord => bounds.extend(coord as [number, number]));
        map.fitBounds(bounds, { padding: { top: 150, bottom: 250, left: 450, right: 100 }, duration: 1500 });
    } else if (cameraMode === 'NAVIGATION' && loc) {
        lastHandledCameraMode.current = cameraMode;
        cameraTransitionUntil.current = performance.now() + 1500;
        map.easeTo({
          center: [loc.longitude, loc.latitude],
          pitch: 60,
          bearing: loc.heading || map.getBearing(),
          padding: { bottom: 250, top: 0, left: 0, right: 0 },
          zoom: 16.5,
          duration: 1500
        });
    } else if (cameraMode === 'OVERVIEW' && loc) {
        lastHandledCameraMode.current = cameraMode;
        cameraTransitionUntil.current = performance.now() + 1500;
        map.easeTo({
          center: [loc.longitude, loc.latitude],
          pitch: is3D ? 60 : 0,
          bearing: 0,
          padding: { bottom: 0, top: 0, left: 0, right: 0 },
          zoom: 15.5,
          duration: 1500
        });
    } else if (cameraMode === 'GPS_ACQUIRE' && loc) {
      if (lastHandledCameraMode.current === 'GPS_ACQUIRE') return; // Prevent repeated triggers
      lastHandledCameraMode.current = cameraMode;
      
      // Update vehicle position immediately so it is visible during camera transition
      if (vehicle3DRef.current) {
        vehicle3DRef.current.updatePosition(loc.longitude, loc.latitude);
        if (loc.heading !== null) vehicle3DRef.current.updateHeading(loc.heading);
      }

      cameraTransitionUntil.current = performance.now() + 2500;
      
      // Snap map center to GPS location immediately to prevent flying across the world
      map.setCenter([loc.longitude, loc.latitude]);

      // Smoothly zoom in to the vehicle
      map.flyTo({ 
        center: [loc.longitude, loc.latitude], 
        zoom: 16, 
        pitch: is3D ? 60 : 0, 
        bearing: 0, 
        duration: 2000, 
        essential: true 
      });

      map.once('moveend', () => {
        if (cameraModeRef.current === 'GPS_ACQUIRE') {
          setCameraMode('OVERVIEW');
        }
      });
    }
  }, [cameraMode, mapStatus, activeRoute, is3D, setCameraMode, currentLocation]); 

  // Pass navigation state to vehicle layer
  useEffect(() => {
    if (vehicle3DRef.current) {
        vehicle3DRef.current.updateNavState(navState);
    }
  }, [navState]);

  // Update Vehicle Model & Camera smoothly via requestAnimationFrame
  const updateVisuals = useCallback((_location: GPSLocation) => {
    if (!mapRef.current || mapStatus !== 'READY') return;
    const map = mapRef.current;
    
    // Phase 3 & 4: Force location and camera state completely
    const longitude = -122.4194;
    const latitude = 37.7749;
    const heading = 0;

    if (vehicle3DRef.current) {
        vehicle3DRef.current.updatePosition(longitude, latitude);
        if (heading !== null) {
            vehicle3DRef.current.updateHeading(heading);
        }
    }

    // Phase 4: Force Camera state every frame just in case
    map.setCenter([longitude, latitude]);
    map.setZoom(18);
    map.setPitch(60);
    map.setBearing(0);
  }, [mapStatus]);

  useNavigationEngine(currentLocation, updateVisuals);

  // Destination Marker
  useEffect(() => {
    if (!mapRef.current || mapStatus !== 'READY') return;
    const targetLoc = destination || pickedLocation;

    if (targetLoc) {
      if (!destinationMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'destination-marker-wrapper relative';
        el.innerHTML = `
          <div class="w-4 h-4 bg-white rounded-full mx-auto shadow-[0_0_15px_white]"></div>
          <div class="w-0.5 h-8 bg-white/50 mx-auto"></div>
          <div class="absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap text-center text-white font-medium text-sm destination-name-label" style="text-shadow: 0 0 10px rgba(0, 210, 255, 0.5);"></div>
        `;
        destinationMarkerRef.current = new Marker({ element: el, anchor: 'bottom' }).setLngLat([targetLoc.lon, targetLoc.lat]).addTo(mapRef.current);
        const nameEl = el.querySelector('.destination-name-label');
        if (nameEl) nameEl.textContent = targetLoc.name || '';
      } else {
        destinationMarkerRef.current.setLngLat([targetLoc.lon, targetLoc.lat]);
        const nameEl = destinationMarkerRef.current.getElement().querySelector('.destination-name-label');
        if (nameEl) nameEl.textContent = targetLoc.name || '';
      }
    } else {
      if (destinationMarkerRef.current) { destinationMarkerRef.current.remove(); destinationMarkerRef.current = null; }
    }
  }, [destination, pickedLocation, mapStatus]);

  const toggle3D = () => setIs3D(!is3D);

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
          <button onClick={() => setRetryTrigger(prev => prev + 1)} className="px-6 py-2 bg-surface-elevated border border-border rounded-full hover:text-accent hover:border-accent transition-colors text-sm font-bold tracking-wider">RETRY</button>
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
            <span className="text-primary-muted mt-1 border-t border-white/10 pt-1">Vehicle:</span>
            <span className="mt-1 border-t border-white/10 pt-1 text-accent">AVAILABLE</span>
          </div>
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,#080A0D_100%)] opacity-60 z-10" />
      
      <div className="absolute bottom-8 right-8 flex flex-col gap-3 z-30">
        <button onClick={() => setShowDiagnostics(!showDiagnostics)} className="w-12 h-12 rounded-full glass-panel flex items-center justify-center transition-all shadow-lg text-primary hover:text-accent opacity-50 hover:opacity-100"><Bug className="w-5 h-5" /></button>
        {cameraMode === 'USER_EXPLORE' && currentLocation && mapStatus === 'READY' && (
          <button onClick={triggerRecenter} className="glass-panel text-primary hover:text-accent font-bold text-[10px] tracking-wider px-4 py-3 rounded-full flex items-center gap-2 mb-2 transition-all border-accent/30 bg-surface-elevated shadow-lg">
            <LocateFixed className="w-4 h-4" /> RE-CENTER
          </button>
        )}
        <div className="group relative">
          <button className="w-12 h-12 rounded-full glass-panel flex items-center justify-center transition-all shadow-lg text-primary hover:text-accent opacity-50 hover:opacity-100"><MapPin className="w-5 h-5" /></button>
          <div className="absolute right-14 top-1/2 -translate-y-1/2 whitespace-nowrap bg-surface-elevated px-3 py-1.5 rounded-lg text-xs font-bold text-primary-muted opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-border">TAP MAP TO PICK DESTINATION</div>
        </div>
        <button onClick={toggle3D} className={cn("w-12 h-12 rounded-full glass-panel flex items-center justify-center transition-all shadow-lg", is3D ? "text-accent border-accent/50 bg-accent/10" : "text-primary hover:text-accent")}><Compass className="w-6 h-6" /></button>
      </div>
    </div>
  );
};
