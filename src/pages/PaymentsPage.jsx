import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  CreditCard,
  Send,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  Filter,
  CheckCircle2,
  Clock,
  Mail,
  Smartphone,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../services/api.js';
import { formatRupees } from '../utils/formatCurrency.js';
import { EmptyState } from '../components/EmptyState.jsx';

export function PaymentsPage() {
  const { payments, refreshPayments, showToast } = useApp();

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeQrPayment, setActiveQrPayment] = useState(null);
  const [shareModalPayment, setShareModalPayment] = useState(null);
  const [shareData, setShareData] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const filteredPayments = payments.filter((p) => {
    if (statusFilter === 'ALL') return true;
    return p.status === statusFilter;
  });

  const handleStatusChange = async (paymentId, newStatus) => {
    try {
      await api.updatePaymentStatus(paymentId, newStatus);
      await refreshPayments();
      showToast(`Payment marked as ${newStatus.replace('_', ' ')}!`);
    } catch (err) {
      showToast(err.message || 'Failed to update payment status', 'error');
    }
  };

  const handleCopyUpi = (p) => {
    navigator.clipboard.writeText(p.upiUri);
    setCopiedId(p.id);
    showToast('UPI payment link copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleOpenShare = async (p) => {
    setShareModalPayment(p);
    setShareData(null);
    try {
      const data = await api.getPaymentShare(p.id);
      setShareData(data);
    } catch (err) {
      console.error('Share fetch error:', err);
    }
  };

  const handleSendWhatsApp = (p) => {
    const text = `Hi ${p.from}! Your share for ${p.billTitle} is ₹${p.amountRupees.toFixed(2)}. Please settle the amount using this payment link:\n${p.upiUri}\n\nThank you! (No Jhol via JholFree)`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold text-[#292929]">
            Payment Requests
          </h2>
          <p className="text-sm text-[#6B7280] mt-1">
            Send WhatsApp reminders, show live UPI QR codes, and track settlement statuses.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#FFF4D9] border border-[#FFE494]">
          {['ALL', 'pending', 'marked_paid', 'completed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer capitalize ${
                statusFilter === st
                  ? 'bg-[#FFD83D] text-[#292929] shadow-warm-sm border border-[#FFC928]'
                  : 'text-[#6B7280] hover:text-[#292929]'
              }`}
            >
              {st === 'ALL' ? 'All' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Notice Alert */}
      <div className="p-4 rounded-2xl bg-[#FFFDF0] border border-[#FFE494] text-xs text-[#6B7280] flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-[#FF8A1E] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[#292929]">Verification Notice:</span> Opening a UPI application or generating a QR code does not automatically confirm bank transfer completion. Please verify your bank statement or UPI app receipt before marking payments as completed.
        </div>
      </div>

      {/* Payment Requests List */}
      {payments.length === 0 ? (
        <EmptyState
          icon="💳"
          title="No payment requests yet"
          description="Create a bill and choose Equal or Item-based split to automatically generate payment requests."
          actionText="Create Bill"
          actionLink="/create-bill"
        />
      ) : filteredPayments.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-[#FFE494] text-sm text-[#6B7280]">
          No payments with status "{statusFilter.replace('_', ' ')}".
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPayments.map((p) => {
            const isSettled = p.status === 'completed' || p.status === 'marked_paid';

            return (
              <div
                key={p.id}
                className={`p-5 rounded-3xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isSettled
                    ? 'bg-white/80 border-[#FFE494]/60 opacity-80'
                    : 'bg-white border-[#FFE494] shadow-warm-sm hover:shadow-warm'
                }`}
              >
                {/* Left: Transaction Participants & Bill */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-xl ${
                      isSettled ? 'bg-[#E6F7F5] text-[#009F93]' : 'bg-[#FFF4D9] text-[#FF8A1E]'
                    }`}
                  >
                    💸
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-[#292929]">{p.from}</span>
                      <span className="text-[#6B7280] text-xs">&rarr; pays &rarr;</span>
                      <span className="font-bold text-base text-[#009F93]">{p.to}</span>
                    </div>
                    <div className="text-xs text-[#6B7280] mt-0.5">
                      Bill: <strong className="text-[#292929]">{p.billTitle}</strong>
                    </div>
                  </div>
                </div>

                {/* Middle: Amount & Status Badge */}
                <div className="flex md:flex-col items-baseline md:items-end justify-between">
                  <span className="font-serif text-2xl font-bold text-[#292929]">
                    {formatRupees(p.amountRupees)}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full mt-1 ${
                      p.status === 'completed'
                        ? 'bg-[#E6F7F5] text-[#009F93]'
                        : p.status === 'marked_paid'
                        ? 'bg-[#FFF0E5] text-[#FF8A1E]'
                        : 'bg-[#FFF9E6] text-amber-700'
                    }`}
                  >
                    {p.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleCopyUpi(p)}
                    className="px-3 py-2 rounded-xl bg-[#FFFDF7] hover:bg-[#FFF4D9] text-xs font-semibold text-[#292929] border border-[#FFE494] flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Copy UPI Payment Deep Link"
                  >
                    {copiedId === p.id ? <Check className="w-3.5 h-3.5 text-[#009F93]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === p.id ? 'Copied' : 'UPI Link'}</span>
                  </button>

                  <button
                    onClick={() => setActiveQrPayment(p)}
                    className="px-3 py-2 rounded-xl bg-[#FFFDF7] hover:bg-[#FFF4D9] text-xs font-semibold text-[#292929] border border-[#FFE494] flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="View UPI QR Code"
                  >
                    <QrCode className="w-3.5 h-3.5 text-[#FF8A1E]" />
                    <span>QR Code</span>
                  </button>

                  <button
                    onClick={() => handleSendWhatsApp(p)}
                    className="px-3.5 py-2 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] font-bold text-xs border border-[#25D366]/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Send WhatsApp Payment Reminder"
                  >
                    <MessageSquare className="w-3.5 h-3.5 fill-[#128C7E]" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={() => handleOpenShare(p)}
                    className="px-3 py-2 rounded-xl bg-[#FFFDF7] hover:bg-[#FFF4D9] text-xs font-semibold text-[#6B7280] border border-[#FFE494] cursor-pointer"
                    title="More Share Options (SMS, Email)"
                  >
                    <span>More...</span>
                  </button>

                  {/* Status Toggle */}
                  <select
                    value={p.status}
                    onChange={(e) => handleStatusChange(p.id, e.target.value)}
                    className="px-3 py-2 rounded-xl bg-[#FFF4D9] border border-[#FFE494] text-xs font-bold text-[#292929] cursor-pointer focus:outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="marked_paid">Marked Paid</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Code Modal */}
      {activeQrPayment && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#FFE494] rounded-3xl max-w-sm w-full p-6 text-center shadow-warm-lg relative space-y-4 animate-scale-up">
            <h3 className="font-serif text-xl font-bold text-[#292929]">
              Scan to Pay {formatRupees(activeQrPayment.amountRupees)}
            </h3>
            <p className="text-xs text-[#6B7280]">
              Payee: <strong className="text-[#292929]">{activeQrPayment.to}</strong> &bull; For {activeQrPayment.billTitle}
            </p>

            {/* Pristine white padded QR container */}
            <div className="bg-white p-4 rounded-2xl inline-block shadow-warm border border-[#FFE494]">
              <QRCodeSVG
                value={activeQrPayment.upiUri}
                size={210}
                level="M"
                includeMargin={false}
              />
            </div>

            <div className="text-[11px] font-mono text-[#6B7280] bg-[#FFFDF0] p-2 rounded-xl border border-[#FFE494] truncate">
              {activeQrPayment.upiUri}
            </div>

            <div className="flex gap-2 pt-2">
              <a
                href={activeQrPayment.upiUri}
                className="flex-1 py-2.5 rounded-full bg-[#009F93] hover:bg-[#00847A] text-white font-bold text-xs shadow-teal flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in UPI App</span>
              </a>
              <button
                onClick={() => setActiveQrPayment(null)}
                className="px-5 py-2.5 rounded-full bg-white hover:bg-[#FFF4D9] text-[#292929] font-bold text-xs border border-[#FFE494] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* More Share Modal (SMS / Email) */}
      {shareModalPayment && shareData && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#FFE494] rounded-3xl max-w-md w-full p-6 shadow-warm-lg space-y-5 animate-scale-up">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-bold text-[#292929]">
                Share Payment Request
              </h3>
              <button
                onClick={() => setShareModalPayment(null)}
                className="p-1 rounded-lg text-[#6B7280] hover:text-[#292929] hover:bg-[#FFF4D9] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* WhatsApp message copy */}
            <div className="p-4 rounded-2xl bg-[#E8F8F0] border border-[#25D366]/40 space-y-2">
              <span className="font-bold text-xs text-[#128C7E] flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4" />
                WhatsApp Message
              </span>
              <p className="text-xs text-[#292929] whitespace-pre-line bg-white/80 p-2.5 rounded-xl border border-[#25D366]/20">
                {shareData.whatsapp.message}
              </p>
              <button
                onClick={() => window.open(shareData.whatsapp.shareUrl, '_blank')}
                className="w-full py-2 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                Open in WhatsApp Web / App
              </button>
            </div>

            {/* SMS text */}
            <div className="p-4 rounded-2xl bg-[#FFFDF0] border border-[#FFE494] space-y-2 text-xs">
              <span className="font-bold text-[#292929] flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-[#FF8A1E]" />
                SMS Text
              </span>
              <p className="text-[#6B7280] bg-white p-2.5 rounded-xl border border-[#FFE494]">
                {shareData.sms.message}
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareData.sms.message);
                  showToast('SMS text copied!');
                }}
                className="w-full py-1.5 rounded-xl bg-white hover:bg-[#FFF4D9] text-[#292929] font-semibold border border-[#FFE494] cursor-pointer"
              >
                Copy SMS Text
              </button>
              <span className="text-[10px] text-[#6B7280] block">
                {shareData.sms.note}
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShareModalPayment(null)}
                className="px-6 py-2 rounded-full bg-[#292929] text-white text-xs font-bold cursor-pointer"
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
