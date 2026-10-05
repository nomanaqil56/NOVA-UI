import { Activity, Cpu, Database, Network, ShieldCheck, Server } from 'lucide-react';
import { cn } from '../../lib/utils';

export const SystemPage = () => {
  const StatBlock = ({ label, status, detail, icon: Icon, color }: { label: string, status: string, detail?: string, icon: any, color: string }) => (
    <div className="glass-panel p-6 rounded-2xl border border-border flex flex-col justify-between">
      <div className="flex items-start justify-between mb-4">
        <div className="text-[10px] font-bold tracking-widest text-primary-muted uppercase">{label}</div>
        <Icon className={cn("w-5 h-5", color)} />
      </div>
      <div>
        <div className={cn("text-xl font-semibold tracking-tight", color)}>{status}</div>
        {detail && <div className="text-xs text-primary-muted mt-1 font-mono">{detail}</div>}
      </div>
    </div>
  );

  return (
    <div className="w-full h-full bg-[#080A0D] p-6 lg:p-8 text-primary overflow-y-auto hide-scrollbar flex flex-col">
      <div className="max-w-6xl mx-auto w-full flex flex-col h-full">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6 flex-shrink-0">
          <div>
            <h1 className="text-3xl font-light tracking-widest text-white uppercase flex items-center gap-3">
              <Server className="w-8 h-8 text-accent" />
              System Overview
            </h1>
            <p className="text-sm text-primary-muted mt-2 tracking-wide">NOVA Infrastructure · Global Telemetry & Compute</p>
          </div>
          
          <div className="px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse" />
            <span className="text-xs font-bold tracking-widest text-green-500 uppercase">System Nominal</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
          
          {/* Left Column: Metrics */}
          <div className="lg:col-span-8 flex flex-col gap-6 h-full overflow-y-auto hide-scrollbar">
            
            {/* Core Systems */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatBlock label="NOVA Core" status="ONLINE" icon={ShieldCheck} color="text-green-500" />
              <StatBlock label="Autonomous Eng" status="ONLINE" icon={Activity} color="text-green-500" />
              <StatBlock label="Navigation Eng" status="ONLINE" icon={Network} color="text-green-500" />
              <StatBlock label="AI Compute" status="4 / 4 NODES" icon={Cpu} color="text-accent" />
            </div>

            {/* Resource Utilization */}
            <div className="glass-panel-elevated p-6 rounded-2xl border border-border">
              <h3 className="text-xs font-bold tracking-widest text-primary-muted uppercase mb-6 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
                Resource Utilization
              </h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center gap-2 text-primary-muted">
                      <Cpu className="w-4 h-4" />
                      <span className="text-[10px] font-bold tracking-widest uppercase">CPU Usage</span>
                    </div>
                    <span className="text-xl font-mono text-white">42%</span>
                  </div>
                  <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden border border-border/50">
                    <div className="h-full bg-accent rounded-full w-[42%]" />
                  </div>
                  <div className="flex justify-between mt-1 text-[10px] text-primary-muted font-mono opacity-50">
                    <span>Node 1: 45%</span>
                    <span>Node 2: 38%</span>
                    <span>Node 3: 41%</span>
                    <span>Node 4: 44%</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center gap-2 text-primary-muted">
                      <Database className="w-4 h-4" />
                      <span className="text-[10px] font-bold tracking-widest uppercase">Memory Usage</span>
                    </div>
                    <span className="text-xl font-mono text-white">61%</span>
                  </div>
                  <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden border border-border/50">
                    <div className="h-full bg-amber-500 rounded-full w-[61%]" />
                  </div>
                  <div className="flex justify-between mt-1 text-[10px] text-primary-muted font-mono opacity-50">
                    <span>Used: 78.4 GB</span>
                    <span>Total: 128 GB</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center gap-2 text-primary-muted">
                      <Network className="w-4 h-4" />
                      <span className="text-[10px] font-bold tracking-widest uppercase">Fleet Network</span>
                    </div>
                    <span className="text-xl font-mono text-white">99.9%</span>
                  </div>
                  <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden border border-border/50">
                    <div className="h-full bg-green-500 rounded-full w-[99.9%]" />
                  </div>
                  <div className="flex justify-between mt-1 text-[10px] text-primary-muted font-mono opacity-50">
                    <span>Latency: 12ms</span>
                    <span>Bandwidth: 2.4 GB/s</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Events Log */}
          <div className="lg:col-span-4 h-full flex flex-col">
            <div className="glass-panel-elevated p-6 rounded-2xl border border-border flex-1 flex flex-col min-h-0">
              <h3 className="text-xs font-bold tracking-widest text-primary-muted uppercase mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  System Events
                </span>
                <span className="px-2 py-0.5 rounded bg-surface border border-border text-[10px]">LIVE</span>
              </h3>
              
              <div className="flex-1 overflow-y-auto hide-scrollbar space-y-3 -mx-2 px-2">
                
                {[
                  { id: 1, type: 'info', msg: 'Database sync completed successfully', time: '14:32:01' },
                  { id: 2, type: 'info', msg: 'Vehicle #042 telemetry connection established', time: '14:31:15' },
                  { id: 3, type: 'warn', msg: 'Latency spike detected on regional relay EU-W', time: '14:28:44' },
                  { id: 4, type: 'info', msg: 'Autonomous Engine map tile cache updated', time: '14:15:00' },
                  { id: 5, type: 'info', msg: 'User Alex Kumar authenticated (Admin)', time: '14:02:11' },
                  { id: 6, type: 'warn', msg: 'API rate limit warning: internal microservice', time: '13:55:20' },
                  { id: 7, type: 'info', msg: 'Daily log rotation triggered', time: '00:00:01' },
                ].map(evt => (
                  <div key={evt.id} className="p-3 rounded-xl bg-black/30 border border-border/30 hover:border-border/80 transition-colors group">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {evt.type === 'info' ? (
                          <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_5px_rgba(0,210,255,0.5)]" />
                        ) : evt.type === 'warn' ? (
                          <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-primary/90 leading-relaxed">{evt.msg}</div>
                        <div className="text-[10px] text-primary-muted font-mono mt-1 opacity-50 group-hover:opacity-100 transition-opacity">{evt.time}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
