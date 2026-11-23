import React, { useState } from 'react';
import { Receipt, Sparkles, RefreshCw, Key, ShieldCheck, HelpCircle, Zap } from 'lucide-react';
import { getActiveAiConfig } from '../utils/gemini.js';

export function Header({ onLoadDemo, onReset, apiKey, onSaveApiKey, onOpenGuide }) {
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState(apiKey || '');

  const activeConfig = getActiveAiConfig(apiKey);

  const handleSaveKey = (e) => {
    e.preventDefault();
    onSaveApiKey(keyInput.trim());
    setShowKeyModal(false);
  };

  const isGroq = activeConfig.provider === 'groq';
  const isGemini = activeConfig.provider === 'gemini';

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Receipt className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5 font-mono">
                  JHOL<span className="text-emerald-400">FREE</span>
                </h1>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {isGroq ? 'Groq LLaMA 3.2 Vision' : 'AI Vision + Voice'}
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Snap. Speak. Settle. <span className="text-emerald-400 font-medium">No Jhol. No Confusion.</span>
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={onLoadDemo}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-emerald-500/10 active:scale-95 cursor-pointer"
              title="Populate ₹966 Spice Garden demo bill"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Load Demo Bill (₹966)</span>
            </button>

            <button
              onClick={() => {
                setKeyInput(apiKey || '');
                setShowKeyModal(true);
              }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                isGroq
                  ? 'bg-orange-500/15 border-orange-500/30 text-orange-400 hover:bg-orange-500/25'
                  : isGemini
                  ? 'bg-slate-900 border-emerald-500/30 text-emerald-400 hover:bg-slate-800'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
              }`}
              title="Configure Groq or Gemini API Key"
            >
              {isGroq ? (
                <>
                  <Zap className="w-3.5 h-3.5 text-orange-400" />
                  <span>Groq Active</span>
                </>
              ) : isGemini ? (
                <>
                  <Key className="w-3.5 h-3.5" />
                  <span>Gemini Active</span>
                </>
              ) : (
                <>
                  <Key className="w-3.5 h-3.5" />
                  <span>API Key</span>
                </>
              )}
            </button>

            <button
              onClick={onOpenGuide}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors cursor-pointer"
              title="How JholFree Works"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            <button
              onClick={onReset}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-red-400 border border-slate-800 transition-colors cursor-pointer"
              title="Reset Bill"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-400" />
              Configure AI API Key (Groq / Gemini)
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Use your <strong className="text-orange-400">Groq API Key</strong> (starts with <code className="text-slate-200 font-mono">gsk_...</code>) for ultra-fast LLaMA 3.2 Vision thermal receipt OCR and LLaMA 3.3 voice mapping, or Google Gemini API Key.
            </p>

            <form onSubmit={handleSaveKey} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="gsk_... or AIzaSy..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500 font-mono"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Keys starting with <code className="text-orange-400">gsk_</code> will automatically use Groq LPU.
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-orange-400 hover:underline flex items-center gap-1"
                >
                  Get key from Groq Console &rarr;
                </a>
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-emerald-400 hover:underline"
                >
                  Google AI Studio &rarr;
                </a>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-bold text-xs cursor-pointer shadow-md shadow-orange-500/20"
                >
                  Save API Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
