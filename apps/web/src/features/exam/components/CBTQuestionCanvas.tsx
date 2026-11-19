'use client';

import React from 'react';
import { Question } from '@mines-quiz/types';
import { AlertTriangle } from 'lucide-react';

interface CBTQuestionCanvasProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  selectedOptionIds: string[];
  onSelectOption: (questionId: string, optionId: string, isMultiple?: boolean) => void;
  isDisabled?: boolean;
}

export const CBTQuestionCanvas: React.FC<CBTQuestionCanvasProps> = ({
  question,
  currentIndex,
  totalQuestions,
  selectedOptionIds,
  onSelectOption,
  isDisabled = false,
}) => {
  const isMultiple = question.type === 'multiple-select';
  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-7 flex flex-col justify-between select-none">
      <div>
        {/* =========================================================================
            QUESTION INFO HEADER: Question X of Y | Marks: +2 | Negative: 0
            ========================================================================= */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="font-poppins font-black text-sm sm:text-lg text-slate-900">
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <span className="text-slate-400 text-xs hidden sm:inline">•</span>
            <span className="text-[11px] sm:text-xs font-inter font-medium text-slate-500 hidden sm:inline">
              {isMultiple ? 'Multiple Correct' : 'Single Choice'}
            </span>
          </div>

          {/* Marks Badges (DGMS Statutory Standard) */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono font-bold">
              Marks: +{question.marks || 1}
            </span>
            <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-xs font-mono font-bold">
              Negative: 0
            </span>
          </div>
        </div>

        {/* Lock Banner when Proctoring Notice / Strike is active */}
        {isDisabled && (
          <div className="mt-3 px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-300 flex items-center gap-2.5 text-amber-900 text-xs font-inter font-medium animate-pulse">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Options locked: Proctoring alert or strike is active. Resolve notice to resume answering.</span>
          </div>
        )}

        {/* =========================================================================
            QUESTION STATEMENT TEXT
            ========================================================================= */}
        <div
          className="my-4 sm:my-6 select-none"
          onContextMenu={(e) => e.preventDefault()}
          onCopy={(e) => e.preventDefault()}
        >
          <h2 className="text-base sm:text-xl font-poppins font-bold text-slate-900 leading-snug sm:leading-relaxed">
            {question.text}
          </h2>
        </div>

        {/* =========================================================================
            RADIO OPTIONS LIST (A, B, C, D)
            Matching reference: Soft blue fill on selected option, clean circular radio
            ========================================================================= */}
        <div className={`space-y-2.5 sm:space-y-3.5 transition-opacity ${isDisabled ? 'pointer-events-none opacity-45 select-none' : ''}`}>
          {question.options.map((opt, oIdx) => {
            const isSelected = selectedOptionIds.includes(opt.id);
            const letter = optionLetters[oIdx] || String.fromCharCode(65 + oIdx);

            return (
              <div
                key={opt.id}
                onClick={() => !isDisabled && onSelectOption(question.id, opt.id, isMultiple)}
                className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all active:scale-[0.99] min-h-[52px] sm:min-h-[58px] ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/80 text-slate-950 shadow-sm'
                    : 'border-slate-200/90 bg-white hover:bg-slate-50/80 hover:border-slate-300 text-slate-800'
                }`}
              >
                {/* Circular Radio Indicator with Tactile Letter */}
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  {isSelected ? (
                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-white" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-transparent" />
                  )}
                </div>

                {/* Option Letter Label (e.g. "A. ", "B. ") */}
                <span className={`font-poppins font-bold text-sm sm:text-base shrink-0 ${
                  isSelected ? 'text-blue-700' : 'text-slate-700'
                }`}>
                  {letter}.
                </span>

                {/* Option Text Content */}
                <span className="text-xs sm:text-base font-inter font-medium leading-relaxed text-slate-900 flex-1">
                  {opt.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
