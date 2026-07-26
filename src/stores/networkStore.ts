import { create } from 'zustand';
import { NetworkStats } from '../types';

interface NetworkState extends NetworkStats {
  setNetworkStats: (stats: Partial<NetworkStats>) => void;
  updateLiveSpeeds: (uploadSpeed: number, downloadSpeed: number) => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  ip: '192.168.1.105',
  subnet: '192.168.1.0/24',
  interfaceName: 'Wi-Fi 6 (802.11ax)',
  signalStrength: 98,
  uploadSpeed: 0,
  downloadSpeed: 0,
  latency: 6,
  healthScore: 99,
  totalBytesSent: 14250000000, // 14.25 GB
  totalBytesReceived: 28900000000, // 28.9 GB

  setNetworkStats: (stats) => set((state) => ({ ...state, ...stats })),
  updateLiveSpeeds: (uploadSpeed, downloadSpeed) =>
    set((state) => ({
      uploadSpeed,
      downloadSpeed,
      totalBytesSent: state.totalBytesSent + uploadSpeed,
      totalBytesReceived: state.totalBytesReceived + downloadSpeed,
    })),
}));
