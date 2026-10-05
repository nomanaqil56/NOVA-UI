import { Calendar, PenTool, Clock } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export const MaintenancePage = () => {
  return (
    <div className="w-full h-full bg-[#080A0D] p-6 lg:p-8 text-primary overflow-y-auto hide-scrollbar flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex flex-col h-full">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6 flex-shrink-0">
          <div>
            <h1 className="text-3xl font-light tracking-widest text-white uppercase flex items-center gap-3">
              <PenTool className="w-8 h-8 text-accent" />
              Maintenance History
            </h1>
            <p className="text-sm text-primary-muted mt-2 tracking-wide">NOVA Technician Terminal · Service & Inspections</p>
          </div>
          
          <div className="glass-panel px-6 py-4 rounded-2xl border border-border flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="text-[10px] font-bold tracking-widest text-primary-muted uppercase mb-1">Next Scheduled Service</div>
              <div className="text-xl font-light tracking-tight text-white">in 1,240 km</div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex-1 min-h-0 relative">
          {/* Vertical Line */}
          <div className="absolute top-4 bottom-4 left-6 w-px bg-border" />
          
          <div className="space-y-8 pl-14">
            
            {/* Event 1 */}
            <div className="relative group">
              <div className="absolute -left-10 mt-1 w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] ring-4 ring-[#080A0D]" />
              <div className="glass-panel-elevated p-6 rounded-2xl border border-border group-hover:border-border/80 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-medium text-white tracking-tight">LiDAR Calibration</h3>
                  <Badge variant="SUCCESS">SUCCESS</Badge>
                </div>
                <div className="text-xs font-medium text-primary-muted flex items-center gap-2 mb-4">
                  <Clock className="w-3.5 h-3.5" /> 02 OCT 2026
                </div>
                <p className="text-sm text-primary-muted leading-relaxed">
                  Full 360-degree point cloud calibration performed. Spin motor nominal. No structural interference detected.
                </p>
              </div>
            </div>

            {/* Event 2 */}
            <div className="relative group">
              <div className="absolute -left-10 mt-1 w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] ring-4 ring-[#080A0D]" />
              <div className="glass-panel-elevated p-6 rounded-2xl border border-amber-500/30 group-hover:border-amber-500/50 transition-colors relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="flex justify-between items-start mb-2 relative z-10">
                  <h3 className="text-lg font-medium text-white tracking-tight">Camera Diagnostic</h3>
                  <Badge variant="WARNING">2 ANOMALIES</Badge>
                </div>
                <div className="text-xs font-medium text-primary-muted flex items-center gap-2 mb-4 relative z-10">
                  <Clock className="w-3.5 h-3.5" /> 01 OCT 2026
                </div>
                <p className="text-sm text-primary-muted leading-relaxed mb-4 relative z-10">
                  Diagnostic run on all 8 external cameras. Lens flaring detected on Right-Rear unit under direct sunlight conditions. Software debanding applied as temporary mitigation. Hardware replacement recommended.
                </p>
                <div className="bg-black/30 p-3 rounded-lg border border-border/50 text-xs font-mono text-primary-muted relative z-10">
                  LOG: WARN_CAM_RR_EXPOSURE_VARIANCE_HIGH
                </div>
              </div>
            </div>

            {/* Event 3 */}
            <div className="relative group">
              <div className="absolute -left-10 mt-1 w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] ring-4 ring-[#080A0D]" />
              <div className="glass-panel-elevated p-6 rounded-2xl border border-border group-hover:border-border/80 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-medium text-white tracking-tight">Brake Inspection</h3>
                  <Badge variant="SUCCESS">SUCCESS</Badge>
                </div>
                <div className="text-xs font-medium text-primary-muted flex items-center gap-2 mb-4">
                  <Clock className="w-3.5 h-3.5" /> 28 SEP 2026
                </div>
                <p className="text-sm text-primary-muted leading-relaxed">
                  Hydraulic pressure lines verified. Pad wear at 15%. Actuator response time within 10ms threshold.
                </p>
              </div>
            </div>

            {/* Event 4 */}
            <div className="relative group">
              <div className="absolute -left-10 mt-1 w-3 h-3 rounded-full bg-primary-muted shadow-[0_0_10px_rgba(255,255,255,0.1)] ring-4 ring-[#080A0D]" />
              <div className="glass-panel p-6 rounded-2xl border border-border group-hover:border-border/80 transition-colors opacity-75">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-medium text-white tracking-tight">Factory Rollout</h3>
                  <Badge variant="NOMINAL">INITIALIZED</Badge>
                </div>
                <div className="text-xs font-medium text-primary-muted flex items-center gap-2 mb-4">
                  <Clock className="w-3.5 h-3.5" /> 14 AUG 2026
                </div>
                <p className="text-sm text-primary-muted leading-relaxed">
                  Vehicle provisioned and added to active autonomous fleet registry.
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
