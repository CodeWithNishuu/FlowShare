import webSocketService from './webSocketService';
import { Device } from '../types';

/**
 * Discovery Service for FlowShare
 * Discovers nearby LAN devices via WebSocket signaling & MDNS/subnet broadcasting.
 */
class DiscoveryService {
  private isScanning = false;

  startDiscovery(myDeviceId: string, myMetadata: Partial<Device>) {
    this.isScanning = true;
    webSocketService.connect(myDeviceId, myMetadata);
  }

  stopDiscovery() {
    this.isScanning = false;
  }

  requestRefresh() {
    webSocketService.send('GET_DISCOVERED_DEVICES', {});
  }
}

export default new DiscoveryService();
