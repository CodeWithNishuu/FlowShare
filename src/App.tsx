import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Splash } from './pages/Splash';
import { Dashboard } from './pages/Dashboard';
import { NearbyDevices } from './pages/NearbyDevices';
import { SendFiles } from './pages/SendFiles';
import { ReceiveFiles } from './pages/ReceiveFiles';
import { TransferScreen } from './pages/TransferScreen';
import { TransferHistory } from './pages/TransferHistory';
import { Settings } from './pages/Settings';
import { DeviceDetails } from './pages/DeviceDetails';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Splash Screen */}
        <Route path="/" element={<Splash />} />

        {/* Main App Layout */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/nearby" element={<NearbyDevices />} />
          <Route path="/send" element={<SendFiles />} />
          <Route path="/receive" element={<ReceiveFiles />} />
          <Route path="/transfer" element={<TransferScreen />} />
          <Route path="/history" element={<TransferHistory />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/device/:id" element={<DeviceDetails />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
