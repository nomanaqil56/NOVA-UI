import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { TelemetryData } from '../lib/telemetry/types';
import { MockProvider } from '../lib/telemetry/providers/MockProvider';
import type { VehicleDataProvider } from '../lib/telemetry/VehicleDataProvider';

interface TelemetryContextType {
  data: TelemetryData;
  updateData: (updates: Partial<TelemetryData>) => void;
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

// Instantiate the data provider. 
// For Phase 5, we use the MockProvider. 
// In Phase 6, we can instantiate a BluetoothProvider here based on a toggle or environment variable.
const vehicleProvider: VehicleDataProvider = new MockProvider();
vehicleProvider.connect(); // Auto-connect the mock provider

export const TelemetryProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<TelemetryData | null>(null);

  useEffect(() => {
    // Subscribe to the provider. The provider manages the connection state and data flow independently of the UI.
    const unsubscribe = vehicleProvider.subscribe((newData) => {
      setData(newData);
    });

    return unsubscribe;
  }, []);

  const updateData = (updates: Partial<TelemetryData>) => {
    vehicleProvider.updateState(updates);
  };

  // Do not render children until initial data is available
  if (!data) return null;

  return (
    <TelemetryContext.Provider value={{ data, updateData }}>
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => {
  const context = useContext(TelemetryContext);
  if (!context) throw new Error('useTelemetry must be used within TelemetryProvider');
  return context;
};
