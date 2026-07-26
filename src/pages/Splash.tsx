import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Share2, Zap, ShieldCheck, Wifi, ArrowRight, HardDrive } from 'lucide-react';

export const Splash: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col justify-between p-6 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="flex items-center justify-between max-w-6xl w-full mx-auto z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/40">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">FlowShare</span>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gray-900/80 hover:bg-gray-800 border border-gray-800 text-sm font-semibold transition-all"
        >
          <span>Open Dashboard</span>
          <ArrowRight className="w-4 h-4 text-indigo-400" />
        </button>
      </header>

      {/* Hero Body */}
      <main className="max-w-4xl w-full mx-auto text-center space-y-8 z-10 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>Zero Cloud • Direct Wi-Fi P2P File Sharing</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-white"
        >
          Blazing Fast LAN Transfers. <br />
          <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            No Limits. Fully Encrypted.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg text-gray-400 max-w-2xl mx-auto font-normal leading-relaxed"
        >
          Share gigabytes of raw video, code archives, or entire directories instantly across Windows, macOS, Android, and iOS devices on your local network.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4 pt-4"
        >
          <button
            onClick={() => navigate('/send')}
            className="flex items-center space-x-3 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base shadow-xl shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5"
          >
            <span>Send Files Now</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/nearby')}
            className="flex items-center space-x-3 px-8 py-4 rounded-2xl bg-gray-900/80 hover:bg-gray-800 text-gray-200 border border-gray-700 font-bold text-base transition-all"
          >
            <Wifi className="w-5 h-5 text-cyan-400" />
            <span>Discover Nearby Peers</span>
          </button>
        </motion.div>

        {/* Feature Highlights Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 text-left"
        >
          <div className="bg-gray-900/60 border border-gray-800/80 p-6 rounded-2xl space-y-3 backdrop-blur-md">
            <div className="p-3 w-fit rounded-xl bg-indigo-600/20 text-indigo-400">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Multi-Gigabit Speeds</h3>
            <p className="text-xs text-gray-400">
              Direct WebRTC DataChannel transfer up to 100+ MB/s depending on your local Wi-Fi 6 router bandwidth.
            </p>
          </div>

          <div className="bg-gray-900/60 border border-gray-800/80 p-6 rounded-2xl space-y-3 backdrop-blur-md">
            <div className="p-3 w-fit rounded-xl bg-emerald-600/20 text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">End-to-End Encryption</h3>
            <p className="text-xs text-gray-400">
              ECDH key agreement & AES-256-GCM chunk security. Files never leave your local network or touch servers.
            </p>
          </div>

          <div className="bg-gray-900/60 border border-gray-800/80 p-6 rounded-2xl space-y-3 backdrop-blur-md">
            <div className="p-3 w-fit rounded-xl bg-cyan-600/20 text-cyan-400">
              <HardDrive className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Unlimited File Size</h3>
            <p className="text-xs text-gray-400">
              Transfer multi-gigabyte ISOs, 4K video footage, or entire directory trees with automatic chunk streaming and resume.
            </p>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto text-center text-xs text-gray-500 z-10 pt-6">
        FlowShare P2P Protocol • Production Ready Zero-Cloud Architecture
      </footer>
    </div>
  );
};
