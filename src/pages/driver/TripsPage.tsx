import { useState } from 'react';
import { Activity, ArrowRight, Battery, Calendar, Clock, Cpu, MapPin, Navigation, Shield, Waypoints, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Trip {
  id: string;
  origin: string;
  destination: string;
  distance: string;
  duration: string;
  status: 'AUTONOMOUS' | 'MANUAL INTERVENTION' | 'MANUAL';
  date: string;
  avgSpeed: string;
  energyConsumed: string;
  autonomousPercent: number;
  interventions: number;
  sensorEvents: number;
  alerts: number;
}

const mockTrips: Trip[] = [
  {
    id: 'TRP-1042',
    origin: 'Delhi',
    destination: 'Greater Noida',
    distance: '42.6 km',
    duration: '38 min',
    status: 'AUTONOMOUS',
    date: '02 OCT 2026',
    avgSpeed: '67.2 km/h',
    energyConsumed: '6.1 kWh',
    autonomousPercent: 100,
    interventions: 0,
    sensorEvents: 2,
    alerts: 0,
  },
  {
    id: 'TRP-1041',
    origin: 'Greater Noida',
    destination: 'Noida',
    distance: '31.2 km',
    duration: '29 min',
    status: 'AUTONOMOUS',
    date: '01 OCT 2026',
    avgSpeed: '64.5 km/h',
    energyConsumed: '4.4 kWh',
    autonomousPercent: 100,
    interventions: 0,
    sensorEvents: 0,
    alerts: 0,
  },
  {
    id: 'TRP-1040',
    origin: 'Noida',
    destination: 'Delhi',
    distance: '28.4 km',
    duration: '34 min',
    status: 'MANUAL INTERVENTION',
    date: '30 SEP 2026',
    avgSpeed: '50.1 km/h',
    energyConsumed: '4.8 kWh',
    autonomousPercent: 88,
    interventions: 1,
    sensorEvents: 12,
    alerts: 1,
  },
  {
    id: 'TRP-1039',
    origin: 'Delhi',
    destination: 'Gurugram',
    distance: '32.1 km',
    duration: '41 min',
    status: 'AUTONOMOUS',
    date: '28 SEP 2026',
    avgSpeed: '46.9 km/h',
    energyConsumed: '5.2 kWh',
    autonomousPercent: 100,
    interventions: 0,
    sensorEvents: 4,
    alerts: 0,
  }
];

export const TripsPage = () => {
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(mockTrips[0]);

  const StatCard = ({ label, value, icon: Icon, color }: { label: string, value: string, icon: any, color: string }) => (
    <div className="glass-panel-elevated p-6 rounded-2xl border border-border backdrop-blur-md flex flex-col justify-between hover:border-accent/30 transition-colors">
      <div className="flex items-start justify-between">
        <div className="text-[10px] font-bold tracking-widest text-primary-muted uppercase">{label}</div>
        <Icon className={cn("w-5 h-5", color)} />
      </div>
      <div className="text-2xl font-light tracking-tight mt-4">{value}</div>
    </div>
  );

  return (
    <div className="w-full h-full bg-[#080A0D] p-6 lg:p-8 text-primary flex flex-col overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-light tracking-widest text-white uppercase flex items-center gap-3">
            <Waypoints className="w-8 h-8 text-accent" />
            Journey Analytics
          </h1>
          <p className="text-sm text-primary-muted mt-2 tracking-wide">NOVA Autonomous Fleet · Trip History & Telemetry</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* Left Column: Aggregates & List */}
        <div className="lg:col-span-7 flex flex-col gap-6 h-full min-h-0">
          
          {/* Aggregate Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-shrink-0">
            <StatCard label="Total Distance" value="14,204 km" icon={Navigation} color="text-primary" />
            <StatCard label="Autonomous Dist" value="12,040 km" icon={Cpu} color="text-accent" />
            <StatCard label="Total Trips" value="286" icon={Activity} color="text-primary" />
            <StatCard label="Avg Efficiency" value="14.2 kWh" icon={Zap} color="text-green-500" />
          </div>

          {/* Trip List */}
          <div className="glass-panel rounded-2xl border border-border flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="p-5 border-b border-border/50 flex-shrink-0">
              <h3 className="text-xs font-bold tracking-widest text-primary-muted uppercase flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
                Recent Journeys
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto hide-scrollbar p-3 space-y-2">
              {mockTrips.map((trip) => (
                <button
                  key={trip.id}
                  onClick={() => setSelectedTrip(trip)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border transition-all duration-200 group flex items-center justify-between",
                    selectedTrip?.id === trip.id 
                      ? "bg-accent/10 border-accent/30 shadow-[0_0_15px_rgba(0,210,255,0.05)]" 
                      : "bg-surface border-transparent hover:bg-surface-elevated hover:border-border"
                  )}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <span className={cn("text-base font-medium", selectedTrip?.id === trip.id ? "text-accent" : "text-primary")}>
                        {trip.origin}
                      </span>
                      <ArrowRight className="w-4 h-4 text-primary-muted" />
                      <span className={cn("text-base font-medium", selectedTrip?.id === trip.id ? "text-accent" : "text-primary")}>
                        {trip.destination}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-medium text-primary-muted">
                      <div className="flex items-center gap-1.5"><Navigation className="w-3.5 h-3.5" />{trip.distance}</div>
                      <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{trip.duration}</div>
                      <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{trip.date}</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <span className={cn(
                      "text-[10px] font-bold tracking-wider px-2 py-0.5 rounded uppercase border",
                      trip.status === 'AUTONOMOUS' ? "bg-accent/10 text-accent border-accent/20" : 
                      trip.status === 'MANUAL INTERVENTION' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                      "bg-red-500/10 text-red-500 border-red-500/20"
                    )}>
                      {trip.status}
                    </span>
                    <span className="text-xs font-mono text-primary-muted opacity-50 group-hover:opacity-100 transition-opacity">
                      {trip.id}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Trip Details */}
        <div className="lg:col-span-5 h-full min-h-0">
          <div className="glass-panel-elevated rounded-2xl border border-border flex flex-col h-full overflow-hidden">
            {selectedTrip ? (
              <>
                {/* Visual Map Placeholder / Route Header */}
                <div className="h-48 relative border-b border-border/50 flex-shrink-0 flex flex-col justify-end p-6 bg-black/40 overflow-hidden group">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,210,255,0.1)_0%,transparent_70%)] pointer-events-none" />
                  
                  <div className="relative z-10 flex flex-col gap-1">
                    <div className="text-[10px] font-bold tracking-widest text-accent mb-2 uppercase">Trip Details</div>
                    <div className="text-2xl font-light tracking-tight flex items-center gap-3">
                      {selectedTrip.origin} <ArrowRight className="w-5 h-5 text-primary-muted" /> {selectedTrip.destination}
                    </div>
                    <div className="text-xs text-primary-muted mt-1 font-mono">{selectedTrip.id} · {selectedTrip.date}</div>
                  </div>

                  {/* Decorative map line */}
                  <div className="absolute top-1/4 right-8 left-1/2 opacity-20 pointer-events-none">
                    <svg viewBox="0 0 100 20" className="w-full h-full stroke-accent fill-none" preserveAspectRatio="none">
                      <path d="M0,10 Q25,20 50,10 T100,10" strokeWidth="2" strokeDasharray="4 4" className="animate-[dash_20s_linear_infinite]" />
                      <circle cx="0" cy="10" r="3" className="fill-accent stroke-none" />
                      <circle cx="100" cy="10" r="3" className="fill-accent stroke-none" />
                    </svg>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto hide-scrollbar p-6">
                  
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-surface p-4 rounded-xl border border-border/50">
                      <div className="text-[10px] text-primary-muted uppercase font-bold tracking-wider mb-1 flex items-center gap-1.5"><Navigation className="w-3 h-3"/> Distance</div>
                      <div className="text-xl font-semibold">{selectedTrip.distance}</div>
                    </div>
                    <div className="bg-surface p-4 rounded-xl border border-border/50">
                      <div className="text-[10px] text-primary-muted uppercase font-bold tracking-wider mb-1 flex items-center gap-1.5"><Clock className="w-3 h-3"/> Duration</div>
                      <div className="text-xl font-semibold">{selectedTrip.duration}</div>
                    </div>
                    <div className="bg-surface p-4 rounded-xl border border-border/50">
                      <div className="text-[10px] text-primary-muted uppercase font-bold tracking-wider mb-1 flex items-center gap-1.5"><Activity className="w-3 h-3"/> Avg Speed</div>
                      <div className="text-xl font-semibold">{selectedTrip.avgSpeed}</div>
                    </div>
                    <div className="bg-surface p-4 rounded-xl border border-border/50">
                      <div className="text-[10px] text-primary-muted uppercase font-bold tracking-wider mb-1 flex items-center gap-1.5"><Battery className="w-3 h-3"/> Energy</div>
                      <div className="text-xl font-semibold">{selectedTrip.energyConsumed}</div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-bold tracking-widest text-primary-muted uppercase mb-4 flex items-center gap-2">
                        <Cpu className="w-3 h-3" /> Autonomy Metrics
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-primary-muted">Autonomous Percentage</span>
                          <span className="font-semibold text-accent">{selectedTrip.autonomousPercent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full transition-all duration-1000" style={{ width: `${selectedTrip.autonomousPercent}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border/50">
                      <h4 className="text-[10px] font-bold tracking-widest text-primary-muted uppercase mb-4 flex items-center gap-2">
                        <Shield className="w-3 h-3" /> Incidents & Telemetry
                      </h4>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 rounded-lg bg-surface border border-border/30">
                          <span className="text-sm text-primary-muted font-medium">Manual Interventions</span>
                          <span className={cn("font-bold text-sm", selectedTrip.interventions > 0 ? "text-amber-500" : "text-green-500")}>
                            {selectedTrip.interventions}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-lg bg-surface border border-border/30">
                          <span className="text-sm text-primary-muted font-medium">Sensor Events</span>
                          <span className={cn("font-bold text-sm", selectedTrip.sensorEvents > 0 ? "text-amber-500" : "text-primary")}>
                            {selectedTrip.sensorEvents}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-lg bg-surface border border-border/30">
                          <span className="text-sm text-primary-muted font-medium">Critical Alerts</span>
                          <span className={cn("font-bold text-sm", selectedTrip.alerts > 0 ? "text-red-500" : "text-green-500")}>
                            {selectedTrip.alerts}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-50">
                <MapPin className="w-12 h-12 mb-4 text-primary-muted" />
                <div className="text-sm font-medium text-primary-muted uppercase tracking-widest">Select a trip to view details</div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
