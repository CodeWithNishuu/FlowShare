import React from 'react';
import { Download, ShieldCheck, Folder, CheckCircle, Radio, Clock } from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';
import { useTransferStore } from '../stores/transferStore';

export const ReceiveFiles: React.FC = () => {
  const { downloadFolder, autoAcceptTrusted, updateSettings } = useSettingsStore();
  const { incomingModalSession } = useTransferStore();

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gray-900/80 backdrop-blur-md p-6 rounded-3xl border border-gray-800 space-y-1">
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-3">
          <Download className="w-7 h-7 text-cyan-400" />
          <span>Receive Hub</span>
        </h1>
        <p className="text-sm text-gray-400">
          Your device is discoverable on the LAN. Incoming transfer requests will prompt for your approval before downloading.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Readiness Status Card */}
        <div className="bg-gray-900/80 backdrop-blur-md p-6 rounded-3xl border border-gray-800 space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center ring-8 ring-cyan-500/10">
              <Radio className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Listening for Nearby Senders</h3>
              <p className="text-xs text-gray-400">WebRTC DataChannel ready for incoming streams</p>
            </div>
          </div>

          <div className="space-y-3 border-t border-gray-800 pt-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Download Directory:</span>
              <span className="font-mono text-gray-200 bg-gray-800 px-2 py-1 rounded-lg border border-gray-700">
                {downloadFolder}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-gray-400">Auto-Accept Trusted Peers:</span>
              <button
                type="button"
                onClick={() => updateSettings({ autoAcceptTrusted: !autoAcceptTrusted })}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  autoAcceptTrusted ? 'bg-indigo-600' : 'bg-gray-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                    autoAcceptTrusted ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Security & Verification Card */}
        <div className="bg-gray-900/80 backdrop-blur-md p-6 rounded-3xl border border-gray-800 space-y-5 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Security Guarantee</span>
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              No files are received without explicit user authorization unless auto-accept is configured for trusted contacts. Every received chunk is verified with SHA-256 integrity hashes.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-800/40 space-y-2">
            <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-xs">
              <CheckCircle className="w-4 h-4" />
              <span>Zero-Cloud Storage</span>
            </div>
            <p className="text-[11px] text-gray-400">
              Received data flows straight from sender RAM/Disk to your browser memory and IndexedDB.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
