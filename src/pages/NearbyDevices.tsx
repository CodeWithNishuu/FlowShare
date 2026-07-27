import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Radio,
  RefreshCw,
  Shield,
  Laptop,
  Smartphone,
  Tablet,
  Send,
  Info,
} from 'lucide-react';
import { useNearbyDevices } from '../hooks/useNearbyDevices';
import { Device } from '../types';
export const NearbyDevices: React.FC = () => {
  const navigate = useNavigate();

  const {
    devices,
    selectedDevice,
    isScanning,
    connectToDevice,
    refreshDiscovery,
  } = useNearbyDevices();

  const getDeviceIcon = (type: string) => {
    if (type === 'Mobile') return <Smartphone className="w-7 h-7 text-cyan-400" />;
    if (type === 'Tablet') return <Tablet className="w-7 h-7 text-purple-400" />;
    return <Laptop className="w-7 h-7 text-indigo-400" />;
  };

  const handleDeviceClick = async (device: Device) => {
    await connectToDevice(device);
    navigate('/send');
  };

  return (
    <div className="space-y-8">
      {/* Header Banner & Scan Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-900/80 backdrop-blur-md p-4 sm:p-6 rounded-3xl border border-gray-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <Radio className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-400 animate-pulse flex-shrink-0" />
            <span>Nearby Peer Discovery</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Real-time LAN peer scanning via WebSocket signaling & WebRTC. Click any device to connect.
          </p>
        </div>

        <button
          onClick={refreshDiscovery}
          disabled={isScanning}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 font-bold text-xs sm:text-sm transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin text-cyan-400' : ''}`} />
          <span>{isScanning ? 'Scanning LAN...' : 'Refresh Radar'}</span>
        </button>
      </div>

      {/* Radar Visualizer Card */}
      <div className="relative bg-gradient-to-b from-gray-900 to-gray-950 p-6 sm:p-12 rounded-3xl border border-gray-800 flex flex-col items-center justify-center min-h-[240px] sm:min-h-[300px] overflow-hidden">
        {/* Animated Radar Rings */}
        <div className="absolute w-56 h-56 sm:w-80 sm:h-80 rounded-full border border-cyan-500/20 animate-ping opacity-25 pointer-events-none" />
        <div className="absolute w-44 h-44 sm:w-60 sm:h-60 rounded-full border border-indigo-500/30 pointer-events-none" />
        <div className="absolute w-28 h-28 sm:w-40 sm:h-40 rounded-full border border-indigo-500/40 pointer-events-none" />

        <div className="relative z-10 text-center space-y-3">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-indigo-600/30 text-cyan-400 flex items-center justify-center mx-auto ring-4 sm:ring-8 ring-indigo-500/10 shadow-2xl">
            <Radio className="w-6 h-6 sm:w-8 sm:h-8 animate-pulse" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white">Active LAN Peer Radar</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            {devices.filter((d) => d.isOnline).length} active devices listening on your Wi-Fi subnet.
          </p>
        </div>
      </div>

      {/* Device Grid */}
      {devices.length === 0 ? (
        <div className="bg-gray-900/60 backdrop-blur-md rounded-2xl border border-gray-800 p-6 sm:p-12 text-center space-y-3">
          <p className="text-base font-bold text-white">Searching for nearby peer devices...</p>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Open FlowShare in another browser tab, phone, or laptop on the same network to see them appear automatically in real time!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {devices.map((device) => (
            <motion.div
              key={device.id}
              whileHover={{ y: -4 }}
              className={`bg-gray-900/80 backdrop-blur-md rounded-2xl border p-4 sm:p-6 space-y-4 sm:space-y-5 transition-all cursor-pointer relative overflow-hidden ${
                selectedDevice?.id === device.id
                  ? 'border-indigo-500 ring-2 ring-indigo-500/30 shadow-xl shadow-indigo-500/10'
                  : 'border-gray-800 hover:border-gray-700'
              }`}
              onClick={() => handleDeviceClick(device)}
            >
              {/* Device Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 min-w-0 pr-2">
                  <div className="p-2.5 rounded-2xl bg-gray-800/80 border border-gray-700/60 shadow-sm flex-shrink-0">
                    {getDeviceIcon(device.type)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-white truncate">{device.name}</h3>
                    <p className="text-xs text-gray-400 truncate">
                      {device.os} • {device.type}
                    </p>
                  </div>
                </div>

                {/* Online Status Badge */}
                <span
                  className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-semibold border flex items-center space-x-1 flex-shrink-0 ${
                    device.isOnline
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-gray-800 text-gray-400 border-gray-700'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      device.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'
                    }`}
                  />
                  <span>{device.isOnline ? 'Online' : 'Offline'}</span>
                </span>
              </div>

              {/* Device Attributes Table */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs bg-gray-800/40 p-3 rounded-xl border border-gray-800">
                <div>
                  <span className="text-gray-500 block text-[11px]">IP Address</span>
                  <span className="font-mono text-gray-200 font-semibold truncate block">{device.ip}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[11px]">Latency</span>
                  <span className="font-semibold text-emerald-400">{device.latency} ms</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[11px]">Signal Strength</span>
                  <span className="font-semibold text-cyan-400">{device.signalStrength}%</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[11px]">Battery</span>
                  <span className="font-semibold text-amber-400 truncate block">
                    {device.battery ? `${device.battery}%` : 'AC Power'}
                  </span>
                </div>
              </div>

              {/* Connection Status & Action Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                <div className="flex items-center space-x-1 text-gray-400">
                  <Shield className={`w-3.5 h-3.5 ${device.isTrusted ? 'text-indigo-400' : 'text-gray-500'}`} />
                  <span className="text-[11px]">{device.isTrusted ? 'Trusted' : 'Standard'}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/device/${device.id}`);
                    }}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="Device Details"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeviceClick(device);
                    }}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all min-h-[36px]"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Connect & Send</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
