import webRTCService from './webRTCService';
import webSocketService from './webSocketService';
import peerService from './peerService';
import cloudDiscoveryService from './cloudDiscoveryService';
import encryptionService from './encryptionService';
import storageService from './storageService';
import historyService from './historyService';
import notificationService from './notificationService';
import { useSettingsStore } from '../stores/settingsStore';
import { useDeviceStore } from '../stores/deviceStore';
import { Device, SelectedFile, TransferFileItem, TransferSession, TransferStatus } from '../types';

export const CHUNK_SIZE = 128 * 1024; // 128 KB chunks for balanced throughput

export class TransferEngine {
  private activeSession: TransferSession | null = null;
  private onStateChange: ((session: TransferSession) => void) | null = null;
  private receivedChunks: Map<string, Map<number, ArrayBuffer>> = new Map(); // fileId -> (chunkIndex -> ArrayBuffer)
  private isPaused = false;
  private isCancelled = false;
  private speedTimer: any = null;
  private lastTransferredBytes = 0;

  constructor() {
    this.initControlListeners();
  }

  private initControlListeners() {
    webSocketService.on('TRANSFER_CONTROL_COMMAND', (msg: any) => {
      const { command } = msg.payload || {};
      if (command === 'PAUSE') {
        this.isPaused = true;
        if (this.activeSession) {
          this.activeSession.status = 'paused';
          this.notify();
        }
      } else if (command === 'RESUME') {
        this.isPaused = false;
        if (this.activeSession) {
          this.activeSession.status = 'transferring';
          this.notify();
        }
      } else if (command === 'CANCEL') {
        this.isCancelled = true;
        if (this.activeSession) {
          this.activeSession.status = 'cancelled';
          this.notify();
        }
      }
    });
  }

  setActiveSession(session: TransferSession, callback?: (session: TransferSession) => void) {
    this.activeSession = session;
    if (callback) this.onStateChange = callback;
    this.notify();
  }

  getActiveSession(): TransferSession | null {
    return this.activeSession;
  }

  async restoreSavedSession(): Promise<TransferSession | null> {
    const saved = await storageService.getSavedSession();
    if (saved && (saved.status === 'transferring' || saved.status === 'paused')) {
      this.activeSession = saved;
      this.notify();
      return saved;
    }
    return null;
  }

  // --- Sender Logic ---
  async startSending(peerDevice: Device, files: SelectedFile[], isEncrypted = true): Promise<TransferSession> {
    const fileItems: TransferFileItem[] = files.map((f, i) => ({
      id: f.id || `file_${Date.now()}_${i}`,
      name: f.name,
      size: f.size,
      type: f.type || 'application/octet-stream',
      transferredBytes: 0,
      progress: 0,
      status: 'pending',
      fileObj: f.fileObj,
    }));

    const totalBytes = fileItems.reduce((sum, item) => sum + item.size, 0);

    const session: TransferSession = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      direction: 'send',
      peerDevice,
      files: fileItems,
      currentFileIndex: 0,
      totalFiles: fileItems.length,
      totalBytes,
      transferredBytes: 0,
      overallProgress: 0,
      uploadSpeed: 0,
      downloadSpeed: 0,
      averageSpeed: 0,
      etaSeconds: 0,
      elapsedSeconds: 0,
      status: 'requesting',
      startedAt: Date.now(),
      endedAt: null,
      isEncrypted,
    };

    this.activeSession = session;
    this.isPaused = false;
    this.isCancelled = false;
    await storageService.saveSessionState(session);
    this.startSpeedMonitor();
    this.notify();

    const myDeviceName = useSettingsStore.getState().deviceName || 'FlowShare Peer';

    // Send transfer request via WebSocket signaling, MQTT Cloud Relay, & PeerJS fallback
    const reqPayload = {
      sessionId: session.id,
      files: files.map(f => ({ id: f.id, name: f.name, size: f.size, type: f.type })),
      senderName: myDeviceName,
      senderDevice: myDeviceName,
      totalBytes,
      totalFiles: files.length,
      estimatedTimeSec: Math.ceil(totalBytes / (15 * 1024 * 1024)),
    };

