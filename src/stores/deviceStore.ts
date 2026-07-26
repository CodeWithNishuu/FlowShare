import { create } from 'zustand';
import { Device } from '../types';
import { detectBrowserAndOS } from '../utils/deviceInfo';

interface DeviceState {
  myDeviceId: string;
  devices: Device[];
  selectedDevice: Device | null;
  isScanning: boolean;
  setDevices: (devices: Device[]) => void;
  addOrUpdateDevice: (device: Device) => void;
  removeDevice: (deviceId: string) => void;
  setSelectedDevice: (device: Device | null) => void;
  setIsScanning: (isScanning: boolean) => void;
  toggleDeviceTrust: (deviceId: string) => void;
}

const { browser, os, deviceType } = detectBrowserAndOS();
const randomId = Math.floor(1000 + Math.random() * 9000);

export const useDeviceStore = create<DeviceState>((set) => ({
  myDeviceId: `dev_${browser.toLowerCase()}_${randomId}`,
  devices: [], // Zero mock/fake devices
  selectedDevice: null,
  isScanning: true,
  setDevices: (devices) => set({ devices }),
  addOrUpdateDevice: (device) =>
    set((state) => {
      const idx = state.devices.findIndex((d) => d.id === device.id);
      if (idx >= 0) {
        const updated = [...state.devices];
        updated[idx] = { ...updated[idx], ...device };
        return { devices: updated };
      }
      return { devices: [...state.devices, device] };
    }),
  removeDevice: (deviceId) =>
    set((state) => ({
      devices: state.devices.filter((d) => d.id !== deviceId),
      selectedDevice: state.selectedDevice?.id === deviceId ? null : state.selectedDevice,
    })),
  setSelectedDevice: (selectedDevice) => set({ selectedDevice }),
  setIsScanning: (isScanning) => set({ isScanning }),
  toggleDeviceTrust: (deviceId) =>
    set((state) => ({
      devices: state.devices.map((d) =>
        d.id === deviceId ? { ...d, isTrusted: !d.isTrusted } : d
      ),
    })),
}));
