import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

type SystemStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'OFFLINE' | 'MAINTENANCE' | 'UPDATING';

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

  // Enriched Telemetry Model
  motorTemperature: number; // Celsius
  batteryTemperature: number; // Celsius
  powerOutput: number; // kW
  efficiency: number; // kWh/100km
  gpsHeading: number; // Degrees
  driveMode: 'ECO' | 'NORMAL' | 'SPORT';
  sensorHealth: 'NOMINAL' | 'DEGRADED' | 'FAULT';
}

interface TelemetryContextType {
  data: TelemetryData;
  updateData: (updates: Partial<TelemetryData>) => void;
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
  
  motorTemperature: 68,
  batteryTemperature: 34,
  powerOutput: 12.4,
  efficiency: 14.2,
  gpsHeading: 0,
  driveMode: 'NORMAL',
  sensorHealth: 'NOMINAL',
};

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export const TelemetryProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<TelemetryData>(defaultData);

  const updateData = (updates: Partial<TelemetryData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  useEffect(() => {
    // Mock simulation loop for vehicle data
    const interval = setInterval(() => {
      setData(prev => {
        const isDriving = prev.speed > 0 || prev.autonomousMode;
        const newSpeed = prev.autonomousMode ? 40 + (Math.random() * 4 - 2) : prev.speed;
        
        return {
          ...prev,
          speed: isDriving ? newSpeed : prev.speed,
          batteryLevel: Math.max(0, prev.batteryLevel - (isDriving ? 0.001 : 0)),
          rangeKm: Math.max(0, prev.rangeKm - (isDriving ? 0.005 : 0)),
          powerOutput: isDriving ? 12.0 + (Math.random() * 2) : 0,
          motorTemperature: isDriving ? 68 + (Math.random() * 2 - 1) : Math.max(30, prev.motorTemperature - 0.5),
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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
