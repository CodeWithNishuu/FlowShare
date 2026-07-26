import Peer, { DataConnection } from 'peerjs';
import { Device } from '../types';
import transferEngine from './transferEngine';
import { useTransferStore } from '../stores/transferStore';

type DataHandler = (data: ArrayBuffer | string) => void;

/**
 * PeerService (PeerJS Cloud Integration)
 * Provides 100% serverless WebRTC signaling via PeerJS free public cloud (0.peerjs.com).
 * Enables direct P2P file transfers and Pair Code / QR Code connections without any backend server.
 */
class PeerService {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private dataHandlers: Map<string, Set<DataHandler>> = new Map();
  private peerId: string = '';
  private pairCode: string = '';
  private isInitialized = false;

  init(myDeviceId: string, metadata: Partial<Device>): Promise<string> {
    if (this.isInitialized && this.peer && !this.peer.destroyed) {
      return Promise.resolve(this.pairCode);
    }

    // Generate a clean 4-digit numeric Pair Code
    const hash = Array.from(myDeviceId).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const numCode = ((hash * 9301 + 49297) % 8999 + 1000).toString();
    this.pairCode = `FLOW-${numCode}`;
    this.peerId = `flow-${numCode.toLowerCase()}`;

    return new Promise((resolve) => {
      try {
        this.peer = new Peer(this.peerId, {
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
            ],
          },
        });

        this.peer.on('open', (id) => {
          console.log(`[PeerJS Cloud] Registered with ID: ${id}, Pair Code: ${this.pairCode}`);
          this.isInitialized = true;
          resolve(this.pairCode);
        });

        this.peer.on('connection', (conn) => {
          this.setupConnection(conn);
        });

        this.peer.on('error', (err) => {
          console.warn('[PeerJS Cloud Warning]', err);
          resolve(this.pairCode);
        });

        setTimeout(() => resolve(this.pairCode), 3000);
      } catch (e) {
        console.warn('[PeerJS Initialization Warning]', e);
        resolve(this.pairCode);
      }
    });
  }

  getPairCode(): string {
    return this.pairCode;
  }

  getPeerId(): string {
    return this.peerId;
  }

  async connectToPeer(targetCode: string): Promise<boolean> {
    if (!this.peer || this.peer.destroyed) return false;

    let cleanTargetId = targetCode.trim().toLowerCase();
    if (!cleanTargetId.startsWith('flow-')) {
      cleanTargetId = cleanTargetId.replace(/^flow-?/, '');
      cleanTargetId = `flow-${cleanTargetId}`;
    }

    if (this.connections.has(cleanTargetId)) {
      const existing = this.connections.get(cleanTargetId);
      if (existing && existing.open) return true;
    }

    try {
      const conn = this.peer.connect(cleanTargetId, {
        reliable: true,
      });

      return new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(false), 8000);

        conn.on('open', () => {
          clearTimeout(timeout);
          this.setupConnection(conn);
          resolve(true);
        });

        conn.on('error', (err) => {
          console.warn('[PeerJS Connect Failed]', err);
          clearTimeout(timeout);
          resolve(false);
        });
      });
    } catch (err) {
      console.error('[PeerJS Connect Error]', err);
      return false;
    }
  }

  private setupConnection(conn: DataConnection) {
    const peerId = conn.peer;
    this.connections.set(peerId, conn);

    conn.on('data', (data: any) => {
      const handlers = this.dataHandlers.get(peerId);
      if (handlers) {
        handlers.forEach((h) => h(data));
      }

      if (typeof data === 'string') {
        try {
          const msg = JSON.parse(data);
          if (msg.type === 'TRANSFER_REQUEST') {
            const peer: Device = {
              id: peerId,
              name: msg.payload?.senderName || `Peer (${peerId.toUpperCase()})`,
              type: 'Desktop',
              os: 'Windows',
              ip: 'Serverless P2P Cloud',
              signalStrength: 100,
              connectionQuality: 'Excellent',
              latency: 5,
              isOnline: true,
            };
            const session = transferEngine.handleIncomingTransferRequest(msg.payload, peer);
            useTransferStore.getState().setIncomingModalSession(session);
          } else if (msg.type === 'TRANSFER_RESPONSE') {
            if (msg.payload?.accepted) {
              transferEngine.executeSendLoop();
            } else {
              transferEngine.cancel();
            }
          }
        } catch (e) {}
      } else if (data instanceof ArrayBuffer) {
        transferEngine.processIncomingPacket(data);
      }
    });

    conn.on('close', () => {
      this.connections.delete(peerId);
    });

    conn.on('error', () => {
      this.connections.delete(peerId);
    });
  }

  sendData(targetPeerId: string, data: ArrayBuffer | string): boolean {
    let cleanTargetId = targetPeerId.trim().toLowerCase();
    if (!cleanTargetId.startsWith('flow-')) {
      cleanTargetId = cleanTargetId.replace(/^flow-?/, '');
      cleanTargetId = `flow-${cleanTargetId}`;
    }

    const conn = this.connections.get(cleanTargetId);
    if (conn && conn.open) {
      conn.send(data);
      return true;
    }
    return false;
  }

  onData(peerId: string, handler: DataHandler) {
    const cleanPeerId = peerId.replace(/[^a-zA-Z0-9_-]/g, '_');
    if (!this.dataHandlers.has(cleanPeerId)) {
      this.dataHandlers.set(cleanPeerId, new Set());
    }
    this.dataHandlers.get(cleanPeerId)!.add(handler);
  }

  offData(peerId: string, handler: DataHandler) {
    const cleanPeerId = peerId.replace(/[^a-zA-Z0-9_-]/g, '_');
    if (this.dataHandlers.has(cleanPeerId)) {
      this.dataHandlers.get(cleanPeerId)!.delete(handler);
    }
  }

  destroy() {
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.connections.clear();
    this.isInitialized = false;
  }
}

export default new PeerService();
