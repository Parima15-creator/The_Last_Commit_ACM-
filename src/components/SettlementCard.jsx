import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  CreditCard,
  Send,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  QrCode,
  ShieldCheck,
  Smile,
  Flame,
  Award,
} from 'lucide-react';
import { formatRupees } from '../utils/formatCurrency.js';
import { generateWhatsAppReminder } from '../utils/settlement.js';

export function SettlementCard({
  settlement,
  restaurantName,
  onToggleTransactionPaid,
  onAddAuditEvent,
}) {
  const { balances = {}, transactions = [], isBalanced = true } = settlement;
  const [copiedId, setCopiedId] = useState(null);
  const [activeQrModal, setActiveQrModal] = useState(null);
  const [reminderTone, setReminderTone] = useState('friendly'); // 'polite' | 'friendly' | 'roast'

  const handleCopyLink = (tx) => {
    navigator.clipboard.writeText(tx.upiLink);
    setCopiedId(tx.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenWhatsApp = (tx, tone) => {
    const reminder = generateWhatsAppReminder(tx, tone, restaurantName);
    window.open(reminder.whatsappUrl, '_blank');
    onAddAuditEvent?.({
      type: 'WHATSAPP_REMINDER_GENERATED',
      description: `Generated ${tone.toUpperCase()} WhatsApp reminder from ${tx.to} to ${tx.from} for ₹${tx.amountRupees}.`,
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">
                INTELLIGENT SETTLEMENT & UPI PAYMENTS
              </h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 font-mono">
                Min Transactions: {transactions.length}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Greedy debt resolution minimizes money transfers &bull; Live UPI QR codes
            </p>
          </div>
        </div>

        {/* Reminder Tone Selector */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <span className="text-slate-400 text-[11px] px-2 font-medium">Tone:</span>
          <button
            onClick={() => setReminderTone('polite')}
            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              reminderTone === 'polite'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            Polite
          </button>
          <button
            onClick={() => setReminderTone('friendly')}
            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              reminderTone === 'friendly'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smile className="w-3 h-3" />
            Friendly
          </button>
          <button
            onClick={() => setReminderTone('roast')}
            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              reminderTone === 'roast'
                ? 'bg-red-500/20 text-red-300 border border-red-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3 h-3" />
            Roast 🔥
          </button>
        </div>
      </div>

      {/* Net Balances Overview */}
      <div className="mb-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {Object.values(balances).map((b) => (
          <div
            key={b.name}
            className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs"
          >
            <span className="font-semibold text-slate-300 block truncate">{b.name}</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-[10px] text-slate-400">Net:</span>
              <span
                className={`font-mono font-bold ${
                  b.netPaise > 0
                    ? 'text-emerald-400'
                    : b.netPaise < 0
                    ? 'text-red-400'
                    : 'text-slate-400'
                }`}
              >
                {b.netPaise > 0
                  ? `+${formatRupees(b.netRupees)}`
                  : b.netPaise < 0
                  ? formatRupees(b.netRupees)
                  : '₹0.00'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {b.netPaise > 0
                ? 'Gets back money'
                : b.netPaise < 0
                ? 'Owes money'
                : 'All settled'}
            </span>
          </div>
        ))}
      </div>

      {/* Individual Settlement Instructions & Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
          Payment Instructions & UPI Links
        </h3>

        {transactions.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-slate-950/50 border border-slate-800 text-slate-400 text-xs">
            All accounts are settled! No payments required.
          </div>
        ) : (
          transactions.map((tx) => (
            <div
              key={tx.id}
              className={`rounded-xl border p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                tx.isPaid
                  ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                  : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Left: Transaction details */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    tx.isPaid
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                  }`}
                >
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{tx.from}</span>
                    <span className="text-slate-400 text-xs">&rarr; pays &rarr;</span>
                    <span className="font-bold text-emerald-400 text-sm">{tx.to}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-mono">
                    <span>UPI: {tx.creditorUpi}</span>
                  </div>
                </div>
              </div>

              {/* Middle: Amount */}
              <div className="flex md:flex-col items-baseline md:items-end justify-between">
                <span className="text-xs text-slate-400 md:hidden">Amount:</span>
                <span className="font-mono text-lg font-bold text-emerald-400">
                  {formatRupees(tx.amountRupees)}
                </span>
                <span className="text-[10px] text-slate-400 font-mono hidden md:block">
                  ({tx.amountPaise} paise)
                </span>
              </div>

              {/* Right: Actions (UPI Copy, QR Code, WhatsApp, Mark Paid) */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handleCopyLink(tx)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Copy UPI Deep Link"
                >
                  {copiedId === tx.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>UPI Link</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setActiveQrModal(tx)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Show UPI QR Code"
                >
                  <QrCode className="w-3.5 h-3.5 text-teal-400" />
                  <span>QR Code</span>
                </button>

                <button
                  onClick={() => handleOpenWhatsApp(tx, reminderTone)}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title={`Send WhatsApp reminder (${reminderTone})`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={() => onToggleTransactionPaid(tx.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    tx.isPaid
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  {tx.isPaid ? <span className="inline-flex items-center gap-1">Paid <Check aria-label="Paid" className="h-3.5 w-3.5" strokeWidth={3} /></span> : 'Mark Paid'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* QR Code Modal */}
      {activeQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative glow-emerald">
            <h3 className="text-base font-bold text-white mb-1">
              Pay ₹{activeQrModal.amountRupees.toFixed(2)} to {activeQrModal.to}
            </h3>
            <p className="text-xs text-slate-400 mb-4 font-mono">
              Scan with GPay, PhonePe, Paytm or Cred
            </p>

            {/* QR code on pristine white padded background */}
            <div className="bg-white p-4 rounded-2xl inline-block shadow-inner mb-4">
              <QRCodeSVG
                value={activeQrModal.upiLink}
                size={200}
                level="M"
                includeMargin={false}
              />
            </div>

            <div className="text-xs font-mono text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800 mb-4 truncate">
              {activeQrModal.creditorUpi}
            </div>

            <div className="flex gap-2">
              <a
                href={activeQrModal.upiLink}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in UPI App</span>
              </a>
              <button
                onClick={() => setActiveQrModal(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
