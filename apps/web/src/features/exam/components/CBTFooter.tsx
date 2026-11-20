'use client';

import React from 'react';
import { Info, ShieldCheck } from 'lucide-react';

export const CBTFooter: React.FC = () => {
  return (
    <footer className="w-full bg-[#0A192F] text-slate-400 border-t border-slate-800 px-4 sm:px-6 py-2.5 pb-16 sm:pb-2.5 flex items-center justify-between text-xs select-none mt-auto">
      <div className="flex items-center gap-2 text-slate-300 font-inter">
        <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <span className="text-[11px] sm:text-xs">
          Note: Do not switch tabs or use any unfair means during the examination.
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-slate-400 font-inter shrink-0">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-[10px] sm:text-xs font-mono font-medium">
          MinesQuiz v1.0
        </span>
      </div>
    </footer>
  );
};
