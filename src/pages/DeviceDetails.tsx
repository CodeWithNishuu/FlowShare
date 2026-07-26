import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Laptop,
  Smartphone,
  Tablet,
  Radio,
  Wifi,
  Shield,
  Send,
  ArrowLeft,
  Activity,
  CheckCircle,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { useDeviceStore } from '../stores/deviceStore';
import { useTransfer } from '../hooks/useTransfer';
import { DropZone } from '../components/common/DropZone';

export const DeviceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { devices, toggleDeviceTrust } = useDeviceStore();
  const { selectedFiles, addFiles, removeFile, clearFiles, sendFilesToDevice } = useTransfer();
  const [isPingTesting, setIsPingTesting] = useState(false);
  const [pingResult, setPingResult] = useState<number | null>(null);

  const device = devices.find((d) => d.id === id) || devices[0];

  if (!device) {
    return (
      <div className="p-8 text-center text-gray-400">
        <p>Device not found.</p>
        <button onClick={() => navigate('/nearby')} className="mt-4 text-indigo-400 font-bold">
          Back to Nearby Devices
        </button>
      </div>
    );
  }

  const getDeviceIcon = (type: string) => {
    if (type === 'Mobile') return <Smartphone className="w-8 h-8 text-cyan-400" />;
    if (type === 'Tablet') return <Tablet className="w-8 h-8 text-purple-400" />;
    return <Laptop className="w-8 h-8 text-indigo-400" />;
  };

  const handlePingTest = () => {
    setIsPingTesting(true);
    setTimeout(() => {
      setPingResult(Math.floor(Math.random() * 8) + 4);
      setIsPingTesting(false);
    }, 800);
  };

  const handleSendToThisDevice = async () => {
    if (selectedFiles.length === 0) return;
    await sendFilesToDevice(device, selectedFiles);
    navigate('/transfer');
  };

  return (
    <div className="space-y-8">
      {/* Back Button & Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/nearby')}
          className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">{device.name}</h1>
          <p className="text-sm text-gray-400">Device ID: {device.id}</p>
        </div>
      </div>

      {/* Device Summary Card */}
      <div className="bg-gray-900/80 backdrop-blur-md p-8 rounded-3xl border border-gray-800 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Col 1: Icon & Name */}
        <div className="flex items-center space-x-4">
          <div className="p-4 rounded-2xl bg-gray-800 border border-gray-700/60 shadow-lg">
            {getDeviceIcon(device.type)}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{device.name}</h3>
            <p className="text-xs text-gray-400">
              {device.os} • {device.type}
            </p>
            <span
              className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                device.isOnline
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-gray-800 text-gray-400 border-gray-700'
              }`}
            >
              {device.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Col 2: Telemetry Table */}
        <div className="space-y-2 text-xs border-y md:border-y-0 md:border-x border-gray-800 py-4 md:py-0 md:px-6">
          <div className="flex justify-between">
            <span className="text-gray-400">IP Address:</span>
            <span className="font-mono text-gray-200 font-semibold">{device.ip}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Signal Strength:</span>
            <span className="font-semibold text-cyan-400">{device.signalStrength}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Latency:</span>
            <span className="font-semibold text-emerald-400">
              {pingResult ? `${pingResult} ms (Tested)` : `${device.latency} ms`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Battery:</span>
            <span className="font-semibold text-amber-300">
              {device.battery ? `${device.battery}%` : 'AC Adapter'}
            </span>
          </div>
        </div>

        {/* Col 3: Actions */}
        <div className="flex flex-col justify-between space-y-3">
          <button
            onClick={() => toggleDeviceTrust(device.id)}
            className={`w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-bold border transition-all ${
              device.isTrusted
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>{device.isTrusted ? 'Trusted Device' : 'Mark as Trusted'}</span>
          </button>

          <button
            onClick={handlePingTest}
            disabled={isPingTesting}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 text-xs font-bold transition-all"
          >
            <Activity className={`w-4 h-4 ${isPingTesting ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{isPingTesting ? 'Testing Ping...' : 'Test Connection Latency'}</span>
          </button>
        </div>
      </div>

      {/* Direct Drop & Send Section */}
      <div className="bg-gray-900/80 backdrop-blur-md p-6 rounded-3xl border border-gray-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <Send className="w-5 h-5 text-indigo-400" />
          <span>Direct File Drop to {device.name}</span>
        </h3>

        <DropZone
          files={selectedFiles}
          onAddFiles={addFiles}
          onRemoveFile={removeFile}
          onClearFiles={clearFiles}
        />

        {selectedFiles.length > 0 && (
          <button
            onClick={handleSendToThisDevice}
            className="w-full flex items-center justify-center space-x-2 py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-base shadow-xl shadow-indigo-600/30 transition-all"
          >
            <Send className="w-5 h-5" />
            <span>Send {selectedFiles.length} File(s) Direct to {device.name}</span>
          </button>
        )}
      </div>
    </div>
  );
};
