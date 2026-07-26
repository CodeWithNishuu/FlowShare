import webSocketService from './webSocketService';
import { Device } from '../types';

/**
 * Discovery Service for FlowShare
 * 
 * IMPORTANT ARCHITECTURAL NOTE:
 * Automatic LAN discovery via UDP/mDNS is NOT possible directly inside standard browser environments
 * due to security sandbox restrictions on raw socket APIs.
 * 
 * Current web implementation relies on WebSocket Signaling Server device registry.
 * Devices connected to the same signaling server appear in real-time.
 * 
 * A future native desktop version (e.g., using Tauri or Electron) should implement:
 * - UDP Broadcast
 * - mDNS (Multicast DNS)
 * - Automatic Native LAN Discovery
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
