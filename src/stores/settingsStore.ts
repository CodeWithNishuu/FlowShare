import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Settings } from '../types';
import { detectBrowserAndOS } from '../utils/deviceInfo';

interface SettingsState extends Settings {
  updateSettings: (partial: Partial<Settings>) => void;
  resetSettings: () => void;
}

const { defaultName } = detectBrowserAndOS();

const defaultSettings: Settings = {
  deviceName: typeof window !== 'undefined' ? defaultName : 'FlowDevice',
  theme: 'dark',
  accentColor: '#6366f1',
  language: 'English',
  downloadFolder: 'C:\\Downloads\\FlowShare',
  notifications: true,
  autoAcceptTrusted: false,
  encryptionEnabled: true,
  visibility: 'everyone',
  bandwidthLimitMbps: 0,
  transferLimitGb: 0,
  autoSaveToDownloads: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      updateSettings: (partial) => set((state) => ({ ...state, ...partial })),
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'flowshare_settings',
    }
  )
);
