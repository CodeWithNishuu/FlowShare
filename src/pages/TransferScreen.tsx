import React from 'react';
import { motion } from 'framer-motion';
import {
  Pause,
  Play,
  XCircle,
  RotateCcw,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  HardDrive,
  FileText,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useTransfer } from '../hooks/useTransfer';
import { CircularProgress } from '../components/common/CircularProgress';
import { SpeedChart } from '../components/common/SpeedChart';

export const TransferScreen: React.FC = () => {
  const {
    activeSession,
    speedHistory,
    pauseTransfer,
    resumeTransfer,
    cancelTransfer,
    retryTransfer,
  } = useTransfer();

  if (!activeSession) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center text-center space-y-4 bg-gray-900/40 rounded-3xl border border-gray-800 p-8">
        <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center text-gray-500">
          <HardDrive className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">No Active Transfer</h2>
        <p className="text-sm text-gray-400 max-w-md">
          Start sending files or wait for an incoming transfer request to view live session telemetry.
        </p>
      </div>
    );
  }

  const {
    direction,
    peerDevice,
    files,
    currentFileIndex,
    totalFiles,
    totalBytes,
    transferredBytes,
    overallProgress,
    uploadSpeed,
    downloadSpeed,
    averageSpeed,
    etaSeconds,
    elapsedSeconds,
    status,
    isEncrypted,
  } = activeSession;

  const currentFile = files[currentFileIndex] || files[0];
  const remainingBytes = Math.max(0, totalBytes - transferredBytes);
  const remainingFilesCount = Math.max(0, totalFiles - (currentFileIndex + 1));

  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${bytes} B`;
  };

  const formatSpeed = (bytesPerSec: number) => {
    if (bytesPerSec >= 1024 * 1024) return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
    if (bytesPerSec >= 1024) return `${(bytesPerSec / 1024).toFixed(0)} KB/s`;
    return `${bytesPerSec} B/s`;
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  const activeSpeed = direction === 'send' ? uploadSpeed : downloadSpeed;
  const currentChunkIdx = Math.ceil(currentFile ? currentFile.transferredBytes / (128 * 1024) : 0);
  const totalChunks = Math.max(1, Math.ceil(currentFile ? currentFile.size / (128 * 1024) : 1));

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-900/80 backdrop-blur-md p-4 sm:p-6 rounded-3xl border border-gray-800">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                direction === 'send'
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                  : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
              }`}
            >
              {direction === 'send' ? 'Sending File Queue' : 'Receiving Files'}
            </span>
            {isEncrypted && (
              <span className="flex items-center space-x-1 text-xs text-emerald-400 font-semibold bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-800/40">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>AES-256 Encrypted</span>
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-2">
            Peer: {peerDevice.name} ({peerDevice.ip})
          </h1>
        </div>

        {/* Transfer Action Controls: Pause, Resume, Cancel, Retry */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {status === 'transferring' && (
            <button
              onClick={pauseTransfer}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 font-bold text-sm border border-amber-500/40 transition-all"
            >
              <Pause className="w-4 h-4" />
              <span>Pause</span>
            </button>
          )}

          {status === 'paused' && (
            <button
              onClick={resumeTransfer}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Play className="w-4 h-4" />
              <span>Resume</span>
            </button>
          )}

          {(status === 'cancelled' || status === 'failed') && (
            <button
              onClick={retryTransfer}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry</span>
            </button>
          )}

          {status !== 'completed' && status !== 'cancelled' && (
            <button
              onClick={cancelTransfer}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-bold text-sm border border-rose-500/40 transition-all"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Dashboard Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left Column: Large Circular Progress & Comprehensive Telemetry */}
        <div className="bg-gray-900/80 backdrop-blur-md p-5 sm:p-8 rounded-3xl border border-gray-800 flex flex-col items-center justify-center space-y-6">
          <div className="w-full flex justify-center">
            <CircularProgress
              percentage={overallProgress}
              size={220}
              strokeWidth={16}
              speedText={formatSpeed(activeSpeed)}
              label={currentFile ? currentFile.name : 'Transfer Queue'}
              subText={`${currentFileIndex + 1} of ${totalFiles} Files (${overallProgress}%)`}
            />
          </div>

          {/* Detailed Stat Chips for all 13 required metrics */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full text-xs">
            <div className="p-3 rounded-2xl bg-gray-800/60 border border-gray-700/50">
              <span className="text-gray-400 block text-[11px]">Current Speed</span>
              <span className="text-xs sm:text-sm font-bold text-emerald-400 font-mono">
                {formatSpeed(activeSpeed)}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-gray-800/60 border border-gray-700/50">
              <span className="text-gray-400 block text-[11px]">Average Speed</span>
              <span className="text-xs sm:text-sm font-bold text-indigo-300 font-mono">
                {formatSpeed(averageSpeed || activeSpeed)}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-gray-800/60 border border-gray-700/50">
              <span className="text-gray-400 block text-[11px]">Upload Speed</span>
              <span className="text-xs sm:text-sm font-bold text-indigo-400 font-mono">
                {formatSpeed(uploadSpeed)}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-gray-800/60 border border-gray-700/50">
              <span className="text-gray-400 block text-[11px]">Download Speed</span>
              <span className="text-xs sm:text-sm font-bold text-cyan-400 font-mono">
                {formatSpeed(downloadSpeed)}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-gray-800/60 border border-gray-700/50">
              <span className="text-gray-400 block text-[11px]">Remaining / Total</span>
              <span className="text-xs font-bold text-white font-mono">
                {formatBytes(remainingBytes)} / {formatBytes(totalBytes)}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-gray-800/60 border border-gray-700/50">
              <span className="text-gray-400 block text-[11px]">ETA / Elapsed</span>
              <span className="text-xs font-bold text-amber-300">
                {formatDuration(etaSeconds)} / {formatDuration(elapsedSeconds)}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-gray-800/60 border border-gray-700/50 col-span-2 flex items-center justify-between">
              <div>
                <span className="text-gray-400 block text-[11px]">Current File & Chunk</span>
                <span className="text-xs font-bold text-cyan-300 truncate max-w-[160px] sm:max-w-[200px] block">
                  {currentFile ? currentFile.name : 'None'}
                </span>
              </div>
              <span className="px-2 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-mono font-bold">
                Chunk {currentChunkIdx}/{totalChunks}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Live Speed Chart & File Queue List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Speed Graph */}
          <SpeedChart data={speedHistory} height={160} />

          {/* File Queue List */}
          <div className="bg-gray-900/80 backdrop-blur-md p-4 sm:p-6 rounded-3xl border border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <span>Transfer File Queue</span>
              </h3>
              <span className="text-xs text-gray-400 font-semibold">
                {remainingFilesCount} Remaining Queue
              </span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar pr-1">
              {files.map((file, idx) => (
                <div
                  key={file.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                    idx === currentFileIndex
                      ? 'bg-indigo-600/10 border-indigo-500/50'
                      : 'bg-gray-800/40 border-gray-700/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-white truncate max-w-[180px] sm:max-w-xs">{file.name}</span>
                    <span className="text-gray-400 font-mono">{formatBytes(file.size)}</span>
                  </div>

                  {/* Individual File Progress Bar */}
                  <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full transition-all duration-300"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2">
                    <span>{file.progress}% Completed</span>
                    <span className="capitalize text-indigo-300 font-semibold">{file.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
