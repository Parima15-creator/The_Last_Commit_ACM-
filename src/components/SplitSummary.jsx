import React from 'react';
import { Calculator, CheckCircle2, ChevronDown, Utensils, Percent, ShieldCheck } from 'lucide-react';
import { formatRupees } from '../utils/formatCurrency.js';

export function SplitSummary({ splitResult, billTotal, allocationPolicy, onPolicyChange }) {
  const { peopleShares = {}, reconciliation = {} } = splitResult;
  const people = Object.keys(peopleShares);

  const {
    itemsTotalPaise = 0,
    extrasTotalPaise = 0,
    calculatedTotalPaise = 0,
    sumOfSharesPaise = 0,
    isReconciled = false,
    hasUnassignedItems = false,
  } = reconciliation;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">
                FAIR SPLIT RECONCILIATION
              </h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Paise Precision
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Deterministic allocation via Largest Remainder Method (Hare-Niemeyer)
            </p>
          </div>
        </div>

        {/* Extras allocation policy selector */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <span className="text-slate-400 text-[11px] px-2 font-medium">Taxes & Extras:</span>
          <button
            onClick={() => onPolicyChange('proportional')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
              allocationPolicy === 'proportional'
                ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Proportional to Food
          </button>
          <button
            onClick={() => onPolicyChange('equal')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
              allocationPolicy === 'equal'
                ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Split Equally
          </button>
        </div>
      </div>

      {/* Reconciliation status badge */}
      <div className="mb-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-300 font-medium">
            Sum of individual member shares:
          </span>
          <span className="font-mono font-bold text-emerald-400">
            {formatRupees(sumOfSharesPaise / 100)}
          </span>
          <span className="text-slate-500 font-mono">({sumOfSharesPaise} paise)</span>
        </div>

        <div className="flex items-center gap-1.5">
          {isReconciled ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              100% Reconciled (0 Paisa Error)
            </span>
          ) : (
            <span className="text-amber-400 font-semibold text-[11px]">
              {hasUnassignedItems ? '⚠ Has Unassigned Food Items' : 'Rounding Variance Handled'}
            </span>
          )}
        </div>
      </div>

      {/* Grid of Member Shares */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {people.map((person) => {
          const share = peopleShares[person];
          if (!share) return null;

          return (
            <div
              key={person}
              className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all"
            >
              <div>
                {/* Person Header */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center border border-emerald-500/30">
                      {person.charAt(0)}
                    </div>
                    <span className="font-bold text-sm text-white">{person}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {formatRupees(share.totalRupees)}
                  </span>
                </div>

                {/* Sub-breakdown */}
                <div className="space-y-1 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                  <div className="flex justify-between">
                    <span>Food Subtotal:</span>
                    <span className="font-mono text-slate-200">
                      {formatRupees(share.foodRupees)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes & Extras:</span>
                    <span className="font-mono text-slate-200">
                      +{formatRupees(share.extraRupees)}
                    </span>
                  </div>
                </div>

                {/* Consumed Items Chips */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                  <span className="block text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1.5">
                    Consumed Dishes ({share.items.length})
                  </span>
                  <div className="space-y-1">
                    {share.items.length > 0 ? (
                      share.items.map((it, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between text-[11px] text-slate-300 bg-slate-900/60 px-2 py-1 rounded"
                        >
                          <span className="truncate max-w-[120px]">{it.name}</span>
                          <span className="font-mono text-slate-400">
                            {formatRupees(it.shareRupees)}
                            {it.sharersCount > 1 && (
                              <span className="text-[9px] text-slate-400 ml-1">
                                (1/{it.sharersCount})
                              </span>
                            )}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">No food assigned</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Exact paise total footer */}
              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>Exact Share:</span>
                <span>{share.totalPaise} paise</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
