import webSocketService from './webSocketService';
import cloudDiscoveryService from './cloudDiscoveryService';
import { useDeviceStore } from '../stores/deviceStore';
import { Device } from '../types';

/**
 * Discovery Service for FlowShare
 * Real-time active peer discovery via WebSockets, WSS Cloud Relay, and BroadcastChannel.
 * Enables automatic 1-click peer discovery across physical devices (Phone & Laptop) without typing codes.
 */
class DiscoveryService {
  private isScanning = false;
  private channel: BroadcastChannel | null = null;
  private announceInterval: any = null;

  startDiscovery(myDeviceId: string, myMetadata: Partial<Device>) {
    this.isScanning = true;
    webSocketService.connect(myDeviceId, myMetadata);

    // Initialize WSS Cloud Discovery for cross-device signaling on Vercel (Phone & Laptop)
    cloudDiscoveryService.init(myDeviceId, myMetadata);

    // Initialize cross-tab & local network BroadcastChannel
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        if (this.channel) this.channel.close();
        this.channel = new BroadcastChannel('flowshare_p2p_discovery');

        this.channel.onmessage = (event) => {
          const { type, device } = event.data || {};
          if (type === 'ANNOUNCE_DEVICE' && device && device.id !== myDeviceId) {
            useDeviceStore.getState().addOrUpdateDevice(device);
            this.sendAnnounce(myDeviceId, myMetadata);
          } else if (type === 'DEVICE_BYE' && device?.id) {
            useDeviceStore.getState().removeDevice(device.id);
          }
        };

        this.sendAnnounce(myDeviceId, myMetadata);

        if (this.announceInterval) clearInterval(this.announceInterval);
        this.announceInterval = setInterval(() => {
          this.sendAnnounce(myDeviceId, myMetadata);
        }, 3000);
      }
    } catch (e) {
      console.warn('BroadcastChannel unavailable:', e);
    }
  }

  private sendAnnounce(myDeviceId: string, myMetadata: Partial<Device>) {
    if (!this.channel) return;
    const currentDevice: Device = {
      id: myDeviceId,
      name: myMetadata.name || 'FlowShare Peer',
      type: (myMetadata.type as any) || 'Desktop',
      os: myMetadata.os || 'Windows',
      ip: 'LAN Active Peer',
      signalStrength: 98,
      connectionQuality: 'Excellent',
      latency: 5,
      isOnline: true,
    };
    try {
      this.channel.postMessage({
        type: 'ANNOUNCE_DEVICE',
        device: currentDevice,
      });
    } catch (e) {}
  }

  stopDiscovery() {
    this.isScanning = false;
    if (this.announceInterval) clearInterval(this.announceInterval);
    if (this.channel) {
      const myDeviceId = useDeviceStore.getState().myDeviceId;
      try {
        this.channel.postMessage({ type: 'DEVICE_BYE', device: { id: myDeviceId } });
      } catch (e) {}
      this.channel.close();
      this.channel = null;
    }
  }

  requestRefresh() {
    webSocketService.send('GET_DISCOVERED_DEVICES', {});
    const myDeviceId = useDeviceStore.getState().myDeviceId;
    this.sendAnnounce(myDeviceId, {});
  }
}

export default new DiscoveryService();
