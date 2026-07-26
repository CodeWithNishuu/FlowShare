import { useEffect } from 'react';
import { useDeviceStore } from '../stores/deviceStore';
import { useSettingsStore } from '../stores/settingsStore';
import discoveryService from '../services/discoveryService';
import webRTCService from '../services/webRTCService';
import webSocketService from '../services/webSocketService';
import { detectBrowserAndOS } from '../utils/deviceInfo';
import { Device } from '../types';

export function useNearbyDevices() {
  const {
    myDeviceId,
    devices,
    selectedDevice,
    isScanning,
    setDevices,
    addOrUpdateDevice,
    removeDevice,
    setSelectedDevice,
    setIsScanning,
    toggleDeviceTrust,
  } = useDeviceStore();

  const { deviceName } = useSettingsStore();
  const { os, deviceType } = detectBrowserAndOS();

  useEffect(() => {
    discoveryService.startDiscovery(myDeviceId, {
      name: deviceName,
      type: deviceType,
      os: os,
    });

    webRTCService.initSignalingListeners(myDeviceId);

    // Socket message listeners
    const handleRegistered = (data: any) => {
      if (Array.isArray(data.payload?.onlineDevices)) {
        setDevices(data.payload.onlineDevices);
      }
    };

    const handleDiscoveredList = (data: any) => {
      if (Array.isArray(data.payload?.devices)) {
        setDevices(data.payload.devices);
      }
    };

    const handleDeviceJoined = (data: any) => {
      if (data.payload?.device) {
        addOrUpdateDevice(data.payload.device);
      }
    };

    const handleDeviceLeft = (data: any) => {
      if (data.payload?.deviceId) {
        removeDevice(data.payload.deviceId);
      }
    };

    webSocketService.on('REGISTERED', handleRegistered);
    webSocketService.on('DISCOVERED_DEVICES_LIST', handleDiscoveredList);
    webSocketService.on('DEVICE_JOINED', handleDeviceJoined);
    webSocketService.on('DEVICE_LEFT', handleDeviceLeft);

    return () => {
      webSocketService.off('REGISTERED', handleRegistered);
      webSocketService.off('DISCOVERED_DEVICES_LIST', handleDiscoveredList);
      webSocketService.off('DEVICE_JOINED', handleDeviceJoined);
      webSocketService.off('DEVICE_LEFT', handleDeviceLeft);
    };
  }, [myDeviceId, deviceName, os, deviceType]);

  const connectToDevice = async (device: Device) => {
    setSelectedDevice(device);
    addOrUpdateDevice({ ...device, connectionStatus: 'Connecting' });

    const success = await webRTCService.connectToPeer(myDeviceId, device.id);
    if (success) {
      addOrUpdateDevice({ ...device, connectionStatus: 'Connected' });
    } else {
      addOrUpdateDevice({ ...device, connectionStatus: 'Failed' });
    }
  };

  const refreshDiscovery = () => {
    setIsScanning(true);
    discoveryService.requestRefresh();
    setTimeout(() => setIsScanning(false), 1500);
  };

  return {
    myDeviceId,
    devices,
    selectedDevice,
    isScanning,
    setSelectedDevice,
    connectToDevice,
    refreshDiscovery,
    toggleDeviceTrust,
  };
}
