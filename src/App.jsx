import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext.jsx';

import { MainLayout } from './layouts/MainLayout.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { AuthPage } from './pages/AuthPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { BillsPage } from './pages/BillsPage.jsx';
import { CreateBillPage } from './pages/CreateBillPage.jsx';
import { SplitPage } from './pages/SplitPage.jsx';
import { ContactsPage } from './pages/ContactsPage.jsx';
import { PaymentsPage } from './pages/PaymentsPage.jsx';
import { HistoryPage } from './pages/HistoryPage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />

          {/* App Sections inside MainLayout */}
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/bills" element={<BillsPage />} />
            <Route path="/create-bill" element={<CreateBillPage />} />
            <Route path="/split" element={<SplitPage />} />
            <Route path="/split/:billId" element={<SplitPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
