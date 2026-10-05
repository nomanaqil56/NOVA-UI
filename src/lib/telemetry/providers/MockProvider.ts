import type { VehicleDataProvider, TelemetrySubscriber } from '../VehicleDataProvider';
import type { TelemetryData, DriveMode } from '../types';

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

export class MockProvider implements VehicleDataProvider {
  private data: TelemetryData = { ...defaultData };
  private subscribers: Set<TelemetrySubscriber> = new Set();
  private interval: ReturnType<typeof setInterval> | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    if (this.isConnected) return;
    this.isConnected = true;
    this.startSimulation();
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) return;
    this.isConnected = false;
    this.stopSimulation();
  }

  subscribe(callback: TelemetrySubscriber): () => void {
    this.subscribers.add(callback);
    callback(this.data);
    return () => this.subscribers.delete(callback);
  }

  // --- Semantic Commands ---

  async setDriveMode(mode: DriveMode): Promise<void> {
    this.data = { ...this.data, driveMode: mode };
    this.notifySubscribers();
  }

  async setAutonomousMode(enabled: boolean): Promise<void> {
    this.data = { ...this.data, autonomousMode: enabled };
    this.notifySubscribers();
  }

  async requestDiagnostics(): Promise<void> {
    // In a real system, this would trigger a hardware scan.
    // For mock, we simply acknowledge it.
    console.log("Mock: Diagnostics requested");
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    console.log(`Mock: Acknowledged alert ${alertId}`);
    this.data = { 
      ...this.data, 
      activeAlertsCount: Math.max(0, this.data.activeAlertsCount - 1) 
    };
    this.notifySubscribers();
  }

  async updateSoftware(version: string): Promise<void> {
    this.data = { ...this.data, osVersion: version, status: 'HEALTHY' };
    this.notifySubscribers();
  }

  // --- Internal Simulation Logic ---

  private notifySubscribers() {
    for (const callback of this.subscribers) {
      callback({ ...this.data });
    }
  }

  private startSimulation() {
    if (this.interval) return;
    
    this.interval = setInterval(() => {
      const isDriving = this.data.speed > 0 || this.data.autonomousMode;
      const newSpeed = this.data.autonomousMode ? 40 + (Math.random() * 4 - 2) : this.data.speed;
      
      this.data = {
        ...this.data,
        speed: isDriving ? newSpeed : this.data.speed,
        batteryLevel: Math.max(0, this.data.batteryLevel - (isDriving ? 0.001 : 0)),
        rangeKm: Math.max(0, this.data.rangeKm - (isDriving ? 0.005 : 0)),
        powerOutput: isDriving ? 12.0 + (Math.random() * 2) : 0,
        motorTemperature: isDriving ? 68 + (Math.random() * 2 - 1) : Math.max(30, this.data.motorTemperature - 0.5),
      };
      
      this.notifySubscribers();
    }, 1000);
  }

  private stopSimulation() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
