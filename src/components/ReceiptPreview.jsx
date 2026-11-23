import React, { useState } from 'react';
import { Eye, Sliders, Store, Calendar, FileText, ChevronRight } from 'lucide-react';

export function ReceiptPreview({ originalImage, enhancedImage, restaurantName, date, itemsCount }) {
  const [activeTab, setActiveTab] = useState('enhanced'); // 'original' | 'enhanced' | 'split'

  if (!originalImage && !enhancedImage) {
    return null;
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Receipt Vision Inspector
          </h3>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('original')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'original'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Original
          </button>
          <button
            onClick={() => setActiveTab('enhanced')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'enhanced'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Thermal Enhanced
          </button>
        </div>
      </div>

      {/* Meta tags */}
      <div className="flex items-center gap-3 text-xs text-slate-400 mb-3 flex-wrap">
        {restaurantName && (
          <span className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 font-medium text-slate-300">
            <Store className="w-3.5 h-3.5 text-emerald-400" />
            {restaurantName}
          </span>
        )}
        {itemsCount > 0 && (
          <span className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            {itemsCount} items extracted
          </span>
        )}
      </div>

      {/* Image container */}
      <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center max-h-72">
        <img
          src={activeTab === 'enhanced' && enhancedImage ? enhancedImage : (originalImage || enhancedImage)}
          alt="Receipt"
          className="object-contain max-h-72 w-full"
        />
        <div className="absolute bottom-2 right-2 bg-slate-950/80 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-mono text-slate-400 border border-slate-800">
          {activeTab === 'enhanced' ? 'Canvas Filter: 100% Gray, 150% Contrast' : 'Raw Capture'}
        </div>
      </div>
    </div>
  );
}
