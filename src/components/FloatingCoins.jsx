import React from 'react';

export function FloatingCoins({ className = '' }) {
  return (
    <div className={`pointer-events-none select-none relative ${className}`}>
      {/* Golden Coin 1 */}
      <div className="absolute top-2 -left-6 animate-float-coin">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFD83D] to-[#FF8A1E] p-0.5 shadow-warm">
          <div className="w-full h-full rounded-full bg-[#FFD83D] flex items-center justify-center font-bold text-sm text-[#292929] border border-white/50">
            ₹
          </div>
        </div>
      </div>

      {/* Golden Coin 2 */}
      <div className="absolute bottom-6 right-2 animate-float-coin-slow">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFC928] to-[#FF8A1E] p-0.5 shadow-warm">
          <div className="w-full h-full rounded-full bg-[#FFC928] flex items-center justify-center font-bold text-xs text-[#292929] border border-white/50">
            ₹
          </div>
        </div>
      </div>

      {/* Floating Sparkle / Food Tag */}
      <div className="absolute -top-6 right-10 animate-float-coin">
        <span className="text-xl">🍕</span>
      </div>
      <div className="absolute bottom-0 -left-4 animate-float-coin-slow">
        <span className="text-xl">☕</span>
      </div>
    </div>
  );
}
