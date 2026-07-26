import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Radio,
  Send,
  Download,
  ArrowRightLeft,
  History,
  Settings,
  Share2,
  ShieldAlert,
} from 'lucide-react';
import { useTransferStore } from '../../stores/transferStore';

export const Sidebar: React.FC = () => {
  const { activeSession } = useTransferStore();
  const isTransferActive = activeSession && activeSession.status === 'transferring';

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Nearby Devices', path: '/nearby', icon: Radio },
    { label: 'Send Files', path: '/send', icon: Send },
    { label: 'Receive Files', path: '/receive', icon: Download },
    {
      label: 'Transfer Screen',
      path: '/transfer',
      icon: ArrowRightLeft,
      badge: isTransferActive ? 'Active' : undefined,
    },
    { label: 'Transfer History', path: '/history', icon: History },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-gray-900/90 backdrop-blur-xl border-r border-gray-800 flex flex-col justify-between p-4 h-screen sticky top-0 z-30">
      <div className="space-y-6">
        {/* Brand Header */}
        <NavLink to="/" className="flex items-center space-x-3 px-3 py-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Flow<span className="text-cyan-400">Share</span>
            </h1>
            <p className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">P2P File Transfer</p>
          </div>
        </NavLink>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-md shadow-indigo-500/10'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                  }`
                }
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="bg-gray-800/40 rounded-2xl p-3 border border-gray-700/40 text-xs space-y-2">
        <div className="flex items-center justify-between text-gray-300">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold">Local LAN Mode</span>
          </span>
          <span className="text-gray-400">v1.0.0</span>
        </div>
        <div className="flex items-center space-x-1 text-[11px] text-gray-400">
          <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
          <span>AES-256 Encrypted</span>
        </div>
      </div>
    </aside>
  );
};
