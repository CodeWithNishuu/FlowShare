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

    const hash = Array.from(myDeviceId).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const numCode = ((hash * 9301 + 49297) % 8999 + 1000).toString();
    this.pairCode = `FLOW-${numCode}`;
    this.peerId = myDeviceId.startsWith('flow-') ? myDeviceId : `flow-${myDeviceId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

    return new Promise((resolve) => {
      try {
        this.peer = new Peer(this.peerId, {
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' },
            ],
          },
        });

        this.peer.on('open', (id) => {
          console.log(`[PeerJS Cloud] Registered with ID: ${id}`);
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

  async connectToPeer(targetId: string): Promise<boolean> {
    if (!this.peer || this.peer.destroyed) return false;

    const cleanTargetId = targetId.startsWith('flow-') ? targetId : `flow-${targetId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

    if (this.connections.has(cleanTargetId) || this.connections.has(targetId)) {
      const existing = this.connections.get(cleanTargetId) || this.connections.get(targetId);
      if (existing && existing.open) return true;
    }

    try {
      console.log(`[PeerJS Cloud] Connecting to peer ID: ${cleanTargetId}`);
      const conn = this.peer.connect(cleanTargetId, {
        reliable: true,
      });

      return new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(false), 5000);

        conn.on('open', () => {
          clearTimeout(timeout);
          console.log(`[PeerJS Cloud] DataConnection OPEN with peer ${cleanTargetId}`);
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
    const rawId = peerId.replace(/^flow-/, '');
    this.connections.set(peerId, conn);
    this.connections.set(rawId, conn);

    conn.on('data', (data: any) => {
      const handlers = this.dataHandlers.get(peerId) || this.dataHandlers.get(rawId);
      if (handlers) {
        handlers.forEach((h) => h(data));
      }

      if (typeof data === 'string') {
        try {
          const msg = JSON.parse(data);
          if (msg.type === 'TRANSFER_REQUEST') {
            const peer: Device = {
              id: rawId,
              name: msg.payload?.senderName || `Peer (${rawId})`,
              type: 'Desktop',
              os: 'Windows',
              ip: 'P2P WebRTC Direct',
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
          } else if (msg.type === 'TRANSFER_COMPLETE_ACK') {
            transferEngine.handleTransferCompleteAck(msg.payload);
          }
        } catch (e) {}
      } else if (data instanceof ArrayBuffer) {
        transferEngine.processIncomingPacket(data);
      }
    });

    conn.on('close', () => {
      this.connections.delete(peerId);
      this.connections.delete(rawId);
    });

    conn.on('error', () => {
      this.connections.delete(peerId);
      this.connections.delete(rawId);
    });
  }

  sendData(targetPeerId: string, data: ArrayBuffer | string): boolean {
    const cleanTargetId = targetPeerId.startsWith('flow-') ? targetPeerId : `flow-${targetPeerId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    const conn = this.connections.get(targetPeerId) || this.connections.get(cleanTargetId);
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
