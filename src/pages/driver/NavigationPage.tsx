import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { 
  Navigation, MapPin, History, Map as MapIcon, 
  Volume2, ShieldAlert, Flag, Plus, X, Cpu
} from 'lucide-react';
import { DestinationSearch } from '../../components/navigation/DestinationSearch';
import { cn } from '../../lib/utils';
import type { GeocodingResult, GPSLocation, GPSState, RouteOption } from '../../types/navigation';

interface NavContext {
  destination: GeocodingResult | null;
  setDestination: (d: GeocodingResult | null) => void;
  routes: RouteOption[];
  setRoutes: (r: RouteOption[]) => void;
  activeRouteId: string | null;
  setActiveRouteId: (id: string | null) => void;
  tripActive: boolean;
  setTripActive: (a: boolean) => void;
  currentLocation: GPSLocation | null;
  gpsState: GPSState;
  handleEnableGPS: () => void;
  is3D: boolean;
  setIs3D: (val: boolean) => void;
  isFollowing: boolean;
  setIsFollowing: (val: boolean) => void;
  triggerOverview: () => void;
}

interface SavedPlace {
  id: string;
  name: string;
  lat: number;
  lon: number;
  type: 'HOME' | 'WORK' | 'FAVORITE';
}

interface NavHistoryEntry {
  id: string;
  name: string;
  lat: number;
  lon: number;
  timestamp: number;
  distanceKm?: number;
  durationMin?: number;
}

