import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Radio, ShieldCheck, Check, Laptop, Smartphone, Tablet } from 'lucide-react';
import { DropZone } from '../components/common/DropZone';
import { useTransfer } from '../hooks/useTransfer';
import { useDeviceStore } from '../stores/deviceStore';
import { Device } from '../types';

export const SendFiles: React.FC = () => {
  const navigate = useNavigate();
  const { selectedFiles, addFiles, removeFile, clearFiles, sendFilesToDevice } = useTransfer();
  const { devices } = useDeviceStore();
  const [selectedTargetDevice, setSelectedTargetDevice] = useState<Device | null>(devices[0] || null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!selectedTargetDevice && devices.length > 0) {
      setSelectedTargetDevice(devices[0]);
    }
  }, [devices, selectedTargetDevice]);

  const getDeviceIcon = (type: string) => {
    if (type === 'Mobile') return <Smartphone className="w-5 h-5 text-cyan-400" />;
    if (type === 'Tablet') return <Tablet className="w-5 h-5 text-purple-400" />;
    return <Laptop className="w-5 h-5 text-indigo-400" />;
  };

  const handleSend = async () => {
    if (!selectedTargetDevice || selectedFiles.length === 0) return;
    setIsSending(true);
    await sendFilesToDevice(selectedTargetDevice, selectedFiles);
    setIsSending(false);
    navigate('/transfer');
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gray-900/80 backdrop-blur-md p-6 rounded-3xl border border-gray-800 space-y-1">
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-3">
          <Send className="w-7 h-7 text-indigo-400" />
          <span>Send Files & Folders</span>
        </h1>
        <p className="text-sm text-gray-400">
          Select or drag files and target a nearby LAN peer device for instant peer-to-peer streaming.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Drag & Drop DropZone */}
        <div className="lg:col-span-2 space-y-6">
          <DropZone
            files={selectedFiles}
            onAddFiles={addFiles}
            onRemoveFile={removeFile}
            onClearFiles={clearFiles}
          />
        </div>

        {/* Right Col: Destination Peer Device Selector & Send Action */}
        <div className="space-y-6">
          <div className="bg-gray-900/80 backdrop-blur-md p-6 rounded-3xl border border-gray-800 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Radio className="w-5 h-5 text-cyan-400" />
                <span>Select Target Peer</span>
              </h3>
              <span className="text-xs text-gray-400 font-mono">
                {devices.filter((d) => d.isOnline).length} available
              </span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
              {devices.length === 0 ? (
                <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-700/50 text-center space-y-2">
                  <p className="text-xs text-gray-400">
                    No nearby devices auto-detected. Open FlowShare on another device and enter its Pair Code below:
                  </p>
                </div>
              ) : (
                devices.map((device) => (
                  <div
                    key={device.id}
                    onClick={() => setSelectedTargetDevice(device)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      selectedTargetDevice?.id === device.id
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                        : 'bg-gray-800/40 border-gray-700/50 hover:bg-gray-800 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-xl bg-gray-900 border border-gray-700/60">
                        {getDeviceIcon(device.type)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{device.name}</p>
                        <p className="text-xs text-gray-400">
                          {device.os} • {device.ip}
                        </p>
                      </div>
                    </div>

                    {selectedTargetDevice?.id === device.id && (
                      <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Manual Pair Code Option */}
            <div className="pt-2 border-t border-gray-800/80">
              <label className="text-[11px] font-semibold text-gray-400 block mb-1">
                Or Send to Pair Code (Vercel Serverless):
              </label>
              <input
                type="text"
                placeholder="Enter Pair Code (e.g. FLOW-8492)"
                onChange={(e) => {
                  const val = e.target.value.trim().toUpperCase();
                  if (val.length >= 4) {
                    const targetId = val.toLowerCase().startsWith('flow-')
                      ? val.toLowerCase()
                      : `flow-${val.toLowerCase().replace(/^flow-?/, '')}`;
                    const pairDevice: Device = {
                      id: targetId,
                      name: `Pair Device (${val})`,
                      type: 'Desktop',
                      os: 'Windows',
                      ip: 'Serverless P2P Cloud',
                      signalStrength: 100,
                      connectionQuality: 'Excellent',
                      latency: 5,
                      isOnline: true,
                    };
                    setSelectedTargetDevice(pairDevice);
                  }
                }}
                className="w-full bg-gray-800 text-white px-3 py-2 rounded-xl text-xs border border-gray-700 font-mono focus:outline-none uppercase"
              />
            </div>

            {/* Security Note */}
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-400 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>AES-256-GCM peer encryption ready</span>
            </div>

            {/* Send Trigger Button */}
            <button
              disabled={selectedFiles.length === 0 || !selectedTargetDevice || isSending}
              onClick={handleSend}
              className="w-full flex items-center justify-center space-x-2 py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-extrabold text-base shadow-xl shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5"
            >
              <Send className="w-5 h-5" />
              <span>
                {isSending
                  ? 'Initiating Session...'
                  : `Send ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
