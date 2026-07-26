import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, ShieldCheck, Clock, FileText, CheckCircle, XCircle } from 'lucide-react';
import { useTransfer } from '../../hooks/useTransfer';

export const IncomingTransferModal: React.FC = () => {
  const navigate = useNavigate();
  const { incomingModalSession, acceptIncomingTransfer, rejectIncomingTransfer } = useTransfer();

  if (!incomingModalSession) return null;

  const handleAccept = async () => {
    await acceptIncomingTransfer();
    navigate('/transfer');
  };

  const firstFile = incomingModalSession.files[0];
  const fileCount = incomingModalSession.totalFiles;
  const totalBytes = incomingModalSession.totalBytes;

  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  const formatTime = (sec: number) => {
    if (sec <= 0) return 'Instant';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s} sec`;
    return `${m} min ${s} sec`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl shadow-indigo-500/10 space-y-6"
        >
          {/* Top Header */}
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 ring-4 ring-indigo-500/10">
              <Download className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Incoming File Transfer</h3>
              <p className="text-xs text-gray-400">Direct peer-to-peer connection request</p>
            </div>
          </div>

          {/* Peer & File Details Card */}
          <div className="bg-gray-800/60 rounded-2xl p-4 border border-gray-700/60 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-700/50 pb-3">
              <span className="text-xs text-gray-400">Sender</span>
              <span className="text-sm font-semibold text-indigo-300">
                {incomingModalSession.peerDevice.name}
              </span>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2.5 rounded-xl bg-gray-900/80 text-cyan-400 mt-0.5">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-white truncate">
                  {firstFile ? firstFile.name : 'Incoming Batch Files'}
                </p>
                {fileCount > 1 && (
                  <p className="text-xs text-indigo-400 font-medium mt-0.5">
                    + {fileCount - 1} more file{fileCount - 1 > 1 ? 's' : ''}
                  </p>
                )}
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                  <span className="font-semibold text-gray-200">{formatBytes(totalBytes)}</span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Est. Time: {formatTime(incomingModalSession.etaSeconds)}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Badge */}
          <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-2 rounded-xl">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <span>End-to-End Encrypted via ECDH & AES-256-GCM</span>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={rejectIncomingTransfer}
              className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold text-sm transition-all border border-gray-700"
            >
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>Reject</span>
            </button>
            <button
              onClick={handleAccept}
              className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30"
            >
              <CheckCircle className="w-4 h-4 text-emerald-300" />
              <span>Accept</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
