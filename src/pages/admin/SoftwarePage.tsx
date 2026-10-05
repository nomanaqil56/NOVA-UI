import { ArrowDownToLine, CheckCircle2, Clock, DownloadCloud, Radio, RefreshCw, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { useTelemetry } from '../../context/TelemetryContext';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { AlertTriangle } from 'lucide-react';

export const SoftwarePage = () => {
  const [isDeploying, setIsDeploying] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { addToast } = useToast();
  const { data, commands } = useTelemetry();

  const handleDeploy = () => {
    setIsDeploying(true);
    setShowConfirm(false);
    addToast('info', 'OTA Deployment initiated to fleet.');
    
    setTimeout(() => {
      setIsDeploying(false);
      addToast('success', 'NOVA OS 4.9.0 deployed successfully.');
      commands.updateSoftware('4.9.0');
    }, 3000);
  };

  const vehicles = [
    { id: 'Vehicle 042', status: 'READY', color: 'text-green-500 bg-green-500/10 border-green-500/30' },
    { id: 'Vehicle 018', status: 'DOWNLOADING', color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
    { id: 'Vehicle 031', status: 'UPDATED', color: 'text-accent bg-accent/10 border-accent/30' },
    { id: 'Vehicle 017', status: 'FAILED', color: 'text-red-500 bg-red-500/10 border-red-500/30' },
    { id: 'Vehicle 099', status: 'READY', color: 'text-green-500 bg-green-500/10 border-green-500/30' },
    { id: 'Vehicle 104', status: 'READY', color: 'text-green-500 bg-green-500/10 border-green-500/30' },
  ];

  return (
    <div className="w-full h-full bg-[#080A0D] p-6 lg:p-8 text-primary overflow-y-auto hide-scrollbar flex flex-col relative">
      
      {/* Confirmation Modal */}
      <Modal 
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Confirm Fleet Deployment"
        destructive={true}
        actions={
          <>
            <button 
              onClick={() => setShowConfirm(false)}
              className="px-4 py-2 rounded-lg text-xs font-bold tracking-widest uppercase text-primary-muted hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleDeploy}
              className="px-6 py-2 rounded-lg text-xs font-bold tracking-widest uppercase bg-accent text-black hover:bg-[#33dbff] transition-colors shadow-[0_0_15px_rgba(0,210,255,0.3)]"
            >
              Initiate Deployment
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p>
            You are about to deploy <span className="text-white font-bold">NOVA OS 4.9.0</span> to 142 vehicles. 
          </p>
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-amber-500/90 text-xs leading-relaxed">
              Vehicles currently in transit will download the update but will wait until parked to install. Active diagnostic sessions will be suspended during reboot.
            </p>
          </div>
        </div>
      </Modal>

      <div className="max-w-5xl mx-auto w-full flex flex-col h-full min-h-0">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6 flex-shrink-0">
          <div>
            <h1 className="text-3xl font-light tracking-widest text-white uppercase flex items-center gap-3">
              <Radio className="w-8 h-8 text-accent" />
              OTA Software Control
            </h1>
            <p className="text-sm text-primary-muted mt-2 tracking-wide">NOVA Fleet Operations · Over-The-Air Updates</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0">
          
          {/* Left Column: Version Control */}
          <div className="flex flex-col gap-6">
            
            {/* Current Version */}
            <div className="glass-panel p-6 rounded-2xl border border-border flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold tracking-widest text-primary-muted uppercase mb-2">Current Fleet Version</div>
              <div className="text-3xl font-light text-white tracking-tight">NOVA OS {data.osVersion}</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-surface-elevated border border-border flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-primary-muted" />
            </div>
          </div>

          {/* Available Update */}
          {data.osVersion === '4.8.2' ? (
            <div className="glass-panel-elevated p-8 rounded-2xl border border-accent/40 shadow-[0_0_30px_rgba(0,210,255,0.05)] relative overflow-hidden transition-all duration-300">
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="text-[10px] font-bold tracking-widest text-accent uppercase mb-2 flex items-center gap-2">
                    <DownloadCloud className="w-3.5 h-3.5" /> Available Update
                  </div>
                  <div className="text-4xl font-light text-white tracking-tight">NOVA OS 4.9.0</div>
                </div>
                <Badge variant="SUCCESS">READY FOR DEPLOYMENT</Badge>
              </div>

              <div className="space-y-4 mb-8">
                <div className="text-sm text-primary-muted leading-relaxed">
                  <strong className="text-primary font-medium">Release Notes:</strong><br/>
                  • Improved LiDAR sensor fusion in heavy precipitation<br/>
                  • Optimized trajectory planning for complex intersections<br/>
                  • Reduced CPU usage in the navigation engine by 12%<br/>
                  • Security patches for the telemetry uplink
                </div>
                <div className="flex items-center gap-6 text-xs text-primary-muted font-mono bg-black/40 p-3 rounded-lg border border-border/50">
                  <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Signature Valid</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Size: 1.4 GB</span>
                </div>
              </div>

              <button 
                onClick={() => setShowConfirm(true)}
                disabled={isDeploying}
                className={cn(
                  "w-full py-4 rounded-xl font-bold tracking-widest text-sm uppercase transition-all duration-300 flex items-center justify-center gap-3",
                  isDeploying 
                    ? "bg-accent/20 text-accent border border-accent/30 cursor-wait"
                    : "bg-accent text-black hover:bg-[#33dbff] shadow-[0_0_20px_rgba(0,210,255,0.3)]"
                )}
              >
                {isDeploying ? (
                  <><RefreshCw className="w-5 h-5 animate-spin" /> DEPLOYING UPDATE...</>
                ) : (
                  <><ArrowDownToLine className="w-5 h-5" /> DEPLOY TO FLEET</>
                )}
              </button>
            </div>
          ) : (
            <div className="glass-panel p-8 rounded-2xl border border-border flex flex-col items-center justify-center text-center opacity-50">
              <CheckCircle2 className="w-12 h-12 text-primary-muted mb-4" />
              <div className="text-sm font-medium text-primary-muted uppercase tracking-widest">System is up to date</div>
            </div>
          )}

        </div>

          {/* Right Column: Fleet Status */}
          <div className="glass-panel rounded-2xl border border-border flex flex-col h-full min-h-0 overflow-hidden">
            <div className="p-6 border-b border-border/50 bg-black/20 flex-shrink-0">
              <h3 className="text-xs font-bold tracking-widest text-primary-muted uppercase flex items-center justify-between">
                <span>Fleet Deployment Status</span>
                <span className="text-primary font-mono bg-surface px-2 py-0.5 rounded">142 Vehicles</span>
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto hide-scrollbar p-2">
              <div className="space-y-1">
                {vehicles.map((v, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl hover:bg-surface/50 transition-colors border border-transparent hover:border-border/50">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-border flex items-center justify-center">
                        <Radio className="w-4 h-4 text-primary-muted" />
                      </div>
                      <span className="font-semibold text-white tracking-wide">{v.id}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {(v.status === 'DOWNLOADING' || isDeploying) && (
                        <div className="w-24 h-1.5 bg-surface rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 w-[45%] rounded-full animate-pulse" />
                        </div>
                      )}
                      <Badge variant={isDeploying ? 'UPDATING' : v.status}>
                        {isDeploying ? 'UPDATING' : v.status}
                      </Badge>
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

