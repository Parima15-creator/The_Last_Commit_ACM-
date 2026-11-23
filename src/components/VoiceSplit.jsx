import React, { useState } from 'react';
import { Mic, MicOff, Sparkles, Volume2, Check, X, ArrowRight, CornerDownLeft, AlertCircle } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition.js';
import { mapVoiceToItems } from '../utils/gemini.js';
import { SAMPLE_VOICE_PROMPTS } from '../utils/voiceRecognition.js';

export function VoiceSplit({ items, people, onApplyAssignments, apiKey, onAddAuditEvent }) {
  const {
    isListening,
    transcript,
    interimTranscript,
    error: speechError,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript,
  } = useSpeechRecognition();

  const [isProcessing, setIsProcessing] = useState(false);
  const [proposedChanges, setProposedChanges] = useState(null);
  const [customText, setCustomText] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const activeTranscript = transcript + (interimTranscript ? ` ${interimTranscript}` : '');

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      setProposedChanges(null);
      resetTranscript();
      startListening();
    }
  };

  const handleProcessTranscript = async (textToProcess) => {
    const text = (textToProcess || activeTranscript || customText).trim();
    if (!text) return;

    setIsProcessing(true);
    setProposedChanges(null);

    try {
      const result = await mapVoiceToItems(text, items, apiKey);
      setProposedChanges({
        transcript: text,
        people: result.people || [],
        assignments: result.assignments || {},
      });
    } catch (err) {
      console.error('Voice processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmChanges = () => {
    if (!proposedChanges) return;

    onApplyAssignments(proposedChanges);
    onAddAuditEvent?.({
      type: 'VOICE_TRANSCRIPTION_APPLIED',
      description: `Voice split applied: "${proposedChanges.transcript}". Members: ${proposedChanges.people.join(', ')}.`,
    });

    setProposedChanges(null);
    resetTranscript();
    setCustomText('');
  };

  const handleRejectChanges = () => {
    setProposedChanges(null);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
      {/* Background glow when recording */}
      {isListening && (
        <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-xl transition-colors ${
              isListening
                ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}
          >
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">VOICE-FIRST SPLIT</h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Signature Feature
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Speak naturally who ate or shared what in English or Hinglish
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowManualInput(!showManualInput)}
          className="text-xs text-slate-400 hover:text-emerald-400 transition-colors underline cursor-pointer"
        >
          {showManualInput ? 'Hide Text Box' : 'Type Instead'}
        </button>
      </div>

      {/* Main Speak Button & Visualizer */}
      <div className="flex flex-col items-center justify-center py-4 px-2">
        <button
          onClick={handleToggleListening}
          className={`group relative flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-base transition-all duration-300 shadow-xl cursor-pointer ${
            isListening
              ? 'bg-red-600 hover:bg-red-500 text-white animate-mic-pulse glow-red'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 glow-emerald active:scale-95'
          }`}
        >
          {isListening ? (
            <>
              <div className="flex items-center gap-1 mr-1">
                <span className="wave-bar w-1 bg-white rounded-full" />
                <span className="wave-bar w-1 bg-white rounded-full" />
                <span className="wave-bar w-1 bg-white rounded-full" />
                <span className="wave-bar w-1 bg-white rounded-full" />
              </div>
              <MicOff className="w-5 h-5" />
              <span>Listening... Tap to Stop</span>
            </>
          ) : (
            <>
              <Mic className="w-5 h-5 text-slate-950 group-hover:scale-110 transition-transform" />
              <span className="tracking-wide">Speak Split</span>
            </>
          )}
        </button>

        {/* Live speech feedback */}
        {(isListening || activeTranscript) && (
          <div className="w-full mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center animate-fade-in">
            <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
              {isListening ? 'Live Transcription (en-IN)' : 'Captured Speech'}
            </span>
            <p className="text-sm text-emerald-300 font-medium italic">
              "{activeTranscript || 'Listening for names and dishes...'}"
            </p>
            {interimTranscript && (
              <span className="text-xs text-slate-400 italic"> {interimTranscript}</span>
            )}

            {!isListening && activeTranscript && !proposedChanges && (
              <div className="mt-3 flex items-center justify-center gap-2">
                <button
                  onClick={() => handleProcessTranscript()}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-500/20"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>AI Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Assign with AI</span>
                    </>
                  )}
                </button>
                <button
                  onClick={resetTranscript}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        )}

        {/* Browser speech error */}
        {speechError && (
          <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2 max-w-md">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{speechError}</span>
          </div>
        )}
      </div>

      {/* Manual text input fallback */}
      {showManualInput && (
        <div className="mt-2 pt-3 border-t border-slate-800">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Describe who ate what (Natural Language):
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="e.g. I had biryani, Rohan and I shared paneer tikka, Priya had cold coffee..."
              onKeyDown={(e) => e.key === 'Enter' && handleProcessTranscript(customText)}
              className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={() => handleProcessTranscript(customText)}
              disabled={isProcessing || !customText.trim()}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Map</span>
            </button>
          </div>
        </div>
      )}

      {/* Sample Voice Prompts for 1-Click Testing */}
      <div className="mt-4 pt-3 border-t border-slate-800/80">
        <span className="text-[11px] font-semibold text-slate-400 block mb-2">
          Or try a sample voice statement:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {SAMPLE_VOICE_PROMPTS.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => {
                setTranscript(sample);
                handleProcessTranscript(sample);
              }}
              className="text-[11px] px-2.5 py-1 rounded-md bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-800 hover:border-slate-700 transition-all text-left truncate max-w-full cursor-pointer"
              title={sample}
            >
              &ldquo;{sample}&rdquo;
            </button>
          ))}
        </div>
      </div>

      {/* Proposed Changes Confirmation Dialog */}
      {proposedChanges && (
        <div className="mt-5 p-4 rounded-xl bg-slate-950 border border-emerald-500/40 glow-emerald">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Proposed Voice Assignments
              </h4>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Review before applying</span>
          </div>

          <p className="text-xs text-slate-300 italic mb-3">
            &ldquo;{proposedChanges.transcript}&rdquo;
          </p>

          <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-1">
            {items.map((item) => {
              const assigned = proposedChanges.assignments[item.id] || [];
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900 border border-slate-800"
                >
                  <span className="font-medium text-slate-200">{item.name}</span>
                  <div className="flex items-center gap-1.5">
                    {assigned.length > 0 ? (
                      assigned.map((p, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        >
                          {p}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 text-[10px] italic">Unassigned</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={handleRejectChanges}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
            <button
              onClick={handleConfirmChanges}
              className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Assignments</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
