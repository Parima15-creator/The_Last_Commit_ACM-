import React from 'react';
import { CheckCircle2, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';
import { formatRupees } from '../utils/formatCurrency.js';

export function MathCheckBanner({ mathCheck, unassignedCount = 0 }) {
  const {
    itemsTotal,
    extrasTotal,
    calculatedTotal,
    printedTotal,
    diffRupees,
    isMatch,
  } = mathCheck;

  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-300 ${
        isMatch
          ? 'bg-slate-900/90 border-emerald-500/40 glow-emerald'
          : 'bg-red-950/40 border-red-500/50 glow-red'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Status Icon and Headline */}
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-xl mt-0.5 shrink-0 ${
              isMatch
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}
          >
            {isMatch ? (
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                {isMatch ? (
                  <>
                    <span className="text-emerald-400">MATH RECONCILED</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                      Exact 0 Paise Drift
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-red-400">MATH JHOL DETECTED</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-mono">
                      Diff: {diffRupees > 0 ? `+${formatRupees(diffRupees)}` : formatRupees(diffRupees)}
                    </span>
                  </>
                )}
              </h3>
              {unassignedCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {unassignedCount} item{unassignedCount > 1 ? 's' : ''} unassigned
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isMatch
                ? `Calculated total (${formatRupees(calculatedTotal)}) matches printed receipt total (${formatRupees(printedTotal)}).`
                : `Items sum (${formatRupees(itemsTotal)}) + extras (${formatRupees(extrasTotal)}) = ${formatRupees(calculatedTotal)}, but receipt printed total is ${formatRupees(printedTotal)}. Check OCR or edit items.`}
            </p>
          </div>
        </div>

        {/* Right: Financial Math Breakdown */}
        <div className="flex items-center gap-2 font-mono text-xs bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 shrink-0 self-start md:self-auto overflow-x-auto max-w-full">
          <div className="text-center px-2">
            <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-sans">Food</span>
            <span className="font-semibold text-slate-200">{formatRupees(itemsTotal)}</span>
          </div>
          <span className="text-slate-500 font-bold">+</span>
          <div className="text-center px-2">
            <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-sans">Extras</span>
            <span className="font-semibold text-slate-200">{formatRupees(extrasTotal)}</span>
          </div>
          <span className="text-slate-500 font-bold">=</span>
          <div className="text-center px-2">
            <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-sans">Calc Total</span>
            <span className="font-bold text-emerald-400">{formatRupees(calculatedTotal)}</span>
          </div>
          <span className="text-slate-500 font-bold">vs</span>
          <div className="text-center px-2 border-l border-slate-800">
            <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-sans">Printed</span>
            <span className={`font-bold ${isMatch ? 'text-white' : 'text-red-400 underline'}`}>
              {formatRupees(printedTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
