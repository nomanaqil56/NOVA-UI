import { useTelemetry } from '../../context/TelemetryContext';
import { Bluetooth, RefreshCw, Car, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

export const VehicleConnectionOverlay = () => {
  const { data, setConnectionMode, connectVehicle } = useTelemetry();

  if (data.connectionState === 'CONNECTED') return null;

  return (
    <div className="absolute inset-0 z-[200] bg-[#080A0D]/90 backdrop-blur-xl flex flex-col items-center justify-center text-primary animate-in fade-in duration-500">
      <div className="glass-panel-elevated p-12 rounded-3xl border border-accent/20 flex flex-col items-center max-w-md text-center">
        <div className="relative mb-8">
          <div className={cn(
            "absolute inset-0 bg-accent/20 rounded-full blur-2xl transition-all duration-1000",
            data.connectionState === 'CONNECTING' ? 'scale-150 opacity-100 animate-pulse' : 'scale-100 opacity-0'
          )} />
          <div className="w-24 h-24 rounded-full border border-accent/30 bg-black/50 flex items-center justify-center relative z-10">
            {data.connectionState === 'CONNECTING' ? (
              <RefreshCw className="w-10 h-10 text-accent animate-spin" />
            ) : (
              <Bluetooth className="w-10 h-10 text-accent" />
            )}
          </div>
        </div>

        <h2 className="text-2xl font-light tracking-widest text-white uppercase mb-2">
          {data.connectionState === 'CONNECTING' ? 'Pairing Vehicle' : 'Vehicle Disconnected'}
        </h2>
        <p className="text-sm text-primary-muted leading-relaxed mb-8">
          {data.connectionState === 'CONNECTING' 
            ? 'Establishing secure Bluetooth Low Energy connection with NOVA Vehicle Node...' 
            : 'NOVA Operating System requires an active vehicle connection to display live telemetry and control subsystems.'}
        </p>

        {data.connectionState === 'DISCONNECTED' && (
          <div className="flex flex-col gap-4 w-full">
            <button 
              onClick={connectVehicle}
              className="w-full py-4 bg-accent/90 hover:bg-accent text-black font-bold tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(0,210,255,0.4)] flex items-center justify-center gap-3 uppercase text-xs"
            >
              <Bluetooth className="w-4 h-4" /> Connect Bluetooth
            </button>
            <button 
              onClick={() => setConnectionMode('DEMO')}
              className="w-full py-4 bg-surface border border-border hover:border-primary-muted text-primary-muted hover:text-white font-bold tracking-widest rounded-xl transition-all flex items-center justify-center gap-3 uppercase text-xs"
            >
              <Car className="w-4 h-4" /> Enter Demo Mode
            </button>
          </div>
        )}

        {data.connectionState === 'CONNECTING' && (
          <div className="w-full">
             <div className="flex justify-between items-center text-[10px] font-bold tracking-widest uppercase text-accent mb-2">
                <span>Handshake in progress</span>
                <span className="animate-pulse">...</span>
             </div>
             <div className="h-1 w-full bg-surface rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full w-1/2 animate-[pulse_1s_ease-in-out_infinite]" />
             </div>
             <button 
                onClick={() => setConnectionMode('DEMO')}
                className="mt-8 text-[10px] font-bold tracking-widest text-primary-muted hover:text-white transition-colors uppercase border-b border-primary-muted/30 pb-0.5"
             >
               Cancel & Use Demo Mode
             </button>
          </div>
        )}
      </div>

      <div className="absolute bottom-12 text-[10px] font-bold tracking-widest text-primary-muted uppercase flex items-center gap-2 opacity-50">
        <AlertTriangle className="w-3 h-3 text-amber-500" /> Ensure vehicle is in pairing mode
      </div>
    </div>
  );
};
