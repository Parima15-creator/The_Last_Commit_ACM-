import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Receipt,
  FilePlus,
  Split,
  Trash2,
  Calendar,
  Users,
  Search,
  ExternalLink,
  Eye,
  X,
  CreditCard,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../services/api.js';
import { formatRupees } from '../utils/formatCurrency.js';
import { EmptyState } from '../components/EmptyState.jsx';

export function BillsPage() {
  const { bills, refreshBills, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [inspectBill, setInspectBill] = useState(null);

  const filteredBills = bills.filter((b) => {
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.participants || []).some((p) => p.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDeleteBill = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete bill "${title}"?`)) return;
    try {
      await api.deleteBill(id);
      await refreshBills();
      showToast(`Bill "${title}" deleted.`);
    } catch (err) {
      showToast(err.message || 'Failed to delete bill', 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold text-[#292929]">
            My Bills
          </h2>
          <p className="text-sm text-[#6B7280] mt-1">
            Manage your past and active restaurant bills, view splits, or delete records.
          </p>
        </div>

        <Link
          to="/create-bill"
          className="px-6 py-3 rounded-full bg-[#FFD83D] hover:bg-[#FFC928] text-[#292929] font-bold text-sm shadow-warm-sm transition-all border border-[#FFC928] active:scale-95 cursor-pointer flex items-center gap-2 self-start sm:self-auto"
        >
          <FilePlus className="w-4 h-4 text-[#FF8A1E]" />
          <span>Create New Bill</span>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 text-[#6B7280] absolute left-4 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by restaurant name or participant..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border border-[#FFE494] text-sm text-[#292929] placeholder-[#6B7280] focus:outline-none focus:border-[#FF8A1E] shadow-warm-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#FFF4D9] border border-[#FFE494] shrink-0">
          {['ALL', 'pending', 'settled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer capitalize ${
                statusFilter === st
                  ? 'bg-[#FFD83D] text-[#292929] shadow-warm-sm border border-[#FFC928]'
                  : 'text-[#6B7280] hover:text-[#292929]'
              }`}
            >
              {st === 'ALL' ? 'All' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Bills List */}
      {bills.length === 0 ? (
        <EmptyState
          icon="🧾"
          title="No bills created yet"
          description="Snap a restaurant receipt or type items manually to split with your group."
          actionText="Create First Bill"
          actionLink="/create-bill"
        />
      ) : filteredBills.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-[#FFE494] text-sm text-[#6B7280]">
          No bills match your search criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBills.map((b) => (
            <div
              key={b.id}
              className="p-6 rounded-3xl bg-white border border-[#FFE494] shadow-warm-sm hover:shadow-warm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#FFF4D9] text-[#FF8A1E] flex items-center justify-center text-xl shrink-0 border border-[#FFE494]">
                  🍲
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-serif text-xl font-bold text-[#292929]">
                      {b.title}
                    </h3>
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                        b.status === 'settled'
                          ? 'bg-[#E6F7F5] text-[#009F93]'
                          : 'bg-[#FFF9E6] text-amber-700'
                      }`}
                    >
                      {b.status}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#FFFDF0] text-[#6B7280] border border-[#FFE494]">
                      {b.splitMode || 'equal'} split
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#6B7280] mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {b.date}
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {(b.participants || []).join(', ')}
                    </span>
                    <span>&bull;</span>
                    <span>Paid initially by <strong>{b.paidBy}</strong></span>
                  </div>
                </div>
              </div>

              {/* Amount & Actions */}
              <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-[#FFE494]/60">
                <div className="text-left md:text-right">
                  <span className="text-xs text-[#6B7280] block">Total Amount</span>
                  <span className="font-serif text-2xl font-bold text-[#292929]">
                    {formatRupees(b.calculatedTotal || b.printedTotal)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setInspectBill(b)}
                    className="p-2.5 rounded-xl bg-[#FFFDF7] hover:bg-[#FFF4D9] text-[#6B7280] hover:text-[#292929] border border-[#FFE494] transition-colors cursor-pointer"
                    title="Inspect Items & Receipt"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <Link
                    to={`/split/${b.id}`}
                    className="px-4 py-2 rounded-xl bg-[#FFD83D] hover:bg-[#FFC928] text-xs font-bold text-[#292929] border border-[#FFC928] shadow-warm-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Split className="w-3.5 h-3.5 text-[#FF8A1E]" />
                    <span>Split Bill</span>
                  </Link>

                  <button
                    onClick={() => handleDeleteBill(b.id, b.title)}
                    className="p-2.5 rounded-xl text-[#6B7280] hover:text-red-500 hover:bg-[#FFF0E5] transition-colors cursor-pointer"
                    title="Delete Bill"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bill Inspector Modal */}
      {inspectBill && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#FFE494] rounded-3xl max-w-lg w-full p-6 shadow-warm-lg space-y-4 max-h-[85vh] overflow-y-auto animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-[#FFE494]">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#292929]">
                  {inspectBill.title}
                </h3>
                <span className="text-xs text-[#6B7280]">
                  {inspectBill.date} &bull; Paid by {inspectBill.paidBy}
                </span>
              </div>
              <button
                onClick={() => setInspectBill(null)}
                className="p-1 rounded-lg text-[#6B7280] hover:text-[#292929] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Line items list */}
            <div>
              <h4 className="text-xs font-bold text-[#292929] uppercase tracking-wider mb-2">
                Dishes / Line Items ({inspectBill.items?.length || 0})
              </h4>
              <div className="space-y-1.5">
                {(inspectBill.items || []).map((it, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-[#FFFDF7] border border-[#FFE494] flex justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-[#292929]">{it.name}</span>
                      {it.qty > 1 && <span className="text-[#6B7280] ml-1">×{it.qty}</span>}
                    </div>
                    <span className="font-semibold text-[#292929]">
                      {formatRupees(it.price * (it.qty || 1))}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Receipt Image if available */}
            {inspectBill.receiptImage && (
              <div>
                <h4 className="text-xs font-bold text-[#292929] uppercase tracking-wider mb-2">
                  Uploaded Receipt
                </h4>
                <div className="rounded-2xl overflow-hidden border border-[#FFE494] max-h-60 bg-[#FFFDF7] flex items-center justify-center">
                  <img
                    src={inspectBill.receiptImage}
                    alt="Receipt"
                    className="max-h-60 object-contain w-full"
                  />
                </div>
              </div>
            )}

            {/* Financial breakdown */}
            <div className="p-4 rounded-2xl bg-[#FFFDF0] border border-[#FFE494] space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">CGST:</span>
                <span>{formatRupees(inspectBill.cgst)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">SGST:</span>
                <span>{formatRupees(inspectBill.sgst)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Service Charge:</span>
                <span>{formatRupees(inspectBill.serviceCharge)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-2 border-t border-[#FFE494]">
                <span>Total:</span>
                <span>{formatRupees(inspectBill.calculatedTotal)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Link
                to={`/split/${inspectBill.id}`}
                onClick={() => setInspectBill(null)}
                className="px-6 py-2.5 rounded-full bg-[#009F93] hover:bg-[#00847A] text-white font-bold text-xs shadow-teal"
              >
                Go to Split Page &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
