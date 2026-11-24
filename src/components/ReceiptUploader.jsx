import React, { useState, useRef } from 'react';
import { Camera, Upload, Sparkles, Sliders, AlertCircle, FileText, CheckCircle } from 'lucide-react';
import { enhanceReceiptImage } from '../utils/gemini.js';
import { api } from '../services/api.js';

export function ReceiptUploader({ onReceiptParsed, apiKey, onAddAuditEvent }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const processImageFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please upload a valid receipt image (JPG, PNG, or WEBP)');
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      // Step 1: Canvas thermal receipt enhancement
      setProcessingStep('Enhancing thermal receipt contrast & brightness via Canvas...');
      const { dataUrl: enhancedDataUrl, base64: enhancedBase64 } = await enhanceReceiptImage(file);

      // Create preview URL for original
      const originalDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });

      onAddAuditEvent?.({
        type: 'RECEIPT_UPLOADED',
        description: `Receipt image "${file.name}" uploaded (${Math.round(file.size / 1024)} KB). Canvas enhancement applied.`,
      });

      // Step 2: OCR processing through the protected backend
      setProcessingStep('Extracting line items, prices & taxes with AI Vision...');

      const parsedBill = await api.extractReceipt(enhancedBase64, 'image/jpeg');

      onAddAuditEvent?.({
        type: 'AI_EXTRACTION_COMPLETED',
        description: `AI extracted ${parsedBill.items?.length || 0} line items from ${parsedBill.restaurantName || 'Receipt'}. Total: ₹${parsedBill.printedTotal}.`,
      });

      onReceiptParsed({
        ...parsedBill,
        originalImage: originalDataUrl,
        enhancedImage: enhancedDataUrl,
      });

      setProcessingStep('Done!');
    } catch (err) {
      console.error('Receipt processing error:', err);
      if (err.message?.includes('MISSING_API_KEY')) {
        setError('Groq API Key (starts with gsk_) or Gemini API Key is required for OCR scanning. Please add your key in the header, or load the built-in Demo Bill.');
      } else {
        setError(err.message || 'Failed to process receipt image. Please try again or load the Demo Bill.');
      }
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">RECEIPT SCANNER</h2>
            <p className="text-xs text-slate-400">Upload or snap a paper / thermal restaurant bill</p>
          </div>
        </div>

        <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-slate-950 text-slate-400 border border-slate-800">
          Canvas + Groq/Gemini
        </span>
      </div>

      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
          dragActive
            ? 'border-emerald-400 bg-emerald-500/10'
            : 'border-slate-700/80 hover:border-slate-600 bg-slate-950/40 hover:bg-slate-950/60'
        } ${isProcessing ? 'pointer-events-none opacity-80' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleChange}
          className="hidden"
        />

        {isProcessing ? (
          <div className="py-4 flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-emerald-400">{processingStep}</p>
            <p className="text-xs text-slate-400 max-w-xs">
              Applying thermal filter: grayscale(100%) contrast(150%) brightness(105%) & extracting structured items
            </p>
          </div>
        ) : (
          <div className="py-3 flex flex-col items-center justify-center space-y-2.5">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
              <Upload className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">
                Click to upload receipt or drag & drop
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Supports JPG, PNG, WEBP &bull; Enhanced for faded thermal printouts
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error alert */}
      {error && (
        <div className="mt-3 p-3 rounded-lg bg-red-950/50 border border-red-500/40 text-xs text-red-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
          <div className="flex-1">
            <p className="font-semibold">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
