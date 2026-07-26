import { useEffect } from 'react';
import { useTransferStore } from '../stores/transferStore';
import { useDeviceStore } from '../stores/deviceStore';
import transferEngine from '../services/transferEngine';
import webSocketService from '../services/webSocketService';
import { Device, SelectedFile } from '../types';

export function useTransfer() {
  const {
    selectedFiles,
    activeSession,
    speedHistory,
    incomingModalSession,
    addFiles,
    removeFile,
    clearFiles,
    setActiveSession,
    updateActiveSession,
    addSpeedDataPoint,
    setIncomingModalSession,
  } = useTransferStore();

  const { devices } = useDeviceStore();

  // Initial session recovery on app mount
  useEffect(() => {
    async function restore() {
      if (!activeSession) {
        const restored = await transferEngine.restoreSavedSession();
        if (restored) {
          setActiveSession(restored);
        }
      }
    }
    restore();
  }, []);

  useEffect(() => {
    // Listen for incoming transfer requests via WebSocket
    const handleIncomingRequest = (msg: any) => {
      const { senderId, payload } = msg;
      const peer = devices.find(d => d.id === senderId) || {
        id: senderId,
        name: payload.senderName || 'LAN Peer',
        type: 'Desktop',
        os: 'Windows',
        ip: '192.168.1.100',
        signalStrength: 95,
        connectionQuality: 'Excellent',
        latency: 10,
        isOnline: true,
      };

      const session = transferEngine.handleIncomingTransferRequest(payload, peer as Device);
      setIncomingModalSession(session);
    };

    const handleTransferResponse = (msg: any) => {
      const { payload } = msg;
      if (payload.accepted) {
        transferEngine.executeSendLoop();
      } else {
        updateActiveSession({ status: 'rejected', error: payload.reason || 'Transfer declined by receiver' });
      }
    };

    webSocketService.on('INCOMING_TRANSFER_REQUEST', handleIncomingRequest);
    webSocketService.on('TRANSFER_RESPONSE_RESULT', handleTransferResponse);

    return () => {
      webSocketService.off('INCOMING_TRANSFER_REQUEST', handleIncomingRequest);
      webSocketService.off('TRANSFER_RESPONSE_RESULT', handleTransferResponse);
    };
  }, [devices]);

  // Sync transfer engine session updates
  useEffect(() => {
    if (activeSession) {
      transferEngine.setActiveSession(activeSession, (updated) => {
        setActiveSession(updated);
        addSpeedDataPoint({
          timestamp: Date.now(),
          uploadSpeed: updated.uploadSpeed,
          downloadSpeed: updated.downloadSpeed,
        });
      });
    }
  }, [activeSession?.id]);

  const sendFilesToDevice = async (peerDevice: Device, files: SelectedFile[]) => {
    const session = await transferEngine.startSending(peerDevice, files);
    setActiveSession(session);
  };

  const acceptIncomingTransfer = async () => {
    if (incomingModalSession) {
      setActiveSession(incomingModalSession);
      const id = incomingModalSession.id;
      setIncomingModalSession(null);
      await transferEngine.acceptTransfer(id);
    }
  };

  const rejectIncomingTransfer = () => {
    if (incomingModalSession) {
      transferEngine.rejectTransfer(incomingModalSession.id);
      setIncomingModalSession(null);
    }
  };

  return {
    selectedFiles,
    activeSession,
    speedHistory,
    incomingModalSession,
    addFiles,
    removeFile,
    clearFiles,
    sendFilesToDevice,
    acceptIncomingTransfer,
    rejectIncomingTransfer,
    pauseTransfer: () => transferEngine.pause(),
    resumeTransfer: () => transferEngine.resume(),
    cancelTransfer: () => transferEngine.cancel(),
    retryTransfer: () => transferEngine.retry(),
  };
}
