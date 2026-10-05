export type SystemStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'OFFLINE' | 'MAINTENANCE' | 'UPDATING';
export type DriveMode = 'ECO' | 'NORMAL' | 'SPORT';
export type SensorHealth = 'NOMINAL' | 'DEGRADED' | 'FAULT';

export interface TelemetryData {
  vehicleId: string;
  batteryLevel: number; // 0-100
  rangeKm: number;
  speed: number;
  status: SystemStatus;
  autonomousMode: boolean;
  activeAlertsCount: number;
  openIssuesCount: number;
  osVersion: string;

  motorTemperature: number; // Celsius
  batteryTemperature: number; // Celsius
  powerOutput: number; // kW
  efficiency: number; // kWh/100km
  gpsHeading: number; // Degrees
  driveMode: DriveMode;
  sensorHealth: SensorHealth;
}
