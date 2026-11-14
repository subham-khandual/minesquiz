'use client';

import React from 'react';
import { useProctorStore } from '../stores/useProctorStore';
import { AlertCircle, AlertTriangle, X } from 'lucide-react';

export const ViolationToast: React.FC = () => {
  const {
    activeAlert,
    activeAlertSeverity,
    clearActiveAlert,
    violationsCount,
    maxAllowedViolations,
    faceAbsenceCount,
    maxAllowedFaceAbsences,
  } = useProctorStore();

  if (!activeAlert) return null;

  const isWarning = activeAlertSeverity === 'warning';

  return (
    <div
      className={`fixed top-20 right-6 z-50 max-w-sm w-full p-4 rounded-xl shadow-2xl border transition-all ${
        isWarning
          ? 'bg-amber-600 text-white border-amber-500 shadow-amber-900/30'
          : 'bg-rose-600 text-white border-rose-500 shadow-rose-900/40 animate-bounce'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          {isWarning ? (
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-200" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-200" />
          )}
          <div>
            <h5 className="font-bold text-sm tracking-wide">
              {isWarning ? 'Proctor Advisory' : 'Critical Proctor Alert!'}
            </h5>
            <p className={`text-xs mt-1 ${isWarning ? 'text-amber-100' : 'text-rose-100'}`}>
              {activeAlert}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
              {isWarning ? (
                <span className="bg-amber-700/60 text-amber-100 px-2 py-0.5 rounded">
                  Advisory Notice (No Disqualification)
                </span>
              ) : faceAbsenceCount > 0 ? (
                <span className="bg-rose-700/80 text-rose-100 px-2 py-0.5 rounded">
                  Face Absence: {faceAbsenceCount} of {maxAllowedFaceAbsences} allowed
                </span>
              ) : (
                <span className="bg-rose-700/60 text-rose-200 px-2 py-0.5 rounded">
                  Violations: {violationsCount} of {maxAllowedViolations} allowed
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={clearActiveAlert}
          className="text-white/80 hover:text-white p-1 rounded-md transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
