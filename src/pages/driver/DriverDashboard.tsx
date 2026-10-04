import { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { MapComponent } from '../../components/map/MapComponent';
import { DestinationSearch } from '../../components/navigation/DestinationSearch';
import { RoutePanel } from '../../components/navigation/RoutePanel';
import { GPSStatus } from '../../components/navigation/GPSStatus';
import { Battery, Zap, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNavigation } from '../../context/NavigationContext';
import { reverseGeocode } from '../../services/geocoding';

export const DriverDashboard = () => {
  const location = useLocation();
  const isIndex = location.pathname === '/driver' || location.pathname === '/driver/';

  const { 
    navState, gpsState, currentLocation, destination, routes, activeRoute,
    isDemoMode, setIsDemoMode, setDestination, startTrip, cancelTrip, 
    setActiveRouteId
  } = useNavigation();

  const [pickedLocation, setPickedLocation] = useState<{lat: number, lon: number, name?: string, loading: boolean, result?: any} | null>(null);
  const clickRequestId = useRef(0);
  
  // Vehicle Simulation State
  const [overrideState, setOverrideState] = useState<'AUTONOMOUS' | 'TAKING_CONTROL' | 'MANUAL'>('AUTONOMOUS');
  const [overrideHoldTime, setOverrideHoldTime] = useState(0);
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleOverrideDown = (e?: React.PointerEvent) => {
    if (e && e.pointerId && e.target) (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setOverrideState('TAKING_CONTROL');
    setOverrideHoldTime(0);
    if (holdTimer.current) clearInterval(holdTimer.current);
    
    let time = 0;
    holdTimer.current = setInterval(() => {
      time += 100;
      setOverrideHoldTime(time);
      if (time >= 2000) {
        setOverrideState('MANUAL');
        if (holdTimer.current) {
          clearInterval(holdTimer.current);
          holdTimer.current = null;
        }
      }
    }, 100);
  };

  const handleOverrideUp = (e?: React.PointerEvent) => {
    if (e && e.pointerId && e.target) (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    if (holdTimer.current) {
      clearInterval(holdTimer.current);
      holdTimer.current = null;
    }
    setOverrideState('AUTONOMOUS');
    setOverrideHoldTime(0);
  };

  useEffect(() => {
    return () => { if (holdTimer.current) clearInterval(holdTimer.current); };
  }, []);

  const handleMapClick = async (lat: number, lon: number, featureName?: string) => {
    if (navState === 'NAVIGATING' || navState === 'RECALCULATING') return;
    
    const currentId = ++clickRequestId.current;
    setPickedLocation({ lat, lon, name: featureName, loading: true });
    
    try {
      const result = await reverseGeocode(lat, lon);
      if (clickRequestId.current !== currentId) return;
      setPickedLocation({ lat, lon, name: result.name, loading: false, result });
    } catch {
      if (clickRequestId.current !== currentId) return;
      setPickedLocation({ lat, lon, name: 'Selected Location', loading: false, result: {
        placeId: `${lat},${lon}`,
        name: 'Selected Location',
        displayName: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        lat, lon, type: 'coordinate', score: 0, distance: 0
      } });
    }
  };

  const speed = currentLocation?.speed ?? 0;

  return (
    <div className="absolute inset-0 text-primary">
      <div className="absolute inset-0 z-0">
        <MapComponent onMapClick={handleMapClick} pickedLocation={pickedLocation} />
      </div>

      <Outlet context={{
        overrideActive: overrideState === 'MANUAL'
      }} />

      {isIndex && (
        <>
          {/* Top Left: Search & Destination */}
          <div className="absolute top-6 left-6 z-10 w-96 flex flex-col gap-4">
            {navState !== 'NAVIGATING' && navState !== 'RECALCULATING' && (
              <DestinationSearch 
                currentLocation={currentLocation}
                onSelect={(res) => setDestination(res)} 
              />
            )}
            
            {destination && (
              <RoutePanel 
                currentLocation={currentLocation}
                destination={destination}
                routes={routes}
                activeRouteId={activeRoute?.id || null}
                onSelectRoute={setActiveRouteId}
                onStartNavigation={startTrip}
                tripActive={navState === 'NAVIGATING' || navState === 'RECALCULATING'}
                onCancelTrip={cancelTrip}
              />
            )}
          </div>

          {/* Top Right: Status */}
          <div className="absolute top-6 right-6 z-10 flex flex-col gap-2 items-end">
            <GPSStatus gpsState={gpsState} accuracy={currentLocation?.accuracy || null} onEnableGPS={() => setIsDemoMode(!isDemoMode)} />
            {navState === 'RECALCULATING' && (
              <div className="glass-panel px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500 flex items-center gap-2 shadow-lg">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span className="text-[10px] font-bold tracking-wider">RECALCULATING ROUTE</span>
              </div>
            )}
          </div>

          {/* Picked Location */}
          {pickedLocation && navState !== 'NAVIGATING' && (
            <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20 w-80 animate-in slide-in-from-bottom-4 fade-in duration-300">
              <div className="glass-panel-elevated rounded-2xl p-5 border border-accent/50 shadow-[0_0_20px_rgba(0,210,255,0.1)] backdrop-blur-md">
                <h4 className="text-[10px] font-bold tracking-widest text-accent mb-3 uppercase">Select Destination</h4>
                {pickedLocation.loading ? (
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-4 h-4 animate-spin text-primary-muted" />
                    <span className="text-xs font-medium text-primary-muted tracking-wider">Acquiring location...</span>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <div className="font-semibold text-lg text-primary">{pickedLocation.result?.name || pickedLocation.name}</div>
                      <div className="text-xs text-primary-muted">{pickedLocation.result?.displayName || `${pickedLocation.lat.toFixed(4)}, ${pickedLocation.lon.toFixed(4)}`}</div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setPickedLocation(null)} className="flex-1 py-2 rounded-lg border border-border text-primary-muted hover:text-primary hover:bg-surface font-bold text-[10px] tracking-wider transition-colors">CANCEL</button>
                      <button onClick={() => { if (pickedLocation.result) setDestination(pickedLocation.result); setPickedLocation(null); }} className="flex-1 py-2 rounded-lg bg-accent text-black font-bold text-[10px] tracking-wider hover:bg-[#33dbff] transition-colors shadow-[0_0_15px_rgba(0,210,255,0.3)]">NAVIGATE HERE</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Bottom Left: Status & Override */}
          <div className="absolute bottom-8 left-6 z-10 flex flex-col gap-6 w-80">
            <div className="glass-panel-elevated rounded-2xl p-5 border border-border">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold tracking-widest text-primary-muted">SYSTEM STATUS</h4>
                <div className={cn("px-2 py-1 rounded text-[10px] font-bold flex items-center gap-2", overrideState === 'MANUAL' ? "bg-red-500/20 text-red-500" : overrideState === 'TAKING_CONTROL' ? "bg-amber-500/20 text-amber-500" : "bg-accent/20 text-accent")}>
                  <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", overrideState === 'MANUAL' ? "bg-red-500" : overrideState === 'TAKING_CONTROL' ? "bg-amber-500" : "bg-accent")} />
                  {overrideState === 'MANUAL' ? "MANUAL" : overrideState === 'TAKING_CONTROL' ? "TAKING CONTROL..." : "AUTONOMOUS"}
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-[10px] text-primary-muted mb-1 font-semibold uppercase tracking-wider">Vehicle Speed</div>
                  <div className="flex items-baseline gap-1"><span className="text-5xl font-light tabular-nums tracking-tighter">{speed.toFixed(0)}</span><span className="text-lg text-primary-muted font-medium">km/h</span></div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="text-[10px] text-primary-muted mb-2 font-semibold uppercase tracking-wider">Mode</div>
                  <button onClick={() => setIsDemoMode(!isDemoMode)} className={cn("text-xs font-bold px-3 py-1 rounded-full border transition-colors", isDemoMode ? "bg-amber-500/20 text-amber-500 border-amber-500/30" : "bg-surface-elevated text-primary-muted border-border hover:text-primary")}>
                    {isDemoMode ? 'DEMO MODE' : 'LIVE MODE'}
                  </button>
                </div>
              </div>
            </div>

            <button onPointerDown={handleOverrideDown} onPointerUp={handleOverrideUp} onPointerLeave={handleOverrideUp} className={cn("relative w-full h-16 rounded-xl border overflow-hidden transition-all duration-300 flex items-center justify-center gap-3 font-bold tracking-widest text-sm", overrideState === 'MANUAL' ? "bg-red-500 border-red-500 text-white shadow-[0_0_30px_rgba(255,59,48,0.5)]" : "bg-surface-elevated border-border text-primary hover:border-primary-muted touch-none")}>
              <div className="absolute left-0 top-0 bottom-0 bg-red-500/20 transition-all duration-100 ease-linear" style={{ width: `${(overrideHoldTime / 2000) * 100}%` }} />
              {overrideState === 'MANUAL' ? <><AlertTriangle className="w-5 h-5" /> MANUAL CONTROL ENGAGED</> : <><ShieldCheck className="w-5 h-5 text-accent" /> HOLD TO TAKE CONTROL</>}
            </button>
          </div>

          {/* Bottom Right: Vitals */}
          <div className="absolute bottom-8 right-8 z-10 w-72">
            <div className="glass-panel-elevated rounded-2xl p-5 grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-1.5 text-primary-muted mb-1"><Battery className="w-4 h-4" /> <span className="text-[10px] font-bold uppercase tracking-wider">Battery</span></div>
                <div className="text-xl font-semibold">78%</div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-primary-muted mb-1"><Zap className="w-4 h-4" /> <span className="text-[10px] font-bold uppercase tracking-wider">Range</span></div>
                <div className="text-xl font-semibold">312 <span className="text-xs text-primary-muted">km</span></div>
              </div>
              <div className="col-span-2 h-px bg-border my-1" />
              <div className="col-span-2 flex justify-between items-center text-sm">
                <span className="text-primary-muted font-medium">Sensors</span>
                <span className="font-semibold text-green-500">12 / 12 ONLINE</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
