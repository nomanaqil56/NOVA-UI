import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

type SystemStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'OFFLINE' | 'MAINTENANCE' | 'UPDATING';

type ConnectionState = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED';
type ConnectionMode = 'DEMO' | 'LIVE';

interface TelemetryData {
  vehicleId: string;
  batteryLevel: number; // 0-100
  rangeKm: number;
  speed: number;
  status: SystemStatus;
  autonomousMode: boolean;
  activeAlertsCount: number;
  openIssuesCount: number;
  osVersion: string;
  
  // Connection states
  connectionState: ConnectionState;
  connectionMode: ConnectionMode;
}

interface TelemetryContextType {
  data: TelemetryData;
  updateData: (updates: Partial<TelemetryData>) => void;
  setConnectionMode: (mode: ConnectionMode) => void;
  connectVehicle: () => void;
  disconnectVehicle: () => void;
}

const defaultData: TelemetryData = {
  vehicleId: 'Vehicle 042',
  batteryLevel: 78,
  rangeKm: 312,
  speed: 0,
  status: 'HEALTHY',
  autonomousMode: true,
  activeAlertsCount: 3,
  openIssuesCount: 1,
  osVersion: '4.8.2',
  connectionState: 'CONNECTED',
  connectionMode: 'DEMO'
};

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export const TelemetryProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<TelemetryData>(defaultData);

  const updateData = (updates: Partial<TelemetryData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const setConnectionMode = (mode: ConnectionMode) => {
    setData(prev => ({ ...prev, connectionMode: mode, connectionState: mode === 'LIVE' ? 'DISCONNECTED' : 'CONNECTED' }));
  };

  const connectVehicle = () => {
    setData(prev => ({ ...prev, connectionState: 'CONNECTING' }));
    // Simulate connection delay
    setTimeout(() => {
      // In a real app, this would initiate Web Bluetooth API
      if (data.connectionMode === 'LIVE') {
        // Mock fail or mock success for LIVE mode development
        // For Phase 5, we'll just mock connection success after 2 seconds for visual feedback
        setData(prev => ({ ...prev, connectionState: 'CONNECTED' }));
      }
    }, 2000);
  };

  const disconnectVehicle = () => {
    setData(prev => ({ ...prev, connectionState: 'DISCONNECTED' }));
  };

  useEffect(() => {
    if (data.connectionMode !== 'DEMO' || data.connectionState !== 'CONNECTED') return;
    
    const interval = setInterval(() => {
      setData(prev => {
        // Only drain battery if driving (speed > 0) or randomly just a little
        // We'll just mock random speed fluctuation and slight battery drain over a long time
        const newSpeed = prev.autonomousMode ? 40 + (Math.random() * 4 - 2) : prev.speed;
        
        return {
          ...prev,
          speed: prev.speed > 0 || prev.autonomousMode ? newSpeed : prev.speed,
          batteryLevel: Math.max(0, prev.batteryLevel - 0.001),
          rangeKm: Math.max(0, prev.rangeKm - 0.005)
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [data.connectionMode, data.connectionState]);

  return (
    <TelemetryContext.Provider value={{ data, updateData, setConnectionMode, connectVehicle, disconnectVehicle }}>
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => {
  const context = useContext(TelemetryContext);
  if (!context) throw new Error('useTelemetry must be used within TelemetryProvider');
  return context;
};
