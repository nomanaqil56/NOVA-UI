import type { TelemetryData, DriveMode } from './types';

export type TelemetrySubscriber = (data: TelemetryData) => void;

export interface VehicleDataProvider {
  /**
   * Connect to the vehicle data source.
   */
  connect(): Promise<void>;

  /**
   * Disconnect from the vehicle data source.
   */
  disconnect(): Promise<void>;

  /**
   * Subscribe to vehicle data updates.
   * @param callback The function to call when data updates.
   * @returns An unsubscribe function.
   */
  subscribe(callback: TelemetrySubscriber): () => void;

  /**
   * Semantic Vehicle Commands
   * These replace the raw updateState approach for a true hardware interface.
   */
  setDriveMode(mode: DriveMode): Promise<void>;
  setAutonomousMode(enabled: boolean): Promise<void>;
  requestDiagnostics(): Promise<void>;
  acknowledgeAlert(alertId: string): Promise<void>;
  updateSoftware(version: string): Promise<void>;
}
