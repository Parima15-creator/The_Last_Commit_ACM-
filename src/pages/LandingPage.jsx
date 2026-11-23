import React from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  Split,
  Users,
  CreditCard,
  FileSpreadsheet,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Zap,
  ShieldCheck,
  Receipt,
} from 'lucide-react';
import { FoodOrbit } from '../components/FoodOrbit.jsx';

export function LandingPage() {
  return (
    <div className="relative isolate min-h-screen animated-page-gradient text-[#292929] flex flex-col overflow-x-hidden">
      {/* Top Header */}
      <header className="relative h-20 bg-white/70 backdrop-blur-md border-b border-[#FFE494]/60 sticky top-0 z-30 px-6 sm:px-12 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#FFD83D] flex items-center justify-center font-bold text-lg text-[#292929] shadow-warm border border-[#FFC928]">
            💸
          </div>
          <div>
            <span className="font-serif text-2xl font-bold tracking-tight text-[#292929] block">
              Jhol<span className="text-[#FF8A1E]">Free</span>
            </span>
            <span className="text-[10px] font-semibold text-[#6B7280] tracking-wider uppercase block -mt-1">
              Snap. Speak. Settle.
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          
          <Link
            to="/dashboard"
            className="px-6 py-2.5 rounded-full bg-[#FFD83D] hover:bg-[#FFC928] text-[#292929] font-bold text-sm shadow-warm-sm transition-all border border-[#FFC928] active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span>Open App</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 py-16 sm:py-24 px-6 sm:px-12 max-w-6xl mx-auto w-full text-center flex flex-col items-center">
        <FoodOrbit />

        {/* Main Headline */}
        <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#292929] max-w-4xl leading-[1.15] mb-6">
          Splitting bills? <br className="hidden sm:inline" />
          <span className="text-[#FF8A1E] underline decoration-[#FFD83D] decoration-wavy decoration-2">
            No more Jhol!
          </span>
        </h1>

        {/* Supporting Text */}
        <p className="text-lg sm:text-xl text-[#6B7280] max-w-2xl mb-10 leading-relaxed font-normal">
          Enjoy the food, split the bill, and settle up without the confusion.
          AI receipt scanning meets deterministic paise-level financial accuracy.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#009F93] hover:bg-[#00847A] text-white font-bold text-base shadow-teal transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="#how-it-works"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-white hover:bg-[#FFF4D9] text-[#292929] font-bold text-base border border-[#FFE494] shadow-warm-sm transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Learn How It Works</span>
          </a>
        </div>
      </section>

      {/* Feature Section */}
      <section className="relative z-10 py-20 px-6 sm:px-12 bg-white/65 backdrop-blur-[2px] border-y border-[#FFE494]/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-[#FF8A1E] uppercase tracking-wider block mb-2 font-mono">
              Features Built for Real Friends
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#292929]">
              Everything you need to split effortlessly
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl bg-[#FFFDF0] border border-[#FFE494] shadow-warm-sm hover:shadow-warm transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-[#FFD83D] flex items-center justify-center text-xl mb-6 shadow-sm border border-[#FFC928]">
                <Camera className="w-6 h-6 text-[#292929]" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#292929] mb-2.5">
                1. Snap Your Bill
              </h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Upload any paper or thermal restaurant receipt. Canvas image enhancement and Groq Vision extract items, quantities, and GST in seconds.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-3xl bg-[#FFF5ED] border border-[#FF8A1E]/30 shadow-warm-sm hover:shadow-warm transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-[#FF8A1E] flex items-center justify-center text-xl mb-6 shadow-sm text-white">
                <Split className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#292929] mb-2.5">
                2. Split Your Way
              </h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Choose between <strong>Equal Split</strong> (divide total evenly) or <strong>Item-Based Split</strong> (pay only for dishes you ate or shared).
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-3xl bg-[#FFFDF0] border border-[#FFE494] shadow-warm-sm hover:shadow-warm transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-[#FFD83D] flex items-center justify-center text-xl mb-6 shadow-sm border border-[#FFC928]">
                <Users className="w-6 h-6 text-[#292929]" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#292929] mb-2.5">
                3. Add Your People
              </h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Easily manage your friends, their phone numbers, and UPI IDs. Select participants in one tap while creating any bill.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-3xl bg-[#FFF5ED] border border-[#FF8A1E]/30 shadow-warm-sm hover:shadow-warm transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-[#FF8A1E] flex items-center justify-center text-xl mb-6 shadow-sm text-white">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#292929] mb-2.5">
                4. Settle Easily
              </h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Generate instant payment requests with live UPI deep links and QR codes. Send pre-filled WhatsApp reminders in one click.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-3xl bg-[#FFFDF0] border border-[#FFE494] shadow-warm-sm hover:shadow-warm transition-all group md:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 rounded-2xl bg-[#009F93] flex items-center justify-center text-xl mb-6 shadow-sm text-white">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#292929] mb-2.5">
                5. Track Expenses
              </h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Keep an ongoing history of past bills, who paid, who owes money, and track payment receipts without messy mental math.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="relative z-10 py-20 px-6 sm:px-12 bg-white/25">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-[#FF8A1E] uppercase tracking-wider block mb-2 font-mono">
              Simple 3-Step Process
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#292929]">
              How JholFree Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="p-8 rounded-3xl bg-white border border-[#FFE494] shadow-warm-sm text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-[#FFD83D] text-[#292929] font-serif font-bold text-2xl flex items-center justify-center mb-6 shadow-sm border border-[#FFC928]">
                1
              </div>
              <h3 className="font-serif text-xl font-bold text-[#292929] mb-2">
                Add your bill
              </h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Snap a receipt photo or type items in manually. Taxes and discounts are automatically calculated.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-8 rounded-3xl bg-white border border-[#FFE494] shadow-warm-sm text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-[#FFC928] text-[#292929] font-serif font-bold text-2xl flex items-center justify-center mb-6 shadow-sm border border-[#FF8A1E]/40">
                2
              </div>
              <h3 className="font-serif text-xl font-bold text-[#292929] mb-2">
                Choose how to split
              </h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Split equally among all participants or assign specific dishes to individuals and shared groups.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-8 rounded-3xl bg-white border border-[#FFE494] shadow-warm-sm text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-[#FF8A1E] text-white font-serif font-bold text-2xl flex items-center justify-center mb-6 shadow-sm">
                3
              </div>
              <h3 className="font-serif text-xl font-bold text-[#292929] mb-2">
                Send payment requests
              </h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Share custom WhatsApp links with exact amounts and UPI QR codes. Mark payments as they are received.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative z-10 py-20 px-6 sm:px-12 bg-[#FFD83D] text-[#292929] border-t border-[#FFC928] text-center">
        <div className="max-w-4xl mx-auto">
          
          <h2 className="font-serif text-3xl sm:text-5xl font-bold mb-4">
            Good food. Good friends. No money confusion.
          </h2>
          <p className="text-base sm:text-lg text-[#292929]/80 max-w-xl mx-auto mb-8 font-medium">
            Start splitting restaurant bills fair, transparent, and accurate down to the last paisa.
          </p>

          <Link
            to="/create-bill"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#292929] hover:bg-black text-white font-bold text-base shadow-warm-lg transition-all active:scale-95 cursor-pointer"
          >
            <span>Create Your First Bill</span>
            <ArrowRight className="w-5 h-5 text-[#FFD83D]" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-white/65 backdrop-blur-[2px] py-12 px-6 sm:px-12 border-t border-[#FFE494]/80 text-center text-xs text-[#6B7280]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-base text-[#292929]">JholFree</span>
            <span>&bull; Snap. Speak. Settle. No Jhol. No Confusion.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="hover:text-[#292929]">Dashboard</Link>
            <Link to="/bills" className="hover:text-[#292929]">Bills</Link>
            <Link to="/contacts" className="hover:text-[#292929]">Contacts</Link>
            <Link to="/settings" className="hover:text-[#292929]">Settings</Link>
          </div>

        </div>
      </footer>
    </div>
  );
}
