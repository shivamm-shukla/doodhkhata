import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { DataProvider } from './context/DataContext';
import { BottomNav } from './components/BottomNav';
import { Toast } from './components/Toast';

// Screens
import { LanguageSelect } from './screens/LanguageSelect';
import { Home } from './screens/Home';
import { CustomersList } from './screens/CustomersList';
import { CustomerDetail } from './screens/CustomerDetail';
import { SuppliersList } from './screens/SuppliersList';
import { SupplierDetail } from './screens/SupplierDetail';
import { BatchEntry } from './screens/BatchEntry';
import { Settings } from './screens/Settings';

function AppRoutes() {
  const { state } = useApp();

  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-green-700 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🥛</span>
          </div>
          <p className="text-white text-xl font-bold">DoodhKhata</p>
        </div>
      </div>
    );
  }

  if (!state.hasCompletedSetup) {
    return <LanguageSelect />;
  }

  return (
    <div className="max-w-lg mx-auto relative">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/customers" element={<CustomersList />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/suppliers" element={<SuppliersList />} />
        <Route path="/suppliers/:id" element={<SupplierDetail />} />
        <Route path="/batch-entry" element={<BatchEntry />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppProvider>
        <DataProvider>
          <AppRoutes />
        </DataProvider>
      </AppProvider>
    </HashRouter>
  );
}
