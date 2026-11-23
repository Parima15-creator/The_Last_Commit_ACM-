import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  Calendar,
  CreditCard,
  Users,
  CheckCircle2,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { formatRupees } from '../utils/formatCurrency.js';
import { EmptyState } from '../components/EmptyState.jsx';

export function HistoryPage() {
  const { payments, bills, contacts, user } = useApp();

  const [contactFilter, setContactFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHistory = payments.filter((p) => {
    const matchesContact =
      contactFilter === 'ALL' ||
      p.from.toLowerCase() === contactFilter.toLowerCase() ||
      p.to.toLowerCase() === contactFilter.toLowerCase();

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;

    const matchesSearch =
      p.billTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.to.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesContact && matchesStatus && matchesSearch;
  });

  const totalSettled = filteredHistory
    .filter((p) => p.status === 'completed' || p.status === 'marked_paid')
    .reduce((sum, p) => sum + p.amountRupees, 0);

  const totalPending = filteredHistory
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + p.amountRupees, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h2 className="font-serif text-3xl font-bold text-[#292929]">
          Expense History
        </h2>
        <p className="text-sm text-[#6B7280] mt-1">
          Detailed chronological audit of all settlements, payments, and splits.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl bg-white border border-[#FFE494] shadow-warm-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#009F93] uppercase tracking-wider block mb-1">
              Total Settled Payments
            </span>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-[#009F93]">
              {formatRupees(totalSettled)}
            </div>
            <span className="text-[11px] text-[#6B7280]">
              Marked as paid or completed
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#E6F7F5] text-[#009F93] flex items-center justify-center text-xl">
            ✓
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#FFE494] shadow-warm-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#FF8A1E] uppercase tracking-wider block mb-1">
              Total Pending Settlements
            </span>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-[#FF8A1E]">
              {formatRupees(totalPending)}
            </div>
            <span className="text-[11px] text-[#6B7280]">
              Awaiting collection
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#FFF5ED] text-[#FF8A1E] flex items-center justify-center text-xl">
            ⏳
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 text-[#6B7280] absolute left-4 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by restaurant or friend name..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border border-[#FFE494] text-sm text-[#292929] placeholder-[#6B7280] focus:outline-none focus:border-[#FF8A1E] shadow-warm-sm"
          />
        </div>

        {/* Contact filter */}
        <select
          value={contactFilter}
          onChange={(e) => setContactFilter(e.target.value)}
          className="px-4 py-3 rounded-2xl bg-white border border-[#FFE494] text-xs font-bold text-[#292929] shadow-warm-sm focus:outline-none focus:border-[#FF8A1E] w-full sm:w-auto"
        >
          <option value="ALL">All Contacts</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 rounded-2xl bg-white border border-[#FFE494] text-xs font-bold text-[#292929] shadow-warm-sm focus:outline-none focus:border-[#FF8A1E] w-full sm:w-auto"
        >
          <option value="ALL">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="marked_paid">Marked Paid</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* History Transactions List */}
      {payments.length === 0 ? (
        <EmptyState
          icon="📜"
          title="No history recorded yet"
          description="As you create bills and settle splits with friends, your complete transaction history will appear here."
          actionText="Create A Bill"
          actionLink="/create-bill"
        />
      ) : filteredHistory.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-[#FFE494] text-sm text-[#6B7280]">
          No expense history records match your filters.
        </div>
      ) : (
        <div className="bg-white border border-[#FFE494] rounded-3xl p-6 shadow-warm-sm space-y-3">
          {filteredHistory.map((h) => {
            const isSettled = h.status === 'completed' || h.status === 'marked_paid';

            return (
              <div
                key={h.id}
                className="p-4 rounded-2xl bg-[#FFFDF7] border border-[#FFE494]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                      isSettled ? 'bg-[#E6F7F5] text-[#009F93]' : 'bg-[#FFF9E6] text-amber-700'
                    }`}
                  >
                    {isSettled ? '✓' : '•'}
                  </div>
                  <div>
                    <span className="font-bold text-sm text-[#292929] block">
                      {h.from} paid {h.to}
                    </span>
                    <span className="text-[#6B7280] text-[11px]">
                      Bill: <strong className="text-[#292929]">{h.billTitle}</strong> &bull; {new Date(h.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <span className="font-serif text-base font-bold text-[#292929]">
                    {formatRupees(h.amountRupees)}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                      h.status === 'completed'
                        ? 'bg-[#E6F7F5] text-[#009F93]'
                        : h.status === 'marked_paid'
                        ? 'bg-[#FFF0E5] text-[#FF8A1E]'
                        : 'bg-[#FFF9E6] text-amber-700'
                    }`}
                  >
                    {h.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