export const NavigationPage = () => {
  const navigate = useNavigate();
  const ctx = useOutletContext<NavContext>();
  
  // Local state for persistence
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [recentDestinations, setRecentDestinations] = useState<NavHistoryEntry[]>([]);
  const [tripStops, setTripStops] = useState<{id: string, name: string}[]>([]);
  
  // Settings state
  const [preferences, setPreferences] = useState({
    avoidTolls: false,
    avoidHighways: false,
    voiceGuidance: true,
    autoMode: 'AUTONOMOUS'
  });
  
  // Load from localStorage on mount
  useEffect(() => {
    try {
      const sp = localStorage.getItem('nova_saved_places');
      if (sp) setSavedPlaces(JSON.parse(sp));
      
      const rd = localStorage.getItem('nova_recent_destinations');
      if (rd) setRecentDestinations(JSON.parse(rd));
      
      const pref = localStorage.getItem('nova_nav_preferences');
      if (pref) setPreferences(JSON.parse(pref));
    } catch(e) {
      console.error('Failed to parse local storage', e);
    }
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    localStorage.setItem('nova_saved_places', JSON.stringify(savedPlaces));
  }, [savedPlaces]);
  
  useEffect(() => {
    localStorage.setItem('nova_recent_destinations', JSON.stringify(recentDestinations));
  }, [recentDestinations]);
  
  useEffect(() => {
    localStorage.setItem('nova_nav_preferences', JSON.stringify(preferences));
  }, [preferences]);

  // Handle saving to history when navigation starts
  useEffect(() => {
    if (ctx?.tripActive && ctx?.destination) {
      setRecentDestinations(prev => {
        const newEntry: NavHistoryEntry = {
          id: Date.now().toString(),
          name: ctx.destination!.name,
          lat: ctx.destination!.lat,
          lon: ctx.destination!.lon,
          timestamp: Date.now(),
        };
        const filtered = prev.filter(p => p.name !== ctx.destination!.name);
        return [newEntry, ...filtered].slice(0, 10);
      });
    }
  }, [ctx?.tripActive, ctx?.destination]);

  if (!ctx) return null;
  
  const { 
    destination, setDestination, routes, setRoutes, activeRouteId, setActiveRouteId,
    tripActive, setTripActive, currentLocation, gpsState,
    is3D, setIs3D, isFollowing, setIsFollowing, triggerOverview
  } = ctx;

  const activeRoute = routes.find(r => r.id === activeRouteId);
  
  let displayDistance = activeRoute?.distance || 0;
  let displayDuration = activeRoute?.duration || 0;

  if (tripActive && currentLocation && activeRoute) {
    const coords = activeRoute.geometry.coordinates;
    if (coords && coords.length > 0) {
      let closestIdx = 0;
      let minDist = Infinity;
      
      const getDist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3;
        const p1 = lat1 * Math.PI/180;
        const p2 = lat2 * Math.PI/180;
        const dp = (lat2-lat1) * Math.PI/180;
        const dl = (lon2-lon1) * Math.PI/180;
        const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      };

      for(let i=0; i<coords.length; i++) {
        const d = getDist(currentLocation.latitude, currentLocation.longitude, coords[i][1], coords[i][0]);
        if(d < minDist) { minDist = d; closestIdx = i; }
      }
      
      let remainingDist = 0;
      for(let i=closestIdx; i<coords.length-1; i++) {
        remainingDist += getDist(coords[i][1], coords[i][0], coords[i+1][1], coords[i+1][0]);
      }
      
      const avgSpeed = activeRoute.distance > 0 ? (activeRoute.distance / activeRoute.duration) : 1;
      displayDistance = remainingDist;
      displayDuration = remainingDist / avgSpeed;
    }
  }
  
  const handleDestinationSelect = (res: GeocodingResult) => {
    setDestination(res);
    setRoutes([]);
    setActiveRouteId(null);
  };

  const handleSavedPlaceSelect = (place: SavedPlace) => {
    handleDestinationSelect({
      placeId: place.id,
      name: place.name,
      displayName: place.name,
      lat: place.lat,
      lon: place.lon,
      type: 'place',
      score: 0,
      distance: 0
    });
  };

  const handleRecentSelect = (entry: NavHistoryEntry) => {
    handleDestinationSelect({
      placeId: entry.id,
      name: entry.name,
      displayName: entry.name,
      lat: entry.lat,
      lon: entry.lon,
      type: 'place',
      score: 0,
      distance: 0
    });
  };

  return (
    <div className="absolute inset-0 z-20 pointer-events-none p-6 flex gap-6">
      
      {/* Left Column - Main Navigation Center */}
      <div className="w-[450px] h-full flex flex-col gap-4 pointer-events-auto overflow-y-auto hide-scrollbar">
        
        {/* Header */}
        <div className="glass-panel-elevated p-5 rounded-2xl border border-border flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-xl font-light tracking-widest text-primary flex items-center gap-3">
              <Navigation className="w-6 h-6 text-accent" />
              NAVIGATION CENTER
            </h1>
          </div>
          <button onClick={() => navigate('/driver')} className="w-8 h-8 rounded-full bg-surface hover:bg-surface-elevated flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-primary-muted" />
          </button>
        </div>

        {/* Search */}
        <div className="shrink-0">
          <DestinationSearch 
            currentLocation={currentLocation}
            onSelect={handleDestinationSelect} 
          />
        </div>

        {/* Active Trip Summary */}
        {destination && (
          <div className="glass-panel-elevated p-5 rounded-2xl border border-accent/30 shadow-[0_0_20px_rgba(0,210,255,0.05)] shrink-0">
            <h2 className="text-xs font-bold tracking-widest text-accent mb-4 uppercase">Current Target</h2>
            <div className="text-xl font-semibold mb-1">{destination.name}</div>
            
            {activeRoute ? (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <div className="text-[10px] text-primary-muted font-bold tracking-widest uppercase mb-1">ETA</div>
                  <div className="text-lg tabular-nums">
                    {Math.max(1, Math.round(displayDuration / 60))} <span className="text-xs text-primary-muted font-medium">min</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-primary-muted font-bold tracking-widest uppercase mb-1">Distance</div>
                  <div className="text-lg tabular-nums">
                    {(displayDistance / 1000).toFixed(1)} <span className="text-xs text-primary-muted font-medium">km</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-primary-muted mt-2">Calculating routes...</div>
            )}
            
            {routes.length > 1 && !tripActive && (
              <div className="mt-4 flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                {routes.map(r => (
                  <button 
                    key={r.id}
                    onClick={() => setActiveRouteId(r.id)}
                    className={cn(
                      "px-3 py-2 rounded-lg border text-xs font-bold tracking-wider whitespace-nowrap transition-colors",
                      activeRouteId === r.id 
                        ? "border-accent bg-accent/10 text-accent" 
                        : "border-border bg-surface text-primary-muted hover:text-primary"
                    )}
                  >
                    {r.type ? r.type.toUpperCase() : 'ROUTE'} ({(r.distance/1000).toFixed(1)}km)
                  </button>
                ))}
              </div>
            )}
            
            <div className="mt-4 flex gap-2">
              {!tripActive ? (
                <button 
                  onClick={() => setTripActive(true)}
                  disabled={!activeRoute}
                  className="flex-1 py-3 bg-accent text-black font-bold text-xs tracking-widest rounded-xl hover:bg-[#33dbff] transition-all shadow-[0_0_20px_rgba(0,210,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  START NAVIGATION
                </button>
              ) : (
                <button 
                  onClick={() => {
                    setTripActive(false);
                    setDestination(null);
                  }}
                  className="flex-1 py-3 bg-red-500 text-white font-bold text-xs tracking-widest rounded-xl hover:bg-red-400 transition-colors shadow-[0_0_20px_rgba(255,59,48,0.2)]"
                >
                  END TRIP
                </button>
              )}
            </div>
          </div>
        )}

        {/* Quick Destinations / Saved */}
        <div className="glass-panel p-5 rounded-2xl border border-border shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-bold tracking-widest text-primary-muted uppercase">Saved Places</h2>
            <button className="text-accent hover:text-[#33dbff]"><Plus className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {['HOME', 'WORK', 'FAVORITE'].map(type => {
              const place = savedPlaces.find(p => p.type === type);
              return (
                <button 
                  key={type}
                  onClick={() => place && handleSavedPlaceSelect(place)}
                  className="p-3 rounded-xl bg-surface hover:bg-surface-elevated border border-border flex flex-col items-center gap-2 transition-colors group"
                >
                  {type === 'HOME' && <MapPin className="w-5 h-5 text-primary-muted group-hover:text-accent" />}
                  {type === 'WORK' && <MapIcon className="w-5 h-5 text-primary-muted group-hover:text-accent" />}
                  {type === 'FAVORITE' && <Flag className="w-5 h-5 text-primary-muted group-hover:text-accent" />}
                  <span className="text-[10px] font-bold tracking-wider">{type}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Multi-stop Trip Planner */}
        <div className="glass-panel p-5 rounded-2xl border border-border shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-bold tracking-widest text-primary-muted uppercase">Trip Plan</h2>
            <button onClick={() => setTripStops([...tripStops, {id: Date.now().toString(), name: 'New Stop'}])} className="text-accent hover:text-[#33dbff] text-xs font-bold">+ Add Stop</button>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border/50 opacity-50">
              <div className="w-5 h-5 rounded bg-surface-elevated flex items-center justify-center text-[10px] font-bold">00</div>
              <div className="flex-1 text-sm font-semibold truncate">Current Location</div>
            </div>
            {tripStops.map((stop, idx) => (
              <div key={stop.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border/50 group">
                <div className="w-5 h-5 rounded bg-accent/20 text-accent flex items-center justify-center text-[10px] font-bold">{String(idx + 1).padStart(2, '0')}</div>
                <div className="flex-1 text-sm font-semibold truncate">{stop.name}</div>
                <button onClick={() => setTripStops(tripStops.filter(s => s.id !== stop.id))} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {destination && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/10 border border-accent/50 text-accent">
                <div className="w-5 h-5 rounded bg-accent text-black flex items-center justify-center text-[10px] font-bold">{String(tripStops.length + 1).padStart(2, '0')}</div>
                <div className="flex-1 text-sm font-bold truncate">{destination.name}</div>
              </div>
            )}
          </div>
          <div className="text-[10px] text-amber-500 italic mt-3">Multi-stop optimization unsupported by current engine</div>
        </div>

        {/* History */}
        <div className="glass-panel p-5 rounded-2xl border border-border shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-bold tracking-widest text-primary-muted uppercase">Navigation History</h2>
            {recentDestinations.length > 0 && (
              <button onClick={() => setRecentDestinations([])} className="text-xs text-red-400 hover:text-red-300 transition-colors">Clear</button>
            )}
          </div>
          {recentDestinations.length === 0 ? (
            <div className="text-sm text-primary-muted italic">No recent trips</div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentDestinations.map(entry => {
                const isToday = new Date(entry.timestamp).toDateString() === new Date().toDateString();
                return (
                  <div key={entry.id} className="flex flex-col gap-2 p-3 rounded-xl bg-surface hover:bg-surface-elevated border border-border/50 transition-colors group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <History className="w-4 h-4 text-primary-muted" />
                        <div>
                          <div className="text-sm font-semibold">{entry.name}</div>
                          <div className="text-[10px] text-primary-muted mt-0.5">{isToday ? 'TODAY' : new Date(entry.timestamp).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2 h-0 overflow-hidden group-hover:h-auto opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => handleRecentSelect(entry)} className="flex-1 py-1.5 rounded-lg bg-surface-elevated text-xs font-bold hover:text-accent border border-border">Navigate Again</button>
                      <button onClick={() => setSavedPlaces([...savedPlaces, {id: entry.id, name: entry.name, lat: entry.lat, lon: entry.lon, type: 'FAVORITE'}])} className="flex-1 py-1.5 rounded-lg bg-surface-elevated text-xs font-bold hover:text-accent border border-border">Save Place</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Secondary Settings */}
      <div className="w-[350px] h-full flex flex-col gap-4 pointer-events-auto overflow-y-auto hide-scrollbar">
        
        {/* Navigation Status */}
        <div className="glass-panel-elevated p-5 rounded-2xl border border-border shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Cpu className="w-24 h-24" />
          </div>
          <h2 className="text-[10px] font-bold tracking-widest text-primary-muted uppercase mb-4">Navigation Status</h2>
          
          <div className="flex flex-col gap-4 relative z-10">
            <div className="flex justify-between items-center">
              <span className="text-sm text-primary-muted">GPS</span>
              <span className={cn("text-xs font-bold tracking-wider", gpsState === 'CONNECTED' ? "text-green-400" : "text-amber-400")}>
                {gpsState}
              </span>
            </div>
            <div className="h-px bg-border/50" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-primary-muted">Routing Engine</span>
              <span className="text-xs font-bold tracking-wider text-green-400">READY</span>
            </div>
            <div className="h-px bg-border/50" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-primary-muted">Vehicle Control</span>
              <span className="text-xs font-bold tracking-wider text-amber-400">SIMULATION</span>
            </div>
          </div>
        </div>

        {/* Autonomous Mode */}
        <div className="glass-panel p-5 rounded-2xl border border-border shrink-0">
          <h2 className="text-[10px] font-bold tracking-widest text-primary-muted uppercase mb-4">Driving Mode</h2>
          <div className="flex flex-col gap-2">
            {['AUTONOMOUS', 'ASSISTED', 'MANUAL'].map(mode => (
              <button 
                key={mode}
                onClick={() => setPreferences(p => ({ ...p, autoMode: mode }))}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                  preferences.autoMode === mode 
                    ? "bg-accent/10 border-accent/50 text-accent" 
                    : "bg-surface border-border text-primary hover:border-primary-muted"
                )}
              >
                <div className={cn("w-3 h-3 rounded-full border-2", preferences.autoMode === mode ? "border-accent bg-accent" : "border-primary-muted")} />
                <span className="text-xs font-bold tracking-widest">{mode}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Route Preferences */}
        <div className="glass-panel p-5 rounded-2xl border border-border shrink-0">
          <h2 className="text-[10px] font-bold tracking-widest text-primary-muted uppercase mb-4">Route Preferences</h2>
          <div className="flex flex-col gap-4">
            <label className="flex justify-between items-center cursor-pointer group">
              <span className="text-sm text-primary group-hover:text-accent transition-colors">Avoid Tolls</span>
              <div className={cn("w-10 h-5 rounded-full transition-colors relative", preferences.avoidTolls ? "bg-accent" : "bg-surface-elevated")}>
                <div className={cn("w-3 h-3 bg-white rounded-full absolute top-1 transition-all", preferences.avoidTolls ? "left-6" : "left-1")} />
              </div>
              <input type="checkbox" className="hidden" checked={preferences.avoidTolls} onChange={() => setPreferences(p => ({...p, avoidTolls: !p.avoidTolls}))} />
            </label>
            <label className="flex justify-between items-center cursor-pointer group">
              <span className="text-sm text-primary group-hover:text-accent transition-colors">Avoid Highways</span>
              <div className={cn("w-10 h-5 rounded-full transition-colors relative", preferences.avoidHighways ? "bg-accent" : "bg-surface-elevated")}>
                <div className={cn("w-3 h-3 bg-white rounded-full absolute top-1 transition-all", preferences.avoidHighways ? "left-6" : "left-1")} />
              </div>
              <input type="checkbox" className="hidden" checked={preferences.avoidHighways} onChange={() => setPreferences(p => ({...p, avoidHighways: !p.avoidHighways}))} />
            </label>
            <div className="flex justify-between items-center opacity-50">
              <span className="text-sm text-primary flex items-center gap-2">Avoid Ferries <ShieldAlert className="w-3 h-3" /></span>
              <div className="w-10 h-5 rounded-full bg-surface-elevated relative">
                <div className="w-3 h-3 bg-white/50 rounded-full absolute top-1 left-1" />
              </div>
            </div>
            <div className="text-[10px] text-amber-500 italic mt-[-8px]">Ferry routing unsupported by current engine</div>
          </div>
        </div>

        {/* Map View */}
        <div className="glass-panel p-5 rounded-2xl border border-border shrink-0">
          <h2 className="text-[10px] font-bold tracking-widest text-primary-muted uppercase mb-4">Map View</h2>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setIsFollowing(true)}
              className={cn("p-3 border rounded-xl text-xs font-bold tracking-wider transition-colors", isFollowing ? "bg-accent/10 border-accent/50 text-accent" : "bg-surface border-border text-primary hover:border-primary-muted")}
            >
              Follow
            </button>
            <button 
              onClick={() => { setIsFollowing(false); setIs3D(false); }}
              className={cn("p-3 border rounded-xl text-xs font-bold tracking-wider transition-colors", !isFollowing && !is3D ? "bg-accent/10 border-accent/50 text-accent" : "bg-surface border-border text-primary hover:border-primary-muted")}
            >
              North Up
            </button>
            <button 
              onClick={() => setIs3D(!is3D)}
              className={cn("p-3 border rounded-xl text-xs font-bold tracking-wider transition-colors", is3D ? "bg-accent/10 border-accent/50 text-accent" : "bg-surface border-border text-primary hover:border-primary-muted")}
            >
              3D View
            </button>
            <button 
              onClick={() => triggerOverview()}
              disabled={!activeRouteId}
              className="p-3 border rounded-xl text-xs font-bold tracking-wider transition-colors bg-surface border-border text-primary hover:border-primary-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Overview
            </button>
          </div>
        </div>

        {/* Guidance */}
        <div className="glass-panel p-5 rounded-2xl border border-border shrink-0 mb-8">
          <h2 className="text-[10px] font-bold tracking-widest text-primary-muted uppercase mb-4">Guidance</h2>
          <label className="flex justify-between items-center cursor-pointer group">
            <span className="text-sm text-primary flex items-center gap-2 group-hover:text-accent transition-colors">
              <Volume2 className="w-4 h-4" /> Voice Guidance
            </span>
            <div className={cn("w-10 h-5 rounded-full transition-colors relative", preferences.voiceGuidance ? "bg-accent" : "bg-surface-elevated")}>
              <div className={cn("w-3 h-3 bg-white rounded-full absolute top-1 transition-all", preferences.voiceGuidance ? "left-6" : "left-1")} />
            </div>
            <input type="checkbox" className="hidden" checked={preferences.voiceGuidance} onChange={() => setPreferences(p => ({...p, voiceGuidance: !p.voiceGuidance}))} />
          </label>
        </div>

      </div>

    </div>
  );
};
