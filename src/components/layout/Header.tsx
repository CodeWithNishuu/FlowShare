import React from 'react';
import { Wifi, ShieldCheck, ArrowUpRight, ArrowDownLeft, Laptop, RefreshCw } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useNetworkStore } from '../../stores/networkStore';
import { useTransferStore } from '../../stores/transferStore';

export const Header: React.FC = () => {
  const { deviceName } = useSettingsStore();
  const network = useNetworkStore();
  const { activeSession } = useTransferStore();

  const formatSpeed = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB/s`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB/s`;
    return `${bytes} B/s`;
  };

  const uploadSpeed = activeSession ? activeSession.uploadSpeed : network.uploadSpeed;
  const downloadSpeed = activeSession ? activeSession.downloadSpeed : network.downloadSpeed;

  return (
    <header className="h-16 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Device Info */}
      <div className="flex items-center space-x-3">
        <div className="p-2 rounded-xl bg-gray-800 text-indigo-400 border border-gray-700/60">
          <Laptop className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <span>{deviceName}</span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono">
              {network.ip}
            </span>
          </h2>
          <p className="text-[11px] text-gray-400 flex items-center space-x-1.5">
            <Wifi className="w-3 h-3 text-emerald-400" />
            <span>{network.interfaceName} • Latency: {network.latency}ms</span>
          </p>
        </div>
      </div>

      {/* Live Speeds & Status Badges */}
      <div className="flex items-center space-x-4">
        {/* Upload Speed Badge */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-gray-800/80 border border-gray-700/60 text-xs">
          <ArrowUpRight className="w-4 h-4 text-indigo-400" />
          <span className="text-gray-400">Up:</span>
          <span className="font-mono font-bold text-indigo-300">{formatSpeed(uploadSpeed)}</span>
        </div>

        {/* Download Speed Badge */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-gray-800/80 border border-gray-700/60 text-xs">
          <ArrowDownLeft className="w-4 h-4 text-cyan-400" />
          <span className="text-gray-400">Down:</span>
          <span className="font-mono font-bold text-cyan-300">{formatSpeed(downloadSpeed)}</span>
        </div>

        {/* Network Health */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span className="font-medium">LAN Health: {network.healthScore}%</span>
        </div>
      </div>
    </header>
  );
};
