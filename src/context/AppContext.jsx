import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState({
    name: 'Me',
    upiId: 'you.jholfree@okaxis',
    currency: '₹',
  });
  const [bills, setBills] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({
    totalExpenses: 0,
    billsCount: 0,
    amountOthersOweUser: 0,
    amountUserOwesOthers: 0,
    recentBills: [],
    recentPayments: [],
  });
  const [aiHealth, setAiHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  }, []);

  const refreshDashboard = useCallback(async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
      if (data.user) setUser(data.user);
    } catch (err) {
      console.warn('Dashboard fetch error:', err.message);
    }
  }, []);

  const refreshBills = useCallback(async () => {
    try {
      const data = await api.getBills();
      setBills(data);
    } catch (err) {
      console.warn('Bills fetch error:', err.message);
    }
  }, []);

  const refreshContacts = useCallback(async () => {
    try {
      const data = await api.getContacts();
      setContacts(data);
    } catch (err) {
      console.warn('Contacts fetch error:', err.message);
    }
  }, []);

  const refreshPayments = useCallback(async () => {
    try {
      const data = await api.getPayments();
      setPayments(data);
    } catch (err) {
      console.warn('Payments fetch error:', err.message);
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const data = await api.getSettings();
      setUser(data);
    } catch (err) {
      console.warn('Settings fetch error:', err.message);
    }
  }, []);

  const refreshAiHealth = useCallback(async () => {
    try {
      const data = await api.getAiHealth();
      setAiHealth(data);
    } catch (err) {
      console.warn('AI Health fetch error:', err.message);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.allSettled([
      refreshDashboard(),
      refreshBills(),
      refreshContacts(),
      refreshPayments(),
      refreshSettings(),
      refreshAiHealth(),
    ]);
    setLoading(false);
  }, [refreshDashboard, refreshBills, refreshContacts, refreshPayments, refreshSettings, refreshAiHealth]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        bills,
        contacts,
        payments,
        stats,
        aiHealth,
        loading,
        toast,
        showToast,
        refreshAll,
        refreshDashboard,
        refreshBills,
        refreshContacts,
        refreshPayments,
        refreshSettings,
        refreshAiHealth,
      }}
    >
      {children}
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
          <div
            className={`px-5 py-3 rounded-2xl shadow-warm-lg text-sm font-semibold flex items-center gap-2.5 border ${
              toast.type === 'error'
                ? 'bg-[#FFF0E5] text-red-600 border-red-200'
                : toast.type === 'warning'
                ? 'bg-[#FFF9E6] text-amber-700 border-amber-200'
                : 'bg-[#FFD83D] text-[#292929] border-[#FFC928]'
            }`}
          >
            <span>{toast.type === 'error' ? '⚠️' : toast.type === 'warning' ? '⚡' : '✨'}</span>
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-xs opacity-60 hover:opacity-100 cursor-pointer font-bold"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
