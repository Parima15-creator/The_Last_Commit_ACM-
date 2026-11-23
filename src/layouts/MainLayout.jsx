import React, { useState } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  FilePlus,
  Split,
  Users,
  CreditCard,
  History,
  Settings,
  Sparkles,
  Home,
  X,
  ChevronRight,
} from 'lucide-react';
import { Navbar } from './Navbar.jsx';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'My Bills', path: '/bills', icon: Receipt },
  { name: 'Create New Bill', path: '/create-bill', icon: FilePlus },
  { name: 'Split Expenses', path: '/split', icon: Split },
  { name: 'My Contacts', path: '/contacts', icon: Users },
  { name: 'Payment Requests', path: '/payments', icon: CreditCard },
  { name: 'Expense History', path: '/history', icon: History },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="relative isolate min-h-screen animated-page-gradient flex flex-col lg:flex-row">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#FFF4D9] border-r border-[#FFE494] flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 overflow-y-auto ${
          sidebarOpen ? 'translate-x-0 shadow-warm-lg' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          {/* Logo & Close Button */}
          <div className="flex items-center justify-between mb-8">
            <Link
              to="/dashboard"
              className="flex items-center gap-2.5 group"
              onClick={() => setSidebarOpen(false)}
            >
              <div className="w-10 h-10 rounded-2xl bg-[#FFD83D] flex items-center justify-center font-bold text-lg text-[#292929] shadow-warm border border-[#FFC928]">
                💸
              </div>
              <div>
                <span className="font-serif text-2xl font-bold tracking-tight text-[#292929] block">
                  Jhol<span className="text-[#FF8A1E]">Free</span>
                </span>
                <span className="text-[10px] font-semibold text-[#6B7280] tracking-wider uppercase block -mt-1">
                  No Jhol. No Confusion.
                </span>
              </div>
            </Link>

            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-[#6B7280] hover:text-[#292929] hover:bg-[#FFE494]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path + '/'));

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#FFD83D] text-[#292929] shadow-warm-sm border border-[#FFC928] font-bold'
                      : 'text-[#6B7280] hover:bg-[#FFE494]/60 hover:text-[#292929]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#FF8A1E]' : 'text-[#6B7280]'}`} />
                    <span>{item.name}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-[#292929]" />}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Landing Page Link */}
        <div className="p-6 border-t border-[#FFE494]/80">
          <Link
            to="/"
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/70 hover:bg-white text-xs font-semibold text-[#292929] transition-colors border border-[#FFE494]"
          >
            <Home className="w-4 h-4 text-[#FF8A1E]" />
            <span>Visit Landing Page</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0">
        <Navbar onToggleSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
