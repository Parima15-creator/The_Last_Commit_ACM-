import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  AtSign,
  Phone,
  Mail,
  Zap,
  ShieldCheck,
  Check,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../services/api.js';

export function SettingsPage() {
  const { user, setUser, aiHealth, refreshAiHealth, refreshSettings, showToast } = useApp();

  const [name, setName] = useState(user.name || 'Me');
  const [upiId, setUpiId] = useState(user.upiId || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [email, setEmail] = useState(user.email || '');
  const [currency, setCurrency] = useState(user.currency || '₹');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || 'Me');
      setUpiId(user.upiId || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
      setCurrency(user.currency || '₹');
    }
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await api.updateSettings({
        name: name.trim(),
        upiId: upiId.trim(),
        phone: phone.trim(),
        email: email.trim(),
        currency: currency.trim(),
      });
      setUser(updated);
      showToast('Settings saved successfully!');
    } catch (err) {
      showToast(err.message || 'Failed to update settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h2 className="font-serif text-3xl font-bold text-[#292929]">
          Settings & Preferences
        </h2>
        <p className="text-sm text-[#6B7280] mt-1">
          Customize your profile, default UPI payment ID, and review Groq backend proxy status.
        </p>
      </div>

      {/* Section 1: User Profile & UPI */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-white border border-[#FFE494] rounded-3xl p-6 sm:p-8 shadow-warm-sm space-y-6"
      >
        <h3 className="font-serif text-xl font-bold text-[#292929] flex items-center gap-2">
          <User className="w-5 h-5 text-[#FF8A1E]" />
          <span>Your Profile & Payment Defaults</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#292929] uppercase tracking-wider mb-2">
              Your Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Parima Tendulkar"
              className="w-full px-4 py-2.5 rounded-2xl bg-[#FFFDF7] border border-[#FFE494] text-sm text-[#292929] focus:outline-none focus:border-[#FF8A1E] font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#292929] uppercase tracking-wider mb-2">
              Default UPI ID
            </label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="e.g. yourname@okaxis"
              className="w-full px-4 py-2.5 rounded-2xl bg-[#FFFDF7] border border-[#FFE494] text-sm text-[#292929] font-mono focus:outline-none focus:border-[#FF8A1E]"
            />
            <span className="text-[11px] text-[#6B7280] mt-1 block">
              Default recipient ID when you pay bills and collect from friends.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#292929] uppercase tracking-wider mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="w-full px-4 py-2.5 rounded-2xl bg-[#FFFDF7] border border-[#FFE494] text-sm text-[#292929] focus:outline-none focus:border-[#FF8A1E]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#292929] uppercase tracking-wider mb-2">
              Currency Symbol
            </label>
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-[#FFFDF7] border border-[#FFE494] text-sm text-[#292929] font-bold focus:outline-none focus:border-[#FF8A1E]"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-full bg-[#009F93] hover:bg-[#00847A] text-white font-bold text-xs shadow-teal transition-all active:scale-95 cursor-pointer"
          >
            {isSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
