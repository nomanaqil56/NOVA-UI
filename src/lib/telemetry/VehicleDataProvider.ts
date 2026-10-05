import type { TelemetryData } from './types';

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
   * Send state updates back to the vehicle/provider.
   * In a real implementation, this would be an RPC or CAN message command.
   */
  updateState(updates: Partial<TelemetryData>): void;
}
