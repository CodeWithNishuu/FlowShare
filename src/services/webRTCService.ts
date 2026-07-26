import webSocketService from './webSocketService';
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

  async connectToPeer(myDeviceId: string, targetPeerId: string): Promise<boolean> {
    try {
      const pc = this.createPeerConnection(myDeviceId, targetPeerId);
      const dc = pc.createDataChannel('fileTransferChannel', {
        ordered: true,
      });

      this.setupDataChannel(targetPeerId, dc);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Exchange ECDH Public Key
      const pubKey = await encryptionService.generateKeyPair();

      webSocketService.send('WEBRTC_OFFER', {
        sdp: offer,
        publicKey: pubKey,
      }, targetPeerId);

      return true;
    } catch (err) {
      console.error('Failed to initiate WebRTC peer connection:', err);
      return false;
    }
  }

  private createPeerConnection(myDeviceId: string, targetPeerId: string): RTCPeerConnection {
    if (this.peerConnections.has(targetPeerId)) {
      this.peerConnections.get(targetPeerId)!.close();
    }

    const pc = new RTCPeerConnection(this.iceServers);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        webSocketService.send('WEBRTC_ICE_CANDIDATE', event.candidate, targetPeerId);
      }
    };

    pc.ondatachannel = (event) => {
      this.setupDataChannel(targetPeerId, event.channel);
    };

    this.peerConnections.set(targetPeerId, pc);
    return pc;
  }

  private async handleOffer(myDeviceId: string, senderId: string, payload: any) {
    const pc = this.createPeerConnection(myDeviceId, senderId);
    await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));

    if (payload.publicKey) {
      await encryptionService.deriveSharedKey(senderId, payload.publicKey);
    }

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    const myPubKey = await encryptionService.generateKeyPair();

    webSocketService.send('WEBRTC_ANSWER', {
      sdp: answer,
      publicKey: myPubKey,
    }, senderId);
  }

  private async handleAnswer(senderId: string, payload: any) {
    const pc = this.peerConnections.get(senderId);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      if (payload.publicKey) {
        await encryptionService.deriveSharedKey(senderId, payload.publicKey);
      }
    }
  }

  private async handleIceCandidate(senderId: string, candidatePayload: any) {
    const pc = this.peerConnections.get(senderId);
    if (pc && pc.remoteDescription) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidatePayload));
      } catch (e) {
        console.warn('ICE candidate error:', e);
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
