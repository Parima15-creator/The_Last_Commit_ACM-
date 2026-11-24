import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Split,
  Users,
  CheckCircle2,
  Check,
  AlertCircle,
  CreditCard,
  Send,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Info,
  DollarSign,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../services/api.js';
import { formatRupees } from '../utils/formatCurrency.js';
import { EmptyState } from '../components/EmptyState.jsx';

export function SplitPage() {
  const { billId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { bills, contacts, user, refreshBills, refreshPayments, showToast } = useApp();

  const [selectedBillId, setSelectedBillId] = useState(billId || '');
  const [bill, setBill] = useState(location.state?.bill || null);
  const [splitMode, setSplitMode] = useState('equal'); // 'equal' | 'item'
  const [participants, setParticipants] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Auto-select latest bill if none selected
  useEffect(() => {
    if (!selectedBillId && bills.length > 0) {
      setSelectedBillId(bills[0].id);
    }
  }, [selectedBillId, bills]);

  // Load selected bill
  useEffect(() => {
    if (!selectedBillId) return;
    const fetchBill = async () => {
      setLoading(true);
      try {
        const data = await api.getBill(selectedBillId);
        setBill(data);
        setSplitMode(data.splitMode || 'equal');
        setParticipants(data.participants?.length > 0 ? data.participants : [user.name || 'Me']);
        setItems(data.items || []);
      } catch (err) {
        console.error('Fetch bill error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBill();
  }, [selectedBillId, user.name]);

  // Calculations for preview
  const totalBillRupees = parseFloat(bill?.calculatedTotal || bill?.printedTotal || 0);

  // Mode 1: Equal Split calculations
  const participantCount = participants.length || 1;
  const equalPerPerson = totalBillRupees / participantCount;

  // Mode 2: Item-Based Split calculations
  const computeItemShares = () => {
    if (!bill || participants.length === 0) return {};

    const shares = {};
    participants.forEach((p) => {
      shares[p] = {
        name: p,
        assignedItems: [],
        foodSubtotal: 0,
        taxShare: 0,
        serviceShare: 0,
        discountShare: 0,
        finalTotal: 0,
      };
    });

    let totalAssignedFood = 0;

    // Distribute items (item.price is the total line price for that item)
    items.forEach((item) => {
      const assigned = (item.assignedTo || []).filter((p) => participants.includes(p));
      const itemPrice = parseFloat(item.price) || 0;
      if (assigned.length > 0) {
        const splitAmount = itemPrice / assigned.length;
        assigned.forEach((p) => {
          shares[p].foodSubtotal += splitAmount;
          shares[p].assignedItems.push({
            name: item.name,
            qty: item.qty || 1,
            amount: splitAmount,
            sharersCount: assigned.length,
          });
        });
        totalAssignedFood += itemPrice;
      }
    });

    // Extras
    const totalTax = (parseFloat(bill.cgst) || 0) + (parseFloat(bill.sgst) || 0);
    const serviceCharge = parseFloat(bill.serviceCharge) || 0;
    const discount = parseFloat(bill.discount) || 0;
    const roundOff = parseFloat(bill.roundOff) || 0;

    participants.forEach((p) => {
      const foodRatio = totalAssignedFood > 0 ? shares[p].foodSubtotal / totalAssignedFood : 1 / participantCount;
      shares[p].taxShare = totalTax * foodRatio;
      shares[p].serviceShare = serviceCharge * foodRatio;
      shares[p].discountShare = discount * foodRatio;
      shares[p].finalTotal = shares[p].foodSubtotal + shares[p].taxShare + shares[p].serviceShare - shares[p].discountShare + (roundOff * foodRatio);
    });

    return shares;
  };

  const itemShares = computeItemShares();

  // Item assignment toggle
  const toggleItemAssignment = (itemId, personName) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          const current = item.assignedTo || [];
          const updated = current.includes(personName)
            ? current.filter((p) => p !== personName)
            : [...current, personName];
          return { ...item, assignedTo: updated };
        }
        return item;
      })
    );
  };

  // Participant toggle
  const toggleParticipant = (personName) => {
    if (participants.includes(personName)) {
      if (participants.length > 1) {
        setParticipants(participants.filter((p) => p !== personName));
      }
    } else {
      setParticipants([...participants, personName]);
    }
  };

  // Finalize Split & Redirect to Payments
  const handleFinalizeSplit = async () => {
    if (!bill) return;

    setIsFinalizing(true);
    try {
      await api.splitBill(bill.id, {
        splitMode,
        participants,
        items,
      });

      showToast('Split calculated and payment requests generated!');
      navigate('/payments');
      void Promise.allSettled([refreshBills(), refreshPayments()]);
    } catch (err) {
      console.error('Finalize split error:', err);
      showToast(err.message || 'Failed to finalize split', 'error');
    } finally {
      setIsFinalizing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto pb-12">
        <div className="bg-white border border-[#FFE494] rounded-3xl p-8 text-center text-sm font-semibold text-[#6B7280] shadow-warm-sm">
          Loading bill and split options...
        </div>
      </div>
    );
  }

  if ((!bills || bills.length === 0) && !bill) {
    return (
      <EmptyState
        icon="🍕"
        title="No bills available to split"
        description="Create your first bill to choose between Equal Split and Item-Based Split."
        actionText="Create A Bill"
        actionLink="/create-bill"
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Top Selector & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold text-[#292929]">
            Split Expenses
          </h2>
          <p className="text-sm text-[#6B7280] mt-1">
            Choose how to divide the bill: Equal Split or Item-Based Split.
          </p>
        </div>

        {/* Bill dropdown selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
            Active Bill:
          </label>
          <select
            value={selectedBillId}
            onChange={(e) => {
              const nextBillId = e.target.value;
              setSelectedBillId(nextBillId);
              navigate(`/split/${nextBillId}`, { replace: true });
            }}
            className="px-4 py-2 rounded-2xl bg-white border border-[#FFE494] text-xs font-bold text-[#292929] shadow-warm-sm focus:outline-none focus:border-[#FF8A1E]"
          >
            {bills.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title} ({formatRupees(b.calculatedTotal)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {bill && (
        <>
          {/* Bill Overview Banner */}
          <div className="p-6 rounded-3xl bg-[#FFFDF0] border border-[#FFE494] shadow-warm-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-[#FF8A1E] uppercase tracking-wider block font-mono">
                {bill.date} &bull; Paid initially by {bill.paidBy}
              </span>
              <h3 className="font-serif text-2xl font-bold text-[#292929]">
                {bill.title}
              </h3>
            </div>
            <div className="text-left md:text-right">
              <span className="text-xs font-semibold text-[#6B7280] block">
                Total Bill Amount
              </span>
              <span className="font-serif text-3xl font-bold text-[#292929]">
                {formatRupees(totalBillRupees)}
              </span>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center justify-center p-1.5 rounded-full bg-[#FFF4D9] border border-[#FFE494] max-w-md mx-auto shadow-warm-sm">
            <button
              onClick={() => setSplitMode('equal')}
              className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                splitMode === 'equal'
                  ? 'bg-[#FFD83D] text-[#292929] shadow-warm-sm border border-[#FFC928]'
                  : 'text-[#6B7280] hover:text-[#292929]'
              }`}
            >
              Mode 1: Equal Split
            </button>
            <button
              onClick={() => setSplitMode('item')}
              className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                splitMode === 'item'
                  ? 'bg-[#FFD83D] text-[#292929] shadow-warm-sm border border-[#FFC928]'
                  : 'text-[#6B7280] hover:text-[#292929]'
              }`}
            >
              Mode 2: Item-Based Split
            </button>
          </div>

          {/* Participants Selection Bar */}
          <div className="bg-white border border-[#FFE494] rounded-3xl p-6 shadow-warm-sm space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-[#292929] uppercase tracking-wider">
                Split Participants ({participants.length})
              </span>
              <span className="text-xs text-[#6B7280]">
                Tap names to add or remove participants
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {/* User */}
              <button
                type="button"
                onClick={() => toggleParticipant(user.name || 'Me')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  participants.includes(user.name || 'Me')
                    ? 'bg-[#FFD83D] text-[#292929] border border-[#FFC928] shadow-warm-sm'
                    : 'bg-[#FFFDF7] text-[#6B7280] border border-[#FFE494]'
                }`}
              >
                {user.name || 'Me'} (You) {participants.includes(user.name || 'Me') && <Check aria-label="Selected" className="inline w-3.5 h-3.5 ml-1" strokeWidth={3} />}
              </button>

              {/* Contacts */}
              {contacts.map((c) => {
                const isSelected = participants.includes(c.name);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleParticipant(c.name)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FFD83D] text-[#292929] border border-[#FFC928] shadow-warm-sm font-bold'
                        : 'bg-[#FFFDF7] text-[#6B7280] border border-[#FFE494]'
                    }`}
                  >
                    {c.name} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* MODE 1: EQUAL SPLIT UI */}
          {splitMode === 'equal' && (
            <div className="bg-white border border-[#FFE494] rounded-3xl p-6 sm:p-8 shadow-warm-sm space-y-6 animate-fade-in">
              <div className="text-center max-w-md mx-auto py-4">
                <span className="text-xs font-bold text-[#009F93] uppercase tracking-wider block mb-1">
                  Equal Division
                </span>
                <div className="font-serif text-4xl sm:text-5xl font-bold text-[#292929] mb-2">
                  {formatRupees(equalPerPerson)}
                  <span className="text-sm font-sans font-normal text-[#6B7280] block mt-1">
                    per person
                  </span>
                </div>
                <p className="text-xs text-[#6B7280]">
                  Divided equally among {participantCount} people down to the exact paisa.
                  All taxes, service charges, and discounts are included.
                </p>
              </div>

              {/* Individual Equal Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {participants.map((person) => (
                  <div
                    key={person}
                    className="p-4 rounded-2xl bg-[#FFFDF0] border border-[#FFE494] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#FF8A1E] text-white flex items-center justify-center font-bold text-xs uppercase">
                        {person.charAt(0)}
                      </div>
                      <span className="font-bold text-sm text-[#292929]">{person}</span>
                    </div>
                    <span className="font-serif text-base font-bold text-[#009F93]">
                      {formatRupees(equalPerPerson)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODE 2: ITEM-BASED SPLIT UI (NO GRAPH - Simple, attractive cards) */}
          {splitMode === 'item' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white border border-[#FFE494] rounded-3xl p-6 sm:p-8 shadow-warm-sm space-y-4">
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#292929]">
                    Assign Dishes to People
                  </h3>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    Tap a person's pill under each dish to assign them. If multiple people share a dish, the cost is split equally.
                  </p>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                  {items.map((item) => {
                    const assigned = item.assignedTo || [];
                    const sharersCount = assigned.length;
                    const itemTotal = parseFloat(item.price) * (parseInt(item.qty, 10) || 1);
                    const costPerPerson = sharersCount > 0 ? itemTotal / sharersCount : itemTotal;

                    return (
                      <div
                        key={item.id}
                        className="p-5 rounded-2xl bg-[#FFFDF7] border border-[#FFE494] hover:border-[#FFD83D] transition-all space-y-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h4 className="font-bold text-base text-[#292929]">
                              {item.name}
                            </h4>
                            <div className="text-xs text-[#6B7280] mt-0.5">
                              {sharersCount > 0 ? (
                                <span className="text-[#009F93] font-semibold">
                                  Shared by {sharersCount} people ({formatRupees(costPerPerson)} each)
                                </span>
                              ) : (
                                <span className="text-amber-600 font-semibold">
                                  ⚠️ Unassigned &mdash; tap names below to assign
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-serif text-lg font-bold text-[#292929] block">
                              {formatRupees(itemTotal)}
                            </span>
                            {item.qty > 1 && (
                              <span className="text-[11px] text-[#6B7280]">
                                {item.qty} × {formatRupees(item.price)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Person assignment pills for this dish */}
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#FFE494]/60">
                          <span className="text-[11px] font-bold text-[#6B7280] self-center mr-1">
                            Ate this:
                          </span>
                          {participants.map((person) => {
                            const isAssigned = assigned.includes(person);
                            return (
                              <button
                                key={person}
                                type="button"
                                onClick={() => toggleItemAssignment(item.id, person)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                                  isAssigned
                                    ? 'bg-[#FFD83D] text-[#292929] border border-[#FFC928] shadow-warm-sm font-bold'
                                    : 'bg-white text-[#6B7280] border border-[#FFE494] hover:bg-[#FFF4D9]'
                                }`}
                              >
                                {person} {isAssigned && '✓'}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mode 2: Participant Split Summaries */}
              <div className="bg-white border border-[#FFE494] rounded-3xl p-6 sm:p-8 shadow-warm-sm space-y-4">
                <h3 className="font-serif text-xl font-bold text-[#292929]">
                  Individual Split Breakdown
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Food subtotals + proportional share of GST & Service Charge.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {participants.map((person) => {
                    const s = itemShares[person] || {};
                    return (
                      <div
                        key={person}
                        className="p-5 rounded-2xl bg-[#FFFDF0] border border-[#FFE494] flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-bold text-base text-[#292929]">
                              {person}
                            </span>
                            <span className="font-serif text-lg font-bold text-[#009F93]">
                              {formatRupees(s.finalTotal || 0)}
                            </span>
                          </div>

                          <div className="space-y-1.5 text-xs text-[#6B7280] mb-4">
                            <div className="flex justify-between">
                              <span>Food subtotal:</span>
                              <span className="font-semibold text-[#292929]">
                                {formatRupees(s.foodSubtotal || 0)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>GST & Service Charge:</span>
                              <span className="font-semibold text-[#292929]">
                                +{formatRupees((s.taxShare || 0) + (s.serviceShare || 0))}
                              </span>
                            </div>
                            {s.discountShare > 0 && (
                              <div className="flex justify-between text-red-600">
                                <span>Discount:</span>
                                <span>-{formatRupees(s.discountShare)}</span>
                              </div>
                            )}
                          </div>

                          {/* Consumed dishes */}
                          <div className="pt-2 border-t border-[#FFE494]">
                            <span className="text-[10px] uppercase font-bold text-[#6B7280] tracking-wider block mb-1">
                              Dishes ({s.assignedItems?.length || 0}):
                            </span>
                            <div className="space-y-1">
                              {(s.assignedItems || []).map((it, i) => (
                                <div
                                  key={i}
                                  className="text-[11px] text-[#292929] flex justify-between bg-white px-2 py-0.5 rounded border border-[#FFE494]/60"
                                >
                                  <span className="truncate max-w-[130px]">{it.name}</span>
                                  <span className="font-semibold">{formatRupees(it.amount)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-2 border-t border-[#FFE494] text-right">
                          <span className="text-[11px] font-bold text-[#009F93]">
                            Payable: {formatRupees(s.finalTotal || 0)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Confirm & Generate Payment Requests Button */}
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={handleFinalizeSplit}
              disabled={isFinalizing}
              className="px-8 py-4 rounded-full bg-[#009F93] hover:bg-[#00847A] text-white font-bold text-sm shadow-teal transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span>{isFinalizing ? 'Finalizing Split...' : 'Generate Payment Requests'}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
