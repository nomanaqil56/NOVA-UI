import { useState } from 'react';
import { Wifi, AlertCircle, RefreshCw } from 'lucide-react';
import type { GPSState } from '../../types/navigation';
import { cn } from '../../lib/utils';

interface GPSStatusProps {
  gpsState: GPSState;
  accuracy: number | null;
  onEnableGPS: () => void;
}

export const GPSStatus = ({ gpsState, accuracy, onEnableGPS }: GPSStatusProps) => {
  if (gpsState === 'DISCONNECTED') {
    return (
      <div className="glass-panel-elevated rounded-2xl p-6 border-l-2 border-l-accent w-full max-w-sm fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 shadow-2xl">
        <h3 className="text-lg font-bold mb-2">LOCATION SERVICES</h3>
        <p className="text-sm text-primary-muted mb-6">Enable location to activate live vehicle navigation.</p>
        <button 
          onClick={() => {
            onEnableGPS();
          }}
          className="w-full bg-accent text-black font-bold py-3 rounded-xl hover:bg-accent/80 transition-colors"
        >
          ENABLE LOCATION
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      <div className={cn(
        "glass-panel rounded-full px-5 py-2 flex items-center gap-2 border",
        gpsState === 'CONNECTED' ? "border-green-500/30 bg-green-500/10 text-green-500" :
        gpsState === 'SEARCHING' ? "border-amber-500/30 bg-amber-500/10 text-amber-500" :
        "border-red-500/30 bg-red-500/10 text-red-500"
      )}>
        {gpsState === 'CONNECTED' && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
        {gpsState === 'SEARCHING' && <RefreshCw className="w-3 h-3 animate-spin" />}
        {gpsState === 'DENIED' && <AlertCircle className="w-3 h-3" />}
        {gpsState === 'ERROR' && <AlertCircle className="w-3 h-3" />}
        <span className="text-xs font-bold tracking-wider">
          {gpsState === 'CONNECTED' && 'CONNECTED'}
          {gpsState === 'SEARCHING' && 'SEARCHING...'}
          {gpsState === 'DENIED' && 'LOCATION BLOCKED'}
          {gpsState === 'ERROR' && 'GPS ERROR'}
        </span>
      </div>
      
      {gpsState === 'CONNECTED' && accuracy !== null && (
        <div className="glass-panel rounded-full px-5 py-2 flex items-center gap-2">
          <Wifi className="w-4 h-4 text-accent" />
          <span className="text-xs font-bold tracking-wider">±{accuracy.toFixed(1)}m GPS</span>
        </div>
      )}

      {(gpsState === 'DENIED' || gpsState === 'ERROR') && (
        <button 
          onClick={onEnableGPS}
          className="glass-panel rounded-full px-4 py-2 text-xs font-bold hover:text-accent transition-colors"
        >
          RETRY
        </button>
      )}
    </div>
  );
};
