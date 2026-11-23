import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  LockKeyhole,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../services/api.js';

export function AuthPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('authToken');
    if (token) {
      localStorage.setItem('jholfree_auth_token', token);
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const continueWithGoogle = () => {
    window.location.href = '/api/auth/google';
  };

  const handleSendOtp = (event) => {
    event.preventDefault();
    const digits = phone.replace(/\D/g, '');

    if (digits.length < 10) {
      setError('Enter a valid 10-digit phone number.');
      setNotice('');
      return;
    }

    setError('');
    setNotice('');
    api.requestPhoneOtp(phone)
      .then((response) => {
        setOtpSent(true);
        if (response.devOtp) setNotice(`Development OTP: ${response.devOtp}`);
      })
      .catch((requestError) => setError(requestError.message));
  };

  const handleVerifyOtp = (event) => {
    event.preventDefault();
    if (otp.replace(/\D/g, '').length !== 6) {
      setError('Enter the 6-digit code sent to your phone.');
      setNotice('');
      return;
    }
    setError('');
    setNotice('');
    setIsSigningIn(true);
    api.verifyPhoneOtp(phone, otp)
      .then(({ token }) => {
        localStorage.setItem('jholfree_auth_token', token);
        navigate('/dashboard');
      })
      .catch((verifyError) => {
        setIsSigningIn(false);
        setError(verifyError.message);
      });
  };

  return (
    <main className="min-h-screen animated-page-gradient text-[#292929] flex items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-5xl grid lg:grid-cols-[1.05fr_0.95fr] bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white shadow-warm-lg overflow-hidden">
        <section className="hidden lg:flex relative flex-col justify-between bg-[#FFF4D9] p-12 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#FFD83D]/60 blur-2xl" />
          <div className="absolute -bottom-28 -left-16 w-64 h-64 rounded-full bg-[#FF8A1E]/20 blur-2xl" />

          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#6B7280] hover:text-[#292929] transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
            <img src="/jholfree-logo.png" alt="JholFree" className="w-36 h-auto mt-16" />
            <h1 className="font-serif text-4xl font-bold leading-tight mt-10 max-w-sm">
              Split bills with less jhol.
            </h1>
            <p className="text-[#6B7280] leading-relaxed mt-4 max-w-sm">
              Your friends, receipts, and settlements — all in one calm, clear place.
            </p>
          </div>

          <div className="relative z-10 space-y-3 text-sm font-medium text-[#6B7280]">
            {['Secure sign-in', 'No cards required', 'Your data stays yours'].map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#009F93] text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                </span>
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="p-6 sm:p-10 lg:p-14">
          <div className="flex items-center justify-between lg:hidden mb-10">
            <Link to="/" className="p-2 -ml-2 rounded-full hover:bg-[#FFF4D9]" aria-label="Back to home">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <img src="/jholfree-logo.png" alt="JholFree" className="w-28 h-auto" />
            <span className="w-9" />
          </div>

          <div className="max-w-md mx-auto">
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#FF8A1E] mb-3">Welcome to JholFree</p>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">Let’s get you started</h2>
              <p className="text-sm text-[#6B7280] mt-3">Sign in to save your bills and keep every split in sync.</p>
            </div>

            <button
              type="button"
              onClick={continueWithGoogle}
              disabled={isSigningIn}
              className="w-full h-12 rounded-xl border border-[#D9D9D9] bg-white hover:bg-[#FAFAFA] text-[#292929] font-semibold flex items-center justify-center gap-3 transition-colors disabled:opacity-60"
            >
              <span className="font-bold text-lg text-[#4285F4]">G</span>
              {isSigningIn ? 'Connecting…' : 'Continue with Google'}
            </button>

            <div className="flex items-center gap-3 my-7">
              <div className="h-px flex-1 bg-[#E5E7EB]" />
              <span className="text-xs text-[#9CA3AF] font-medium">OR CONTINUE WITH PHONE</span>
              <div className="h-px flex-1 bg-[#E5E7EB]" />
            </div>

            {!otpSent ? (
              <form onSubmit={handleSendOtp}>
                <label htmlFor="phone" className="block text-sm font-semibold mb-2">Phone number</label>
                <div className="flex h-12 rounded-xl border border-[#D9D9D9] bg-white overflow-hidden focus-within:border-[#009F93] focus-within:ring-4 focus-within:ring-[#009F93]/10">
                  <span className="px-3 flex items-center gap-1.5 text-sm text-[#6B7280] border-r border-[#E5E7EB]">
                    <Phone className="w-4 h-4" />
                    +91
                  </span>
                  <input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="98765 43210"
                    className="min-w-0 flex-1 px-3 outline-none text-sm"
                  />
                </div>
                <button type="submit" className="w-full h-12 mt-4 rounded-xl bg-[#009F93] hover:bg-[#00847A] text-white font-bold flex items-center justify-center gap-2 shadow-teal transition-all active:scale-[.99]">
                  Send verification code
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp}>
                <button type="button" onClick={() => setOtpSent(false)} className="text-sm text-[#009F93] font-semibold hover:underline mb-4">
                  <span className="inline-flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> Change number</span>
                </button>
                <label htmlFor="otp" className="block text-sm font-semibold mb-2">Enter verification code</label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="w-full h-12 rounded-xl border border-[#D9D9D9] bg-white px-4 text-center tracking-[0.45em] text-lg outline-none focus:border-[#009F93] focus:ring-4 focus:ring-[#009F93]/10"
                />
                <p className="text-xs text-[#6B7280] mt-2">We sent a 6-digit code to +91 {phone}.</p>
                <button type="submit" className="w-full h-12 mt-4 rounded-xl bg-[#009F93] hover:bg-[#00847A] text-white font-bold flex items-center justify-center gap-2 shadow-teal transition-all active:scale-[.99]">
                  Verify and continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {notice && <p className="mt-3 text-sm text-[#00847A]" role="status">{notice}</p>}
            {error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}

            <div className="mt-8 pt-6 border-t border-[#E5E7EB] flex items-start gap-3 text-xs text-[#6B7280] leading-relaxed">
              <LockKeyhole className="w-4 h-4 shrink-0 text-[#009F93] mt-0.5" />
              <span>By continuing, you agree to our Terms of Service and Privacy Policy.</span>
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-[#6B7280]">
              <ShieldCheck className="w-4 h-4 text-[#009F93]" />
              Your sign-in is protected with industry-standard security.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
