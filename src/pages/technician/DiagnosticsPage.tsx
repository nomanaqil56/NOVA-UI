import { Activity, Battery, Camera, Circle, Compass, Crosshair, Map, Navigation, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useState } from 'react';

const systems = [
  { id: 'lidar', name: 'LiDAR Array', status: 'ONLINE', icon: Crosshair },
  { id: 'radar', name: 'RADAR', status: 'ONLINE', icon: Activity },
  { id: 'cameras', name: 'Vision Cameras', status: 'ONLINE', icon: Camera },
  { id: 'gps', name: 'GPS & GNSS', status: 'ONLINE', icon: Map },
  { id: 'imu', name: 'IMU', status: 'ONLINE', icon: Compass },
  { id: 'brakes', name: 'Braking System', status: 'ONLINE', icon: ShieldCheck },
  { id: 'steering', name: 'Steering', status: 'ONLINE', icon: Navigation },
  { id: 'battery', name: 'Battery', status: 'ONLINE', icon: Battery },
];

export const DiagnosticsPage = () => {
  const [activeSystem, setActiveSystem] = useState(systems[0]);

  return (
    <div className="w-full h-full bg-[#080A0D] p-6 lg:p-8 text-primary overflow-y-auto hide-scrollbar flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex flex-col h-full min-h-0">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6 flex-shrink-0">
          <div>
            <h1 className="text-3xl font-light tracking-widest text-white uppercase flex items-center gap-3">
              <Activity className="w-8 h-8 text-accent" />
              Diagnostic Workstation
            </h1>
            <p className="text-sm text-primary-muted mt-2 tracking-wide">NOVA Technician Terminal · Telemetry Diagnostics</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-light tracking-tight text-accent">VEHICLE #042</div>
            <div className="text-[10px] font-bold tracking-widest text-primary-muted mt-1 uppercase">Connection: SECURE TCP</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
          
          {/* Left Column: System Health */}
          <div className="lg:col-span-4 h-full flex flex-col">
            <div className="glass-panel rounded-2xl border border-border flex flex-col h-full overflow-hidden">
              <div className="p-5 border-b border-border/50 bg-black/40 flex-shrink-0">
                <h3 className="text-xs font-bold tracking-widest text-primary-muted uppercase">System Health</h3>
              </div>
              <div className="flex-1 overflow-y-auto hide-scrollbar p-3 space-y-1">
                {systems.map((sys) => {
                  const Icon = sys.icon;
                  return (
                    <button
                      key={sys.id}
                      onClick={() => setActiveSystem(sys)}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 border",
                        activeSystem.id === sys.id
                          ? "bg-accent/10 border-accent/30 shadow-[0_0_15px_rgba(0,210,255,0.05)]"
                          : "bg-surface border-transparent hover:bg-surface-elevated hover:border-border/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={cn("w-4 h-4", activeSystem.id === sys.id ? "text-accent" : "text-primary-muted")} />
                        <span className={cn("text-sm font-medium tracking-wide uppercase", activeSystem.id === sys.id ? "text-white" : "text-primary")}>{sys.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold tracking-widest text-primary-muted uppercase">{sys.status}</span>
                        <Circle className="w-2.5 h-2.5 fill-green-500 text-green-500" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Detailed View */}
          <div className="lg:col-span-8 flex flex-col gap-6 h-full min-h-0 overflow-y-auto hide-scrollbar">
            
            <div className="glass-panel-elevated p-6 rounded-2xl border border-border">
              <h3 className="text-xl font-light tracking-widest text-white uppercase mb-6 flex items-center gap-3">
                <activeSystem.icon className="w-6 h-6 text-accent" />
                {activeSystem.name} Details
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-black/40 p-4 rounded-xl border border-border/50">
                  <div className="text-[10px] font-bold tracking-widest text-primary-muted uppercase mb-1">Status</div>
                  <div className="text-green-500 font-medium">ONLINE</div>
                </div>
                <div className="bg-black/40 p-4 rounded-xl border border-border/50">
                  <div className="text-[10px] font-bold tracking-widest text-primary-muted uppercase mb-1">Latency</div>
                  <div className="text-white font-medium">12 ms</div>
                </div>
                <div className="bg-black/40 p-4 rounded-xl border border-border/50">
                  <div className="text-[10px] font-bold tracking-widest text-primary-muted uppercase mb-1">Uptime</div>
                  <div className="text-white font-medium">14d 2h</div>
                </div>
                <div className="bg-black/40 p-4 rounded-xl border border-border/50">
                  <div className="text-[10px] font-bold tracking-widest text-primary-muted uppercase mb-1">Firmware</div>
                  <div className="text-white font-medium font-mono">v4.2.1-rc2</div>
                </div>
              </div>

              {/* Visualization Placeholder */}
              <div className="h-64 rounded-xl border border-border/50 bg-black/60 relative overflow-hidden flex items-center justify-center group">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,210,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,210,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />
                
                {activeSystem.id === 'lidar' && (
                  <div className="relative z-10 text-center">
                    <Crosshair className="w-16 h-16 text-accent/40 mx-auto mb-4 animate-spin-slow" />
                    <div className="text-xs font-mono text-accent/60 uppercase tracking-widest">Awaiting Point Cloud Data Stream...</div>
                  </div>
                )}
                {activeSystem.id === 'cameras' && (
                  <div className="relative z-10 w-full h-full p-4 grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="bg-surface/50 border border-border/30 rounded flex items-center justify-center relative overflow-hidden">
                        <div className="absolute top-2 left-2 flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-[8px] font-mono text-white/50">CAM 0{i}</span>
                        </div>
                        <Camera className="w-6 h-6 text-primary-muted/20" />
                      </div>
                    ))}
                  </div>
                )}
                {activeSystem.id !== 'lidar' && activeSystem.id !== 'cameras' && (
                  <div className="relative z-10 text-center">
                    <Activity className="w-12 h-12 text-primary-muted/20 mx-auto mb-4" />
                    <div className="text-xs font-mono text-primary-muted/50 uppercase tracking-widest">Telemetry Visualization Offline</div>
                  </div>
                )}
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-border">
              <h3 className="text-xs font-bold tracking-widest text-primary-muted uppercase mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
                Raw Metric Stream
              </h3>
              <div className="font-mono text-xs text-primary-muted space-y-1 h-32 overflow-y-auto">
                <div>[14:42:01.244] {activeSystem.id.toUpperCase()}_CTRL: Heartbeat ACK (12ms)</div>
                <div>[14:42:01.350] {activeSystem.id.toUpperCase()}_CTRL: Nominal voltage 12.4V</div>
                <div>[14:42:01.401] {activeSystem.id.toUpperCase()}_DIAG: Thermal reading 42°C</div>
                <div>[14:42:01.844] {activeSystem.id.toUpperCase()}_CTRL: Heartbeat ACK (11ms)</div>
                <div>[14:42:02.012] {activeSystem.id.toUpperCase()}_SYNC: Frame alignment verified</div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
