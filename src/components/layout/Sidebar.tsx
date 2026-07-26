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
  X,
} from 'lucide-react';
import { useTransferStore } from '../../stores/transferStore';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
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

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full p-4">
      <div className="space-y-6">
        {/* Brand Header & Mobile Close Button */}
        <div className="flex items-center justify-between">
          <NavLink to="/" onClick={onClose} className="flex items-center space-x-3 px-3 py-2 group">
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

          {/* Close button on mobile */}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
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
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar (lg+) */}
      <aside className="hidden lg:flex w-64 bg-gray-900/90 backdrop-blur-xl border-r border-gray-800 flex-col justify-between h-screen sticky top-0 z-30 flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer (< lg) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />

          {/* Drawer Container */}
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[80vw] bg-gray-900 border-r border-gray-800 shadow-2xl z-50 flex flex-col justify-between">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
