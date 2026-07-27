import webSocketService from './webSocketService';
import cloudDiscoveryService from './cloudDiscoveryService';
import encryptionService from './encryptionService';

type DataChannelHandler = (data: ArrayBuffer | string) => void;

/**
 * WebRTC Service for FlowShare
 * Manages RTCPeerConnection and RTCDataChannel for direct peer-to-peer file transfer.
 */
export class WebRTCService {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private onDataHandlers: Map<string, Set<DataChannelHandler>> = new Map();

  private iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ],
  };

  initSignalingListeners(myDeviceId: string) {
    webSocketService.on('WEBRTC_OFFER', async (msg: any) => {
      const { senderId, payload } = msg;
      await this.handleOffer(myDeviceId, senderId, payload);
    });

    webSocketService.on('WEBRTC_ANSWER', async (msg: any) => {
      const { senderId, payload } = msg;
      await this.handleAnswer(senderId, payload);
    });

    webSocketService.on('WEBRTC_ICE_CANDIDATE', async (msg: any) => {
      const { senderId, payload } = msg;
      await this.handleIceCandidate(senderId, payload);
    });
  }

  private sendSignaling(targetPeerId: string, type: string, payload: any) {
    webSocketService.send(type, payload, targetPeerId);
    cloudDiscoveryService.sendToPeer(targetPeerId, type, payload);
  }

  async connectToPeer(myDeviceId: string, targetPeerId: string): Promise<boolean> {
    try {
      console.log(`[FlowShare WebRTC] Initiating P2P RTCPeerConnection to ${targetPeerId}`);
      const pc = this.createPeerConnection(myDeviceId, targetPeerId);
      const dc = pc.createDataChannel('fileTransferChannel', {
        ordered: true,
      });

      this.setupDataChannel(targetPeerId, dc);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const pubKey = await encryptionService.generateKeyPair();

      this.sendSignaling(targetPeerId, 'WEBRTC_OFFER', {
        sdp: offer,
        publicKey: pubKey,
      });

      return true;
    } catch (err) {
      console.error('[FlowShare WebRTC Error] Failed to initiate peer connection:', err);
      return false;
    }
  }

  private createPeerConnection(myDeviceId: string, targetPeerId: string): RTCPeerConnection {
    if (this.peerConnections.has(targetPeerId)) {
      try {
        this.peerConnections.get(targetPeerId)!.close();
      } catch (e) {}
    }

    const pc = new RTCPeerConnection(this.iceServers);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`[FlowShare WebRTC] ICE Candidate gathered for ${targetPeerId}`);
        this.sendSignaling(targetPeerId, 'WEBRTC_ICE_CANDIDATE', event.candidate);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[FlowShare WebRTC] Connection State with ${targetPeerId}: ${pc.connectionState}`);
    };

    pc.ondatachannel = (event) => {
      console.log(`[FlowShare WebRTC] Received remote RTCDataChannel from ${targetPeerId}`);
      this.setupDataChannel(targetPeerId, event.channel);
    };

    this.peerConnections.set(targetPeerId, pc);
    return pc;
  }

  public async handleOffer(myDeviceId: string, senderId: string, payload: any) {
    console.log(`[FlowShare WebRTC] Handling SDP Offer from ${senderId}`);
    const pc = this.createPeerConnection(myDeviceId, senderId);
    await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));

    if (payload.publicKey) {
      await encryptionService.deriveSharedKey(senderId, payload.publicKey);
    }

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    const myPubKey = await encryptionService.generateKeyPair();

    this.sendSignaling(senderId, 'WEBRTC_ANSWER', {
      sdp: answer,
      publicKey: myPubKey,
    });
  }

  public async handleAnswer(senderId: string, payload: any) {
    console.log(`[FlowShare WebRTC] Handling SDP Answer from ${senderId}`);
    const pc = this.peerConnections.get(senderId);
    if (pc && pc.signalingState !== 'closed') {
      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      if (payload.publicKey) {
        await encryptionService.deriveSharedKey(senderId, payload.publicKey);
      }
    }
  }

  public async handleIceCandidate(senderId: string, candidatePayload: any) {
    const pc = this.peerConnections.get(senderId);
    if (pc && pc.remoteDescription && pc.signalingState !== 'closed') {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidatePayload));
      } catch (e) {
        console.warn('[FlowShare WebRTC] ICE candidate error:', e);
      }
    }
  }

  private setupDataChannel(peerId: string, dc: RTCDataChannel) {
    dc.binaryType = 'arraybuffer';

    dc.onopen = () => {
      console.log(`[WebRTC DataChannel] Connection OPEN with peer ${peerId}`);
    };

    dc.onclose = () => {
      console.log(`[WebRTC DataChannel] Connection CLOSED with peer ${peerId}`);
      this.dataChannels.delete(peerId);
    };

    dc.onmessage = (event) => {
      const handlers = this.onDataHandlers.get(peerId);
      if (handlers) {
        handlers.forEach(h => h(event.data));
      }
    };

    this.dataChannels.set(peerId, dc);
  }

  sendData(peerId: string, data: ArrayBuffer | string): boolean {
    const dc = this.dataChannels.get(peerId);
    if (dc && dc.readyState === 'open') {
      // Buffer flow control
      if (dc.bufferedAmount > 4 * 1024 * 1024) { // 4MB buffer limit
        return false;
      }
      dc.send(data as any);
      return true;
    }
    return false;
  }

  onData(peerId: string, handler: DataChannelHandler) {
    if (!this.onDataHandlers.has(peerId)) {
      this.onDataHandlers.set(peerId, new Set());
    }
    this.onDataHandlers.get(peerId)!.add(handler);
  }

  offData(peerId: string, handler: DataChannelHandler) {
    if (this.onDataHandlers.has(peerId)) {
      this.onDataHandlers.get(peerId)!.delete(handler);
    }
  }

  async ensureConnection(myDeviceId: string, targetPeerId: string, timeoutMs = 10000): Promise<boolean> {
    const existing = this.dataChannels.get(targetPeerId);
    if (existing && existing.readyState === 'open') {
      return true;
    }

    // Initiate offer
    await this.connectToPeer(myDeviceId, targetPeerId);

    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const dc = this.dataChannels.get(targetPeerId);
      if (dc && dc.readyState === 'open') {
        return true;
      }
      await new Promise((r) => setTimeout(r, 100));
    }

    const dc = this.dataChannels.get(targetPeerId);
    return !!(dc && dc.readyState === 'open');
  }

  async waitForBufferDrain(peerId: string, maxBuffered = 2 * 1024 * 1024): Promise<void> {
    const dc = this.dataChannels.get(peerId);
    if (!dc) return;
    while (dc.bufferedAmount > maxBuffered && dc.readyState === 'open') {
      await new Promise((r) => setTimeout(r, 10));
    }
  }

  closeConnection(peerId: string) {
    if (this.dataChannels.has(peerId)) {
      this.dataChannels.get(peerId)!.close();
      this.dataChannels.delete(peerId);
    }
    if (this.peerConnections.has(peerId)) {
      this.peerConnections.get(peerId)!.close();
      this.peerConnections.delete(peerId);
    }
  }
}

export default new WebRTCService();
