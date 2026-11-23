import React from 'react';
import { Menu, Plus, Zap, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

const ROUTE_TITLES = {
  '/dashboard': 'Dashboard',
  '/bills': 'My Bills',
  '/create-bill': 'Create New Bill',
  '/split': 'Split Expenses',
  '/contacts': 'My Contacts',
  '/payments': 'Payment Requests',
  '/history': 'Expense History',
  '/settings': 'Settings',
};

export function Navbar({ onToggleSidebar }) {
  const location = useLocation();
  const { user, aiHealth } = useApp();

  const title = ROUTE_TITLES[location.pathname] || 'JholFree';

  return (
    <header className="h-18 bg-white/80 backdrop-blur-md border-b border-[#FFE494]/60 sticky top-0 z-20 px-4 sm:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl bg-[#FFF4D9] hover:bg-[#FFD83D] text-[#292929] transition-colors cursor-pointer"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#292929]">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Groq AI Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF0E5] border border-[#FF8A1E]/30 text-xs font-semibold text-[#FF8A1E]">
          <Zap className="w-3.5 h-3.5 fill-[#FF8A1E]" />
          <span>{aiHealth?.hasGroqKey ? 'Groq Vision Ready' : 'AI Offline (Manual Mode)'}</span>
        </div>

        {/* Quick New Bill Button */}
        {location.pathname !== '/create-bill' && (
          <Link
            to="/create-bill"
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FFD83D] hover:bg-[#FFC928] text-[#292929] font-bold text-xs shadow-warm-sm transition-all active:scale-95 cursor-pointer border border-[#FFC928]"
          >
            <Plus className="w-4 h-4" />
            <span>New Bill</span>
          </Link>
        )}

        {/* User Pill */}
        <Link
          to="/settings"
          className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-[#FFF4D9] hover:bg-[#FFE494] transition-colors border border-[#FFE494]"
        >
          <div className="w-7 h-7 rounded-full bg-[#FF8A1E] text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
            {(user.name || 'M').charAt(0)}
          </div>
          <span className="text-xs font-semibold text-[#292929] hidden sm:inline max-w-[90px] truncate">
            {user.name || 'Me'}
          </span>
        </Link>
      </div>
    </header>
  );
}
