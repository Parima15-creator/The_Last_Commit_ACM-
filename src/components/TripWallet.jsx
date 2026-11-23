import React, { useState } from 'react';
import { Wallet, Plus, Car, Film, Hotel, ShoppingBag, Utensils, Trash2, ArrowRight } from 'lucide-react';
import { formatRupees } from '../utils/formatCurrency.js';
import { toPaise, fromPaise } from '../utils/splitMath.js';

const CATEGORIES = [
  { id: 'restaurant', name: 'Restaurant', icon: Utensils },
  { id: 'cab', name: 'Cab / Ride', icon: Car },
  { id: 'movie', name: 'Movie / Entertainment', icon: Film },
  { id: 'hotel', name: 'Hotel / Stay', icon: Hotel },
  { id: 'other', name: 'Groceries & Other', icon: ShoppingBag },
];

export function TripWallet({ people, upiDirectory }) {
  const [expenses, setExpenses] = useState([
    {
      id: 'exp_1',
      title: 'Airport Uber Cab',
      category: 'cab',
      amount: 450,
      paidBy: 'Rohan',
      splitBetween: ['Me', 'Rohan', 'Priya', 'Kabir'],
    },
    {
      id: 'exp_2',
      title: 'IMAX Movie Tickets',
      category: 'movie',
      amount: 1200,
      paidBy: 'Priya',
      splitBetween: ['Me', 'Rohan', 'Priya', 'Kabir'],
    },
  ]);

  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('cab');
  const [paidBy, setPaidBy] = useState(people[0] || 'Me');
  const [splitBetween, setSplitBetween] = useState(people);

  const handleAddExpense = (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!title.trim() || isNaN(numAmount) || numAmount <= 0) return;

    setExpenses([
      ...expenses,
      {
        id: `exp_${Date.now()}`,
        title: title.trim(),
        category,
        amount: numAmount,
        paidBy,
        splitBetween: splitBetween.length > 0 ? splitBetween : people,
      },
    ]);

    setTitle('');
    setAmount('');
    setIsAdding(false);
  };

  const handleDeleteExpense = (id) => {
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  const toggleSplitPerson = (person) => {
    if (splitBetween.includes(person)) {
      if (splitBetween.length > 1) {
        setSplitBetween(splitBetween.filter((p) => p !== person));
      }
    } else {
      setSplitBetween([...splitBetween, person]);
    }
  };

  // Compute Trip Wallet Net Settlement
  const totalTripSpend = expenses.reduce((sum, e) => sum + e.amount, 0);

  const personBalances = {};
  people.forEach((p) => {
    personBalances[p] = 0; // in paise
  });

  expenses.forEach((exp) => {
    const totalExpPaise = toPaise(exp.amount);
    // Creditor paid
    if (personBalances[exp.paidBy] !== undefined) {
      personBalances[exp.paidBy] += totalExpPaise;
    }

    // Split equally among participating members
    const sharers = exp.splitBetween.filter((p) => people.includes(p));
    if (sharers.length > 0) {
      const share = Math.floor(totalExpPaise / sharers.length);
      sharers.forEach((p) => {
        if (personBalances[p] !== undefined) {
          personBalances[p] -= share;
        }
      });
    }
  });

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">
                TRIP WALLET (MULTI-EXPENSE POOL)
              </h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">
                Total: {formatRupees(totalTripSpend)}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Combine cabs, movie tickets, hotels & food into one aggregated settlement
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Trip Expense</span>
        </button>
      </div>

      {/* Add Expense Form */}
      {isAdding && (
        <form
          onSubmit={handleAddExpense}
          className="mb-4 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Expense Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Goa Toll Booth"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Paid By</label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
              >
                {people.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Split Between</label>
            <div className="flex flex-wrap gap-1.5">
              {people.map((p) => {
                const isSelected = splitBetween.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => toggleSplitPerson(p)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer ${
                      isSelected
                        ? 'bg-purple-500 text-white'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs cursor-pointer"
            >
              Save Expense
            </button>
          </div>
        </form>
      )}

      {/* Expenses List */}
      <div className="space-y-2 mb-4">
        {expenses.map((exp) => (
          <div
            key={exp.id}
            className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
                {exp.category === 'cab' && <Car className="w-4 h-4" />}
                {exp.category === 'movie' && <Film className="w-4 h-4" />}
                {exp.category === 'hotel' && <Hotel className="w-4 h-4" />}
                {exp.category !== 'cab' && exp.category !== 'movie' && exp.category !== 'hotel' && (
                  <ShoppingBag className="w-4 h-4" />
                )}
              </div>
              <div>
                <span className="font-semibold text-slate-200">{exp.title}</span>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Paid by <span className="text-purple-300 font-medium">{exp.paidBy}</span> &bull;{' '}
                  Split among {exp.splitBetween.join(', ')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {formatRupees(exp.amount)}
              </span>
              <button
                onClick={() => handleDeleteExpense(exp.id)}
                className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Net Trip Balances */}
      <div className="pt-3 border-t border-slate-800/80">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
          Trip Wallet Net Balances:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {people.map((p) => {
            const net = personBalances[p] || 0;
            const netRupees = fromPaise(net);
            return (
              <div
                key={p}
                className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs flex justify-between items-center"
              >
                <span className="font-medium text-slate-300">{p}</span>
                <span
                  className={`font-mono font-bold ${
                    net > 0 ? 'text-emerald-400' : net < 0 ? 'text-red-400' : 'text-slate-400'
                  }`}
                >
                  {net > 0 ? `+${formatRupees(netRupees)}` : formatRupees(netRupees)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
