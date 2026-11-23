import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FilePlus,
  Split,
  UserPlus,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { formatRupees } from '../utils/formatCurrency.js';
import { EmptyState } from '../components/EmptyState.jsx';

export function DashboardPage() {
  const { stats, bills, payments, user, refreshDashboard } = useApp();

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  const hasBills = bills && bills.length > 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-[#FFFDF0] border border-[#FFE494] rounded-3xl p-6 sm:p-8 shadow-warm-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-[#FF8A1E] uppercase tracking-wider block mb-1 font-mono">
            Welcome Back
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#292929]">
            Hey, {user.name || 'Friend'}! 👋
          </h2>
          <p className="text-sm text-[#6B7280] mt-1 max-w-md">
            Here's a live summary of your restaurant expenses, active splits, and pending collections.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            to="/create-bill"
            className="px-5 py-2.5 rounded-full bg-[#FFD83D] hover:bg-[#FFC928] text-[#292929] font-bold text-xs shadow-warm-sm transition-all border border-[#FFC928] active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <FilePlus className="w-4 h-4 text-[#FF8A1E]" />
            <span>Create Bill</span>
          </Link>
          <Link
            to="/contacts"
            className="px-5 py-2.5 rounded-full bg-white hover:bg-[#FFF4D9] text-[#292929] font-semibold text-xs border border-[#FFE494] shadow-warm-sm transition-all active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4 text-[#009F93]" />
            <span>Add Friend</span>
          </Link>
        </div>
      </div>

      {/* 4 Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Expenses */}
        <div className="p-6 rounded-3xl bg-white border border-[#FFE494]/80 shadow-warm-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
              Total Recorded
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#FFF4D9] flex items-center justify-center text-sm border border-[#FFE494]">
              💸
            </div>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-[#292929]">
            {formatRupees(stats.totalExpenses)}
          </div>
          <p className="text-[11px] text-[#6B7280] mt-1">
            Across {stats.billsCount} bill{stats.billsCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Metric 2: Bills Created */}
        <div className="p-6 rounded-3xl bg-white border border-[#FFE494]/80 shadow-warm-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
              Bills Created
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#FFF5ED] flex items-center justify-center text-sm border border-[#FF8A1E]/20">
              🧾
            </div>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-[#292929]">
            {stats.billsCount}
          </div>
          <p className="text-[11px] text-[#6B7280] mt-1">
            {stats.billsCount === 0 ? 'No bills yet' : 'Managed in JholFree'}
          </p>
        </div>

        {/* Metric 3: Amount Others Owe You */}
        <div className="p-6 rounded-3xl bg-[#FFFDF0] border border-[#FFC928]/80 shadow-warm-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#009F93] uppercase tracking-wider">
              You Are Owed
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#E6F7F5] flex items-center justify-center text-[#009F93] border border-[#009F93]/20">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-[#009F93]">
            {formatRupees(stats.amountOthersOweUser)}
          </div>
          <p className="text-[11px] text-[#6B7280] mt-1">
            Pending payments to collect
          </p>
        </div>

        {/* Metric 4: Amount You Owe Others */}
        <div className="p-6 rounded-3xl bg-[#FFF5ED] border border-[#FF8A1E]/30 shadow-warm-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#FF8A1E] uppercase tracking-wider">
              You Owe
            </span>
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[#FF8A1E] border border-[#FF8A1E]/20">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-[#FF8A1E]">
            {formatRupees(stats.amountUserOwesOthers)}
          </div>
          <p className="text-[11px] text-[#6B7280] mt-1">
            Pending to pay friends
          </p>
        </div>
      </div>

      {/* Main Content: Recent Bills & Pending Requests */}
      {!hasBills ? (
        <EmptyState
          icon="🧾"
          title="No bills yet. Create your first bill and start splitting!"
          description="Upload a restaurant receipt with Groq AI or type dishes in manually. No math jhol, no confusion."
          actionText="Create Your First Bill"
          actionLink="/create-bill"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Bills Column */}
          <div className="bg-white border border-[#FFE494]/80 rounded-3xl p-6 shadow-warm-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#FF8A1E]" />
                <h3 className="font-serif text-lg font-bold text-[#292929]">
                  Recent Bills
                </h3>
              </div>
              <Link
                to="/bills"
                className="text-xs font-bold text-[#009F93] hover:underline flex items-center gap-1"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {stats.recentBills.map((bill) => (
                <div
                  key={bill.id}
                  className="p-4 rounded-2xl bg-[#FFFDF7] border border-[#FFE494]/60 hover:border-[#FFD83D] transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#FFF4D9] flex items-center justify-center text-sm font-bold text-[#292929] shrink-0 border border-[#FFE494]">
                      🍲
                    </div>
                    <div className="truncate">
                      <h4 className="font-bold text-sm text-[#292929] truncate">
                        {bill.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-[#6B7280] mt-0.5">
                        <span>{bill.date}</span>
                        <span>&bull;</span>
                        <span className="capitalize">{bill.splitMode || 'equal'} split</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-bold text-sm text-[#292929] block">
                      {formatRupees(bill.calculatedTotal)}
                    </span>
                    <Link
                      to={`/split/${bill.id}`}
                      className="text-[11px] font-bold text-[#FF8A1E] hover:underline"
                    >
                      Split &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Payment Requests Column */}
          <div className="bg-white border border-[#FFE494]/80 rounded-3xl p-6 shadow-warm-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#009F93]" />
                <h3 className="font-serif text-lg font-bold text-[#292929]">
                  Payment Requests
                </h3>
              </div>
              <Link
                to="/payments"
                className="text-xs font-bold text-[#009F93] hover:underline flex items-center gap-1"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {stats.recentPayments.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#FFFDF7] border border-dashed border-[#FFE494] text-xs text-[#6B7280]">
                No pending payment requests right now. All accounts settled!
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentPayments.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-[#FFFDF7] border border-[#FFE494]/60 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-[#292929] text-sm">
                        <span>{p.from}</span>
                        <span className="text-[#6B7280] font-normal">&rarr;</span>
                        <span className="text-[#009F93]">{p.to}</span>
                      </div>
                      <span className="text-[#6B7280] text-[11px]">
                        For {p.billTitle}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-sm text-[#292929] block">
                        {formatRupees(p.amountRupees)}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                          p.status === 'completed'
                            ? 'bg-[#E6F7F5] text-[#009F93]'
                            : p.status === 'marked_paid'
                            ? 'bg-[#FFF0E5] text-[#FF8A1E]'
                            : 'bg-[#FFF9E6] text-amber-700'
                        }`}
                      >
                        {p.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