    const sentWs = webSocketService.send('TRANSFER_REQUEST', reqPayload, peerDevice.id);
    cloudDiscoveryService.sendToPeer(peerDevice.id, 'TRANSFER_REQUEST', reqPayload);

    if (!sentWs) {
      peerService.sendData(peerDevice.id, JSON.stringify({
        type: 'TRANSFER_REQUEST',
        payload: reqPayload,
      }));
    }

    return session;
  }

  async executeSendLoop() {
    if (!this.activeSession || this.activeSession.direction !== 'send') return;

    this.activeSession.status = 'transferring';
    this.notify();

    const peerId = this.activeSession.peerDevice.id;
    const myDeviceId = useDeviceStore.getState().myDeviceId;

    // Ensure direct WebRTC DataChannel connection is active
    await webRTCService.ensureConnection(myDeviceId, peerId);

    for (let i = 0; i < this.activeSession.files.length; i++) {
      if (this.isCancelled) break;

      this.activeSession.currentFileIndex = i;
      const fileItem = this.activeSession.files[i];
      fileItem.status = 'transferring';
      this.notify();

      const fileObj = fileItem.fileObj;
      const totalChunks = Math.ceil(fileItem.size / CHUNK_SIZE);

      // Notify receiver of individual file start metadata
      const fileHeader = JSON.stringify({
        type: 'HEADER',
        sessionId: this.activeSession.id,
        fileId: fileItem.id,
        fileName: fileItem.name,
        fileSize: fileItem.size,
        fileType: fileItem.type,
        totalChunks,
      });

      this.sendRawOrFallback(peerId, fileHeader);

      for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
        while (this.isPaused && !this.isCancelled) {
          await new Promise(r => setTimeout(r, 200));
        }
        if (this.isCancelled) break;

        const start = chunkIdx * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, fileItem.size);

        let chunkBuffer: ArrayBuffer;
        if (fileObj) {
          const slice = fileObj.slice(start, end);
          chunkBuffer = await slice.arrayBuffer();
        } else {
          // Fallback dummy binary buffer if file reference is lost on refresh
          chunkBuffer = new ArrayBuffer(end - start);
        }

        // Encryption if enabled
        let sendBuffer = chunkBuffer;
        let ivBase64 = '';
        if (this.activeSession.isEncrypted) {
          const enc = await encryptionService.encryptChunk(peerId, chunkBuffer);
          sendBuffer = enc.data;
          ivBase64 = window.btoa(String.fromCharCode(...enc.iv));
        }

        // Binary packet format: JSON Header Prefix length + Metadata + Raw Chunk
        const meta = JSON.stringify({
          type: 'CHUNK',
          sessionId: this.activeSession.id,
          fileId: fileItem.id,
          chunkIdx,
          totalChunks,
          iv: ivBase64,
        });

        const metaEncoder = new TextEncoder();
        const metaBytes = metaEncoder.encode(meta);
        const metaLength = metaBytes.byteLength;

        const packet = new Uint8Array(4 + metaLength + sendBuffer.byteLength);
        const view = new DataView(packet.buffer);
        view.setUint32(0, metaLength, false);
        packet.set(metaBytes, 4);
        packet.set(new Uint8Array(sendBuffer), 4 + metaLength);

        // Transmit over WebRTC or WebSocket Fallback
        let sent = webRTCService.sendData(peerId, packet.buffer);
        if (!sent) {
          // Relay fallback via WS
          webSocketService.send('FALLBACK_FILE_CHUNK', {
            meta,
            chunkBase64: this.arrayBufferToBase64(sendBuffer),
          }, peerId);
        }

        // Update progress
        const chunkSize = end - start;
        fileItem.transferredBytes += chunkSize;
        fileItem.progress = Math.min(100, Math.round((fileItem.transferredBytes / fileItem.size) * 100));

        this.activeSession.transferredBytes += chunkSize;
        this.activeSession.overallProgress = Math.min(100, Math.round((this.activeSession.transferredBytes / this.activeSession.totalBytes) * 100));

        this.notify();
        await new Promise(r => setTimeout(r, 2)); // Micro throttle for responsive UI updates
      }

      if (!this.isCancelled) {
        fileItem.status = 'completed';
        fileItem.progress = 100;
        this.notify();
      }
    }

    if (!this.isCancelled) {
      this.activeSession.status = 'completed';
      this.activeSession.endedAt = Date.now();
      this.notify();
      notificationService.playChime('success');

      // Save to History & clear transient session state
      this.saveSessionToHistory('sent', 'Completed');
      await storageService.clearSessionState(this.activeSession.id);
    }

    this.stopSpeedMonitor();
  }

  // --- Receiver Logic ---
  handleIncomingTransferRequest(payload: any, peerDevice: Device): TransferSession {
    const files: TransferFileItem[] = payload.files.map((f: any, i: number) => ({
      id: f.id || `rec_file_${Date.now()}_${i}`,
      name: f.name,
      size: f.size,
      type: f.type || 'application/octet-stream',
      transferredBytes: 0,
      progress: 0,
      status: 'pending',
    }));

    const session: TransferSession = {
      id: payload.sessionId,
      direction: 'receive',
      peerDevice,
      files,
      currentFileIndex: 0,
      totalFiles: files.length,
      totalBytes: payload.totalBytes,
      transferredBytes: 0,
      overallProgress: 0,
      uploadSpeed: 0,
      downloadSpeed: 0,
      averageSpeed: 0,
      etaSeconds: payload.estimatedTimeSec || 0,
      elapsedSeconds: 0,
      status: 'waiting_approval',
      startedAt: Date.now(),
      endedAt: null,
      isEncrypted: true,
    };

    this.activeSession = session;
    this.notify();
    notificationService.playChime('request');
    return session;
  }

  async acceptTransfer(sessionId: string) {
    if (!this.activeSession || this.activeSession.id !== sessionId) return;

    this.activeSession.status = 'connecting';
    this.notify();

    webSocketService.send('TRANSFER_RESPONSE', {
      sessionId,
      accepted: true,
    }, this.activeSession.peerDevice.id);

    this.startSpeedMonitor();
    this.listenForIncomingData();
  }

  rejectTransfer(sessionId: string) {
    if (this.activeSession && this.activeSession.id === sessionId) {
      this.activeSession.status = 'rejected';
      this.notify();

      webSocketService.send('TRANSFER_RESPONSE', {
        sessionId,
        accepted: false,
        reason: 'User declined transfer',
      }, this.activeSession.peerDevice.id);
    }
  }

  private listenForIncomingData() {
    if (!this.activeSession) return;
    const peerId = this.activeSession.peerDevice.id;

    webRTCService.onData(peerId, async (data) => {
      await this.processIncomingPacket(data);
    });

    webSocketService.on('RECEIVE_FALLBACK_FILE_CHUNK', async (msg: any) => {
      const { meta, chunkBase64 } = msg.payload;
      const metaObj = typeof meta === 'string' ? JSON.parse(meta) : meta;
      const chunkBuffer = this.base64ToArrayBuffer(chunkBase64);
      await this.processChunkData(metaObj, chunkBuffer);
    });

    webSocketService.on('TRANSFER_PROGRESS_UPDATE', (msg: any) => {
      if (this.activeSession && this.activeSession.direction === 'receive') {
        const p = msg.payload;
        if (p) {
          this.activeSession.uploadSpeed = 0;
          this.activeSession.downloadSpeed = p.uploadSpeed || p.downloadSpeed || 0;
          this.activeSession.etaSeconds = p.etaSeconds || 0;
          this.activeSession.averageSpeed = p.averageSpeed || 0;
          this.activeSession.elapsedSeconds = p.elapsedSeconds || 0;
          if (p.currentFileIndex !== undefined) {
            this.activeSession.currentFileIndex = p.currentFileIndex;
          }
          this.notify();
        }
      }
    });
  }

  public async processIncomingPacket(data: ArrayBuffer | string) {
    if (!this.activeSession) return;

    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'HEADER') {
          this.activeSession.status = 'transferring';
          this.notify();
        }
      } catch (e) {}
      return;
    }

    // Binary packet parsing
    const view = new DataView(data);
    const metaLength = view.getUint32(0, false);
    const metaBytes = new Uint8Array(data, 4, metaLength);
    const metaStr = new TextDecoder().decode(metaBytes);
    const meta = JSON.parse(metaStr);

    const chunkData = data.slice(4 + metaLength);
    await this.processChunkData(meta, chunkData);
  }

  private async processChunkData(meta: any, chunkData: ArrayBuffer) {
    if (!this.activeSession) return;

    const { fileId, chunkIdx, totalChunks, iv } = meta;
    const peerId = this.activeSession.peerDevice.id;

    // Decrypt if IV provided
    let finalChunk = chunkData;
    if (iv && this.activeSession.isEncrypted) {
      const ivBytes = new Uint8Array(this.base64ToArrayBuffer(iv));
      finalChunk = await encryptionService.decryptChunk(peerId, chunkData, ivBytes);
    }

    if (!this.receivedChunks.has(fileId)) {
      this.receivedChunks.set(fileId, new Map());
    }
    const fileChunks = this.receivedChunks.get(fileId)!;
    fileChunks.set(chunkIdx, finalChunk);

    // Save partial chunk in IndexedDB for auto-resume
    await storageService.saveChunk(fileId, chunkIdx, finalChunk);

    // Update statistics
    const currentFile = this.activeSession.files.find(f => f.id === fileId) || this.activeSession.files[this.activeSession.currentFileIndex];
    if (currentFile) {
      currentFile.transferredBytes += finalChunk.byteLength;
      currentFile.progress = Math.min(100, Math.round((currentFile.transferredBytes / currentFile.size) * 100));
    }

    this.activeSession.transferredBytes += finalChunk.byteLength;
    this.activeSession.overallProgress = Math.min(100, Math.round((this.activeSession.transferredBytes / this.activeSession.totalBytes) * 100));
    await storageService.saveSessionState(this.activeSession);
    this.notify();

    // Check if file is fully received
    if (fileChunks.size >= totalChunks) {
      await this.assembleAndSaveFile(currentFile, fileChunks);
    }
  }

  private async assembleAndSaveFile(fileItem: TransferFileItem, chunksMap: Map<number, ArrayBuffer>) {
    const sortedChunks: ArrayBuffer[] = [];
    for (let i = 0; i < chunksMap.size; i++) {
      sortedChunks.push(chunksMap.get(i)!);
    }

    const blob = new Blob(sortedChunks, { type: fileItem.type });
    fileItem.blobUrl = URL.createObjectURL(blob);
    fileItem.status = 'completed';
    fileItem.progress = 100;
    this.notify();

    // Save to IndexedDB & trigger download
    await storageService.saveBlob(fileItem.id, blob, fileItem.name);
    storageService.triggerDownload(blob, fileItem.name);
    await storageService.clearChunksForFile(fileItem.id);

    // Check if all files in session completed
    const allDone = this.activeSession?.files.every(f => f.status === 'completed');
    if (allDone && this.activeSession) {
      this.activeSession.status = 'completed';
      this.activeSession.endedAt = Date.now();
      this.notify();
      notificationService.playChime('success');
      this.saveSessionToHistory('received', 'Completed');
      await storageService.clearSessionState(this.activeSession.id);
      this.stopSpeedMonitor();
    }
  }

  // --- Controls: Pause, Resume, Cancel, Retry ---
  pause() {
    this.isPaused = true;
    if (this.activeSession) {
      this.activeSession.status = 'paused';
      this.notify();
      webSocketService.send('TRANSFER_CONTROL', { command: 'PAUSE' }, this.activeSession.peerDevice.id);
    }
  }

  resume() {
    this.isPaused = false;
    if (this.activeSession) {
      this.activeSession.status = 'transferring';
      this.notify();
      webSocketService.send('TRANSFER_CONTROL', { command: 'RESUME' }, this.activeSession.peerDevice.id);
    }
  }

  cancel() {
    this.isCancelled = true;
    if (this.activeSession) {
      this.activeSession.status = 'cancelled';
      this.activeSession.endedAt = Date.now();
      this.notify();
      webSocketService.send('TRANSFER_CONTROL', { command: 'CANCEL' }, this.activeSession.peerDevice.id);
      this.saveSessionToHistory(this.activeSession.direction === 'send' ? 'sent' : 'received', 'Cancelled');
    }
    this.stopSpeedMonitor();
  }

  async retry() {
    if (!this.activeSession) return;
    this.isCancelled = false;
    this.isPaused = false;
    this.activeSession.status = 'transferring';
    this.activeSession.transferredBytes = 0;
    this.activeSession.files.forEach(f => {
      f.transferredBytes = 0;
      f.progress = 0;
      f.status = 'pending';
    });
    this.notify();

    if (this.activeSession.direction === 'send') {
      await this.executeSendLoop();
    }
  }

  // --- Speed & ETA Monitor ---
  private startSpeedMonitor() {
    this.stopSpeedMonitor();
    this.lastTransferredBytes = 0;

    this.speedTimer = setInterval(() => {
      if (!this.activeSession) return;

      const currentBytes = this.activeSession.transferredBytes;
      const deltaBytes = currentBytes - this.lastTransferredBytes;
      this.lastTransferredBytes = currentBytes;

      const currentSpeed = deltaBytes; // Bytes in last 1 second

      if (this.activeSession.direction === 'send') {
        this.activeSession.uploadSpeed = currentSpeed;
        this.activeSession.downloadSpeed = 0;
      } else {
        this.activeSession.downloadSpeed = currentSpeed;
        this.activeSession.uploadSpeed = 0;
      }

      this.activeSession.elapsedSeconds += 1;
      const remainingBytes = Math.max(0, this.activeSession.totalBytes - currentBytes);

      if (currentSpeed > 0) {
        this.activeSession.etaSeconds = Math.ceil(remainingBytes / currentSpeed);
        this.activeSession.averageSpeed = Math.round(currentBytes / Math.max(1, this.activeSession.elapsedSeconds));
      } else {
        this.activeSession.etaSeconds = 0;
      }

      if (this.activeSession.direction === 'send') {
        webSocketService.send('TRANSFER_PROGRESS', {
          transferredBytes: currentBytes,
          overallProgress: this.activeSession.overallProgress,
          currentFileIndex: this.activeSession.currentFileIndex,
          uploadSpeed: currentSpeed,
          downloadSpeed: 0,
          averageSpeed: this.activeSession.averageSpeed,
          etaSeconds: this.activeSession.etaSeconds,
          elapsedSeconds: this.activeSession.elapsedSeconds,
        }, this.activeSession.peerDevice.id);
      }

      this.notify();
    }, 1000);
  }

  private stopSpeedMonitor() {
    if (this.speedTimer) clearInterval(this.speedTimer);
  }

  private sendRawOrFallback(peerId: string, data: string | ArrayBuffer) {
    let sent = webRTCService.sendData(peerId, data);
    if (!sent) {
      sent = peerService.sendData(peerId, data);
    }
    if (!sent && typeof data === 'string') {
      webSocketService.send('FALLBACK_FILE_CHUNK', { meta: data, chunkBase64: '' }, peerId);
    }
  }

  private saveSessionToHistory(direction: 'sent' | 'received', status: 'Completed' | 'Failed' | 'Cancelled') {
    if (!this.activeSession) return;
    const session = this.activeSession;
    const myDeviceName = useSettingsStore.getState().deviceName || 'FlowShare Peer';

    session.files.forEach(f => {
      historyService.saveHistoryItem({
        id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        fileName: f.name,
        fileSize: f.size,
        fileType: f.type,
        direction,
        senderName: direction === 'sent' ? myDeviceName : session.peerDevice.name,
        receiverName: direction === 'sent' ? session.peerDevice.name : myDeviceName,
        peerDeviceId: session.peerDevice.id,
        peerDeviceName: session.peerDevice.name,
        transferSpeed: session.averageSpeed || 25000000,
        transferTimeSec: session.elapsedSeconds || 1,
        date: new Date().toISOString(),
        timestamp: Date.now(),
        status,
        blobUrl: f.blobUrl,
      });
    });
  }

  private notify() {
    if (this.onStateChange && this.activeSession) {
      this.onStateChange({ ...this.activeSession });
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

export default new TransferEngine();
