import { create } from 'zustand';
import { SelectedFile, TransferSession, SpeedDataPoint } from '../types';

interface TransferState {
  selectedFiles: SelectedFile[];
  activeSession: TransferSession | null;
  speedHistory: SpeedDataPoint[];
  incomingModalSession: TransferSession | null;
  addFiles: (files: SelectedFile[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  setActiveSession: (session: TransferSession | null) => void;
  updateActiveSession: (partial: Partial<TransferSession>) => void;
  addSpeedDataPoint: (point: SpeedDataPoint) => void;
  setIncomingModalSession: (session: TransferSession | null) => void;
}

export const useTransferStore = create<TransferState>((set) => ({
  selectedFiles: [],
  activeSession: null,
  speedHistory: [
    { timestamp: Date.now() - 5000, uploadSpeed: 12000000, downloadSpeed: 0 },
    { timestamp: Date.now() - 4000, uploadSpeed: 24000000, downloadSpeed: 0 },
    { timestamp: Date.now() - 3000, uploadSpeed: 38000000, downloadSpeed: 0 },
    { timestamp: Date.now() - 2000, uploadSpeed: 45000000, downloadSpeed: 0 },
    { timestamp: Date.now() - 1000, uploadSpeed: 42000000, downloadSpeed: 0 },
    { timestamp: Date.now(), uploadSpeed: 48000000, downloadSpeed: 0 },
  ],
  incomingModalSession: null,

  addFiles: (newFiles) =>
    set((state) => ({
      selectedFiles: [...state.selectedFiles, ...newFiles],
    })),

  removeFile: (id) =>
    set((state) => ({
      selectedFiles: state.selectedFiles.filter((f) => f.id !== id),
    })),

  clearFiles: () => set({ selectedFiles: [] }),

  setActiveSession: (activeSession) => set({ activeSession }),

  updateActiveSession: (partial) =>
    set((state) => ({
      activeSession: state.activeSession ? { ...state.activeSession, ...partial } : null,
    })),

  addSpeedDataPoint: (point) =>
    set((state) => ({
      speedHistory: [...state.speedHistory.slice(-29), point], // keep last 30 data points
    })),

  setIncomingModalSession: (incomingModalSession) => set({ incomingModalSession }),
}));
