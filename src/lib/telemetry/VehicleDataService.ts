import type { VehicleDataProvider } from './VehicleDataProvider';
import { MockProvider } from './providers/MockProvider';

/**
 * Service to manage which provider is used.
 * Keeps the UI unaware of specific provider implementations (e.g. Mock vs Bluetooth).
 */
export class VehicleDataService {
  private static activeProvider: VehicleDataProvider | null = null;

  static getProvider(): VehicleDataProvider {
    if (!this.activeProvider) {
      // In Phase 6, we would return new BluetoothProvider() if conditions are met
      this.activeProvider = new MockProvider();
    }
    return this.activeProvider;
  }
}
