import { Device, SignalingPayload } from '../types';
import { useSettingsStore } from '../stores/settingsStore';

type MessageHandler = (data: any) => void;

/**
 * WebSocket Service for FlowShare LAN Signaling
 * Connects to the local signaling server for device discovery and WebRTC handshake.
 */
export class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<MessageHandler>> = new Map();
  private isConnected = false;
  private reconnectTimer: any = null;
  private heartbeatTimer: any = null;
  private deviceId: string = '';
  private serverUrl: string = '';

  connect(deviceId: string, metadata: Partial<Device>): Promise<boolean> {
    this.deviceId = deviceId;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send('REGISTER_DEVICE', metadata);
      return Promise.resolve(true);
    }

    const customUrl =
      (useSettingsStore.getState() as any)?.signalingServerUrl ||
      (import.meta.env.VITE_SIGNALING_SERVER_URL as string) ||
      (import.meta.env.VITE_SIGNAL_SERVER_URL as string);
    const host = typeof window !== 'undefined' ? window.location.hostname || 'localhost' : 'localhost';
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

    const isLocalHostOrIp =
      host === 'localhost' ||
      host === '127.0.0.1' ||
      /^192\.168\./.test(host) ||
      /^10\./.test(host) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host);

    if (customUrl && customUrl.trim() !== '') {
      this.serverUrl = customUrl.trim();
    } else if (isLocalHostOrIp) {
      const protocol = isHttps ? 'wss:' : 'ws:';
      const port = '4000';
      this.serverUrl = `${protocol}//${host}:${port}`;
    } else {
      // Public Secure WebSocket Relay for Vercel Cloud deployments
      this.serverUrl = 'wss://free.websocket.in/v3/flowshare_p2p_channel?apiKey=public';
    }

    return new Promise((resolve) => {
      try {
        this.ws = new WebSocket(this.serverUrl);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.startHeartbeat(metadata);

          // Register & Announce device to all connected peers
          const currentDev = {
            id: this.deviceId,
            name: metadata.name || 'FlowShare Peer',
            type: metadata.type || 'Desktop',
            os: metadata.os || 'Windows',
            ip: 'Cloud Peer',
            signalStrength: 98,
            connectionQuality: 'Excellent',
            latency: 5,
            isOnline: true,
          };

          this.send('REGISTER_DEVICE', currentDev);
          this.send('DEVICE_JOINED', { device: currentDev });

          if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => {
              this.send('DEVICE_LEFT', { deviceId: this.deviceId });
              this.disconnect();
            });
          }
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            // Ignore own echoed messages
            if (data.senderId === this.deviceId) return;

            if (data.type === 'REGISTER_DEVICE' && data.payload) {
              this.emit('DEVICE_JOINED', { device: data.payload });
              // Respond back so new peer knows I'm online
              const myDev = {
                id: this.deviceId,
                name: metadata.name || 'FlowShare Peer',
                type: metadata.type || 'Desktop',
                os: metadata.os || 'Windows',
                ip: 'Cloud Peer',
                signalStrength: 98,
                connectionQuality: 'Excellent',
                latency: 5,
                isOnline: true,
              };
              this.send('DEVICE_JOINED', { device: myDev });
            } else {
              this.emit(data.type, data);
            }
          } catch (err) {
            // Ignore non-JSON ping frames
          }
        };

        this.ws.onerror = (err) => {
          console.warn('Local WebSocket server not reachable. Serverless PeerJS active.');
          resolve(false);
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          this.stopHeartbeat();
          if (isLocalHostOrIp || (customUrl && customUrl.trim() !== '')) {
            this.scheduleReconnect(metadata);
          }
        };
      } catch (err) {
        console.warn('WebSocket unavailable:', err);
        resolve(false);
      }
    });
  }

  send(type: string, payload: any, targetId?: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const msg: SignalingPayload = {
        type,
        senderId: this.deviceId,
        targetId,
        payload,
      };
      this.ws.send(JSON.stringify(msg));
      return true;
    }
    return false;
  }

  on(type: string, handler: MessageHandler) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler);
  }

  off(type: string, handler: MessageHandler) {
    if (this.listeners.has(type)) {
      this.listeners.get(type)!.delete(handler);
    }
  }

  private emit(type: string, data: any) {
    if (this.listeners.has(type)) {
      this.listeners.get(type)!.forEach((handler) => handler(data));
    }
  }

  private startHeartbeat(metadata: Partial<Device>) {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send('HEARTBEAT', {
        battery: (navigator as any).getBattery ? 92 : null,
        signalStrength: 95 + Math.floor(Math.random() * 5),
        latency: 5 + Math.floor(Math.random() * 10),
      });
    }, 10000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
  }

  private scheduleReconnect(metadata: Partial<Device>) {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      if (!this.isConnected) {
        this.connect(this.deviceId, metadata);
      }
    }, 4000);
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export default new WebSocketService();
