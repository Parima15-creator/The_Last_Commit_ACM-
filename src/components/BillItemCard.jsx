import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Plus, Trash2, Users, Edit3, ShieldAlert } from 'lucide-react';
import { formatRupees } from '../utils/formatCurrency.js';
import { toPaise, fromPaise } from '../utils/splitMath.js';

export function BillItemCard({
  item,
  people,
  onTogglePerson,
  onUpdateItem,
  onDeleteItem,
  onAddAuditEvent,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(item.price);
  const [qty, setQty] = useState(item.qty || 1);

  const assigned = item.assignedTo || [];
  const sharersCount = assigned.length;
  const isLowConfidence = item.confidence === 'low';

  const sharePerPerson = sharersCount > 0 ? item.price / sharersCount : item.price;

  const handleSave = () => {
    const numPrice = parseFloat(price) || 0;
    const numQty = parseInt(qty, 10) || 1;
    const cleanName = name.trim() || item.name;

    const hasChanged = numPrice !== item.price || cleanName !== item.name || numQty !== item.qty;

    if (hasChanged) {
      onUpdateItem(item.id, {
        name: cleanName,
        price: numPrice,
        qty: numQty,
        confidence: 'high', // Mark verified upon manual edit
      });

      onAddAuditEvent?.({
        type: 'MANUAL_CORRECTION',
        description: `Updated item "${item.name}" -> "${cleanName}", price ₹${item.price} -> ₹${numPrice}, qty ${item.qty} -> ${numQty}.`,
      });
    }

    setIsEditing(false);
  };

  const handleVerifyConfidence = () => {
    onUpdateItem(item.id, { confidence: 'high' });
    onAddAuditEvent?.({
      type: 'OCR_CONFIDENCE_VERIFIED',
      description: `Verified OCR reading for "${item.name}" at ₹${item.price}.`,
    });
  };

  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-200 ${
        isLowConfidence
          ? 'bg-slate-900/90 border-amber-500/50 glow-amber'
          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700/80'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Item Name, Qty & OCR badge */}
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {isEditing ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded text-sm text-white font-medium focus:outline-none focus:border-emerald-500 flex-1"
                />
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="w-14 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            ) : (
              <>
                <h4 className="text-sm font-semibold text-white tracking-wide">
                  {item.name}
                </h4>
                {item.qty > 1 && (
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    &times;{item.qty}
                  </span>
                )}
              </>
            )}

            {/* OCR Confidence Badge */}
            {isLowConfidence ? (
              <button
                onClick={handleVerifyConfidence}
                className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1 hover:bg-amber-500/25 transition-colors cursor-pointer"
                title="Low OCR certainty. Click to confirm or edit."
              >
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                <span>Check OCR</span>
              </button>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                <span>Verified</span>
              </span>
            )}
          </div>

          {/* Sharers Count & Per Person Breakdown */}
          <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-400">
            {sharersCount > 0 ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <Users className="w-3 h-3" />
                Shared by {sharersCount} {sharersCount === 1 ? 'person' : 'people'} &bull;{' '}
                <span className="font-mono">{formatRupees(sharePerPerson)} each</span>
              </span>
            ) : (
              <span className="text-amber-400/90 italic flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Unassigned &mdash; tap members below to assign
              </span>
            )}
          </div>
        </div>

        {/* Item Total Price & Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-mono text-sm">₹</span>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-24 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleSave}
                className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-base font-bold text-emerald-400 font-mono">
                {formatRupees(item.price)}
              </span>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Edit item name or price"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDeleteItem(item.id)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Remove item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tap-to-toggle person assignment pills */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-medium text-slate-400 mr-1">Assign to:</span>
        {people.map((person) => {
          const isSelected = assigned.includes(person);
          return (
            <button
              key={person}
              onClick={() => onTogglePerson(item.id, person)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                isSelected
                  ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>{person}</span>
              {isSelected && <span className="text-[10px]">&check;</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
