import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { IncomingTransferModal } from '../notifications/IncomingTransferModal';
import { useNearbyDevices } from '../../hooks/useNearbyDevices';
import { useTransfer } from '../../hooks/useTransfer';

export const Layout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Initialize global discovery and signaling socket
  useNearbyDevices();
  useTransfer();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex overflow-x-hidden">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Peer Approval Modal */}
      <IncomingTransferModal />
    </div>
  );
};
