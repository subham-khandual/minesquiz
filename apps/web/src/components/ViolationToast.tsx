'use client';

import React from 'react';
import { useProctorStore } from '../stores/useProctorStore';
import { AlertCircle, X } from 'lucide-react';

export const ViolationToast: React.FC = () => {
  const { activeAlert, clearActiveAlert, violationsCount, maxAllowedViolations } = useProctorStore();

  if (!activeAlert) return null;

  return (
    <div className="fixed top-20 right-6 z-50 max-w-sm w-full bg-rose-600 text-white p-4 rounded-xl shadow-2xl border border-rose-500 animate-bounce">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-200" />
          <div>
            <h5 className="font-bold text-sm tracking-wide">Proctor Alert!</h5>
            <p className="text-xs text-rose-100 mt-1">{activeAlert}</p>
            <p className="text-[11px] font-semibold text-rose-200 mt-2 bg-rose-700/60 px-2 py-0.5 rounded inline-block">
              Violations: {violationsCount} of {maxAllowedViolations} allowed
            </p>
          </div>
        </div>
        <button
          onClick={clearActiveAlert}
          className="text-rose-200 hover:text-white p-1 rounded-md transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

