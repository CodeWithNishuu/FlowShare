import React from 'react';
import { Wifi, ShieldCheck, ArrowUpRight, ArrowDownLeft, Laptop, Menu } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useNetworkStore } from '../../stores/networkStore';
import { useTransferStore } from '../../stores/transferStore';

interface HeaderProps {
  onToggleMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMenu }) => {
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
    <header className="h-16 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Mobile Menu Toggle & Device Info */}
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
        {onToggleMenu && (
          <button
            onClick={onToggleMenu}
            className="lg:hidden p-2 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800/80 transition-colors flex-shrink-0"
            title="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="p-2 rounded-xl bg-gray-800 text-indigo-400 border border-gray-700/60 hidden xs:flex flex-shrink-0">
          <Laptop className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>

        <div className="min-w-0">
          <h2 className="text-xs sm:text-sm font-bold text-white flex items-center space-x-1.5 min-w-0">
            <span className="truncate max-w-[100px] xs:max-w-[140px] sm:max-w-xs">{deviceName}</span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 sm:px-2 py-0.5 rounded-full font-mono flex-shrink-0">
              {network.ip}
            </span>
          </h2>
          <p className="text-[10px] sm:text-[11px] text-gray-400 flex items-center space-x-1 truncate">
            <Wifi className="w-3 h-3 text-emerald-400 flex-shrink-0" />
            <span className="truncate">{network.interfaceName} • {network.latency}ms</span>
          </p>
        </div>
      </div>

      {/* Right: Live Speeds & Status Badges */}
      <div className="flex items-center space-x-1.5 sm:space-x-3 flex-shrink-0">
        {/* Upload Speed Badge */}
        <div className="flex items-center space-x-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-gray-800/80 border border-gray-700/60 text-[11px] sm:text-xs">
          <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400 flex-shrink-0" />
          <span className="text-gray-400 hidden xs:inline">Up:</span>
          <span className="font-mono font-bold text-indigo-300">{formatSpeed(uploadSpeed)}</span>
        </div>

        {/* Download Speed Badge */}
        <div className="flex items-center space-x-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-gray-800/80 border border-gray-700/60 text-[11px] sm:text-xs">
          <ArrowDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 flex-shrink-0" />
          <span className="text-gray-400 hidden xs:inline">Down:</span>
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
