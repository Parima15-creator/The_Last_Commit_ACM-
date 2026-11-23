import React, { useState } from 'react';
import { History, Shield, Filter, Clock, Trash2, CheckCircle2 } from 'lucide-react';

export function AuditTrail({ events = [], onClearTrail }) {
  const [filterType, setFilterType] = useState('ALL');

  const filteredEvents = events.filter((ev) => {
    if (filterType === 'ALL') return true;
    return ev.type === filterType;
  });

  const eventTypes = ['ALL', ...Array.from(new Set(events.map((e) => e.type)))];

  const getBadgeColor = (type) => {
    switch (type) {
      case 'RECEIPT_UPLOADED':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'AI_EXTRACTION_COMPLETED':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'MANUAL_CORRECTION':
      case 'OCR_CONFIDENCE_VERIFIED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'VOICE_TRANSCRIPTION_APPLIED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'PAYMENT_STATUS_CHANGED':
        return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
            <History className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">
                BILL AUDIT TRAIL & LOGS
              </h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                {events.length} Events Logged
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Immutable chronological record of OCR, voice prompts, edits & reconciliations
            </p>
          </div>
        </div>

        {events.length > 0 && (
          <button
            onClick={onClearTrail}
            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-red-400 border border-slate-800 transition-colors cursor-pointer text-xs flex items-center gap-1"
            title="Clear Audit Log"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>

      {/* Filter Chips */}
      {eventTypes.length > 2 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          {eventTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
                filterType === type
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {type.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      )}

      {/* Events timeline */}
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {filteredEvents.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
            No audit events recorded yet. Perform actions like uploading a receipt or speaking a split to see logs.
          </div>
        ) : (
          filteredEvents.map((ev, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start justify-between gap-3 text-xs hover:border-slate-700 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border ${getBadgeColor(
                      ev.type
                    )}`}
                  >
                    {ev.type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {ev.timestamp || new Date().toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-slate-300 font-normal leading-relaxed">{ev.description}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
