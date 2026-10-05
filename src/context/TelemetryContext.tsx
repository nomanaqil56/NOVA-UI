import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { TelemetryData, DriveMode } from '../lib/telemetry/types';
import { VehicleDataService } from '../lib/telemetry/VehicleDataService';
import type { VehicleDataProvider } from '../lib/telemetry/VehicleDataProvider';

interface TelemetryContextType {
  data: TelemetryData;
  commands: {
    setDriveMode: (mode: DriveMode) => Promise<void>;
    setAutonomousMode: (enabled: boolean) => Promise<void>;
    requestDiagnostics: () => Promise<void>;
    acknowledgeAlert: (alertId: string) => Promise<void>;
    updateSoftware: (version: string) => Promise<void>;
  };
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export const TelemetryProvider = ({ children }: { children: ReactNode }) => {
  const provider = useMemo<VehicleDataProvider>(() => VehicleDataService.getProvider(), []);
  const [data, setData] = useState<TelemetryData | null>(null);

  useEffect(() => {
    provider.connect();
    
    const unsubscribe = provider.subscribe((newData) => {
      setData(newData);
    });

    return () => {
      unsubscribe();
      // Optional: disconnect on unmount, but for a global provider we might just leave it connected
    };
  }, [provider]);

  const commands = useMemo(() => ({
    setDriveMode: (mode: DriveMode) => provider.setDriveMode(mode),
    setAutonomousMode: (enabled: boolean) => provider.setAutonomousMode(enabled),
    requestDiagnostics: () => provider.requestDiagnostics(),
    acknowledgeAlert: (alertId: string) => provider.acknowledgeAlert(alertId),
    updateSoftware: (version: string) => provider.updateSoftware(version),
  }), [provider]);

  if (!data) return null;

  return (
    <TelemetryContext.Provider value={{ data, commands }}>
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => {
  const context = useContext(TelemetryContext);
  if (!context) throw new Error('useTelemetry must be used within TelemetryProvider');
  return context;
};
