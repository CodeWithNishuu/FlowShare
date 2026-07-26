import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  Radio,
  History,
  HardDrive,
  Wifi,
  Zap,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  FileText,
  ChevronRight,
  Activity,
  Laptop,
  Smartphone,
  Tablet,
} from 'lucide-react';
import { useDeviceStore } from '../stores/deviceStore';
import { useHistoryStore } from '../stores/historyStore';
import { useNetworkStore } from '../stores/networkStore';
import { useTransferStore } from '../stores/transferStore';
import { SpeedChart } from '../components/common/SpeedChart';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { devices } = useDeviceStore();
  const { history } = useHistoryStore();
  const network = useNetworkStore();
  const { activeSession, speedHistory } = useTransferStore();

  const recentTransfers = history.slice(0, 4);
  const onlineDevicesCount = devices.filter((d) => d.isOnline).length;
  const completedCount = history.filter((h) => h.status === 'Completed').length;
  const failedCount = history.filter((h) => h.status === 'Failed').length;

  const currentUpload = activeSession ? activeSession.uploadSpeed : network.uploadSpeed;
  const currentDownload = activeSession ? activeSession.downloadSpeed : network.downloadSpeed;

  const getDeviceIcon = (type: string) => {
    if (type === 'Mobile') return <Smartphone className="w-5 h-5 text-cyan-400" />;
    if (type === 'Tablet') return <Tablet className="w-5 h-5 text-purple-400" />;
    return <Laptop className="w-5 h-5 text-indigo-400" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${bytes} B`;
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900/40 via-gray-900 to-cyan-900/30 p-6 rounded-3xl border border-gray-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">FlowShare Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">
            Wireless LAN file sharing active • {onlineDevicesCount} peer device{onlineDevicesCount !== 1 ? 's' : ''} online
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/send')}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Send Files</span>
          </button>
          <button
            onClick={() => navigate('/nearby')}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 font-bold text-sm transition-all"
          >
            <Radio className="w-4 h-4 text-cyan-400" />
            <span>Discover Peers</span>
          </button>
          <button
            onClick={() => navigate('/history')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 text-sm font-medium transition-all"
          >
            <History className="w-4 h-4" />
            <span>History</span>
          </button>
        </div>
      </div>

      {/* Metrics Row: Current Speed, Network, Storage, Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Current Speed Card */}
        <div className="bg-gray-900/70 backdrop-blur-md p-5 rounded-2xl border border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">Current Speed</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-white">
              {formatSize(currentUpload + currentDownload)}
            </span>
            <span className="text-xs text-gray-400">/sec</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-800/60">
            <span className="flex items-center space-x-1 text-indigo-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{formatSize(currentUpload)}/s</span>
            </span>
            <span className="flex items-center space-x-1 text-cyan-400">
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>{formatSize(currentDownload)}/s</span>
            </span>
          </div>
        </div>

        {/* Current Network Card */}
        <div className="bg-gray-900/70 backdrop-blur-md p-5 rounded-2xl border border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">Current Network</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Wifi className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-bold text-white truncate">{network.interfaceName}</p>
          <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-800/60">
            <span className="font-mono">{network.ip}</span>
            <span className="text-emerald-400 font-semibold">{network.latency} ms</span>
          </div>
        </div>

        {/* Storage Usage Card */}
        <div className="bg-gray-900/70 backdrop-blur-md p-5 rounded-2xl border border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">Storage Usage</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white">IndexedDB Active</p>
          <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full w-[100%]" />
          </div>
          <div className="flex justify-between text-[11px] text-gray-400">
            <span>Direct P2P Storage</span>
            <span>Zero Server Footprint</span>
          </div>
        </div>

        {/* Transfer Statistics Card */}
        <div className="bg-gray-900/70 backdrop-blur-md p-5 rounded-2xl border border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">Transfer Statistics</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-white">{completedCount}</span>
            <span className="text-xs text-gray-400">Completed</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-800/60">
            <span className="text-emerald-400">Success: {completedCount}</span>
            <span className="text-rose-400">Failed: {failedCount}</span>
          </div>
        </div>
      </div>

      {/* Network Health & Live Speed Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              <span>Real-Time Speed Telemetry</span>
            </h3>
            <span className="text-xs text-gray-400 font-mono">Sampling 1000ms</span>
          </div>
          <SpeedChart data={speedHistory} height={160} />
        </div>

        {/* Network Health Card */}
        <div className="bg-gray-900/70 backdrop-blur-md p-6 rounded-2xl border border-gray-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Network Health</h3>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                {network.healthScore}% Optimal
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Wi-Fi network signal is strong. WebRTC peer channels operating at zero packet loss.
            </p>
          </div>

          <div className="space-y-2 border-t border-gray-800 pt-4 text-xs">
            <div className="flex justify-between text-gray-400">
              <span>Encryption Status:</span>
              <span className="text-indigo-400 font-semibold flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>AES-GCM Active</span>
              </span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Signaling Socket:</span>
              <span className="text-emerald-400 font-semibold">Connected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Nearby Devices & Recent Transfers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nearby Devices Preview */}
        <div className="bg-gray-900/70 backdrop-blur-md p-6 rounded-2xl border border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Radio className="w-5 h-5 text-cyan-400" />
              <span>Nearby Devices</span>
            </h3>
            <button
              onClick={() => navigate('/nearby')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {devices.length === 0 ? (
              <p className="text-xs text-gray-400 py-3 text-center">
                No nearby devices online. Open FlowShare on another browser or device on the same Wi-Fi.
              </p>
            ) : (
              devices.slice(0, 3).map((device) => (
                <div
                  key={device.id}
                  onClick={() => navigate(`/device/${device.id}`)}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 transition-all cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-gray-900 border border-gray-700/60">
                      {getDeviceIcon(device.type)}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{device.name}</h4>
                      <p className="text-xs text-gray-400">
                        {device.os} • {device.ip}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">
                      {device.signalStrength}% Signal
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transfers / Files */}
        <div className="bg-gray-900/70 backdrop-blur-md p-6 rounded-2xl border border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <History className="w-5 h-5 text-indigo-400" />
              <span>Recent Transfers</span>
            </h3>
            <button
              onClick={() => navigate('/history')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
            >
              <span>History</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {recentTransfers.length === 0 ? (
              <p className="text-xs text-gray-400 py-3 text-center">
                No recent transfers recorded yet.
              </p>
            ) : (
              recentTransfers.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-gray-800/50 border border-gray-700/50"
                >
                  <div className="flex items-center space-x-3 min-w-0 pr-2">
                    <div className="p-2.5 rounded-xl bg-gray-900 text-indigo-400 border border-gray-700/60">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{item.fileName}</p>
                      <p className="text-xs text-gray-400">
                        {item.direction === 'sent' ? `To: ${item.receiverName}` : `From: ${item.senderName}`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 text-xs">
                    <p className="font-bold text-gray-200">{formatSize(item.fileSize)}</p>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold mt-0.5 ${
                        item.status === 'Completed'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
