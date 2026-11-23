import React, { useState } from 'react';
import { Users, UserPlus, X, CreditCard, AtSign, Check, Edit2 } from 'lucide-react';
import { formatRupees } from '../utils/formatCurrency.js';

export function PeopleManager({
  people,
  onAddPerson,
  onRemovePerson,
  paymentsMade,
  onUpdatePayment,
  upiDirectory,
  onUpdateUpi,
  billTotal,
}) {
  const [newPersonName, setNewPersonName] = useState('');
  const [editingUpiFor, setEditingUpiFor] = useState(null);
  const [tempUpi, setTempUpi] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    const name = newPersonName.trim();
    if (name && !people.includes(name)) {
      onAddPerson(name);
      setNewPersonName('');
    }
  };

  const startEditUpi = (person) => {
    setEditingUpiFor(person);
    setTempUpi(upiDirectory[person] || `${person.toLowerCase().replace(/[^a-z0-9]/g, '')}@upi`);
  };

  const saveUpi = (person) => {
    if (tempUpi.trim()) {
      onUpdateUpi(person, tempUpi.trim());
    }
    setEditingUpiFor(null);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">GROUP MEMBERS & BILL PAYER</h2>
            <p className="text-xs text-slate-400">{people.length} people participating in this bill</p>
          </div>
        </div>

        {/* Quick Add Member Input */}
        <form onSubmit={handleAdd} className="flex items-center gap-2">
          <input
            type="text"
            value={newPersonName}
            onChange={(e) => setNewPersonName(e.target.value)}
            placeholder="Add name..."
            className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 w-28 sm:w-36"
          />
          <button
            type="submit"
            disabled={!newPersonName.trim()}
            className="p-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-slate-950 transition-colors cursor-pointer"
            title="Add Person"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* People cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {people.map((person) => {
          const isMainPayer = (paymentsMade[person] || 0) > 0;
          const currentPaid = paymentsMade[person] || 0;
          const currentUpi = upiDirectory[person] || `${person.toLowerCase().replace(/[^a-z0-9]/g, '')}@upi`;

          return (
            <div
              key={person}
              className={`rounded-xl p-3.5 border transition-all ${
                isMainPayer
                  ? 'bg-slate-950/80 border-blue-500/40 shadow-sm shadow-blue-500/10'
                  : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center uppercase">
                    {person.charAt(0)}
                  </div>
                  <span className="font-semibold text-sm text-slate-200 truncate max-w-[100px]">
                    {person}
                  </span>
                </div>

                {people.length > 1 && (
                  <button
                    onClick={() => onRemovePerson(person)}
                    className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
                    title={`Remove ${person}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Bill Payer selection */}
              <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px] flex items-center gap-1">
                  <CreditCard className="w-3 h-3 text-slate-500" />
                  Paid bill:
                </span>
                <button
                  onClick={() => onUpdatePayment(person, isMainPayer ? 0 : billTotal)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                    isMainPayer
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Toggle as bill payer"
                >
                  {isMainPayer ? formatRupees(currentPaid) : 'Mark Payer'}
                </button>
              </div>

              {/* UPI ID setting */}
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 truncate text-slate-500">
                  <AtSign className="w-2.5 h-2.5" />
                  {editingUpiFor === person ? (
                    <input
                      type="text"
                      value={tempUpi}
                      onChange={(e) => setTempUpi(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveUpi(person)}
                      className="bg-slate-900 border border-slate-700 text-white text-[11px] px-1 rounded w-28 focus:outline-none"
                    />
                  ) : (
                    <span className="truncate max-w-[110px]" title={currentUpi}>
                      {currentUpi}
                    </span>
                  )}
                </span>
                {editingUpiFor === person ? (
                  <button
                    onClick={() => saveUpi(person)}
                    className="text-emerald-400 hover:text-emerald-300 p-0.5 cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                ) : (
                  <button
                    onClick={() => startEditUpi(person)}
                    className="text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
                    title="Edit UPI ID"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
