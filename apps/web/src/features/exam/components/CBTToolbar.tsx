'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Bookmark, RotateCcw, Send } from 'lucide-react';

interface CBTToolbarProps {
  currentIndex: number;
  totalQuestions: number;
  isMarkedForReview: boolean;
  hasAnswer: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onToggleMarkForReview: () => void;
  onClearResponse: () => void;
  isDisabled?: boolean;
}

export const CBTToolbar: React.FC<CBTToolbarProps> = ({
  currentIndex,
  totalQuestions,
  isMarkedForReview,
  hasAnswer,
  onPrevious,
  onNext,
  onToggleMarkForReview,
  onClearResponse,
  isDisabled = false,
}) => {
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalQuestions - 1;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-3 py-2.5 sm:static sm:z-auto sm:bg-white sm:rounded-2xl sm:border sm:shadow-sm sm:p-4 sm:mt-4 select-none transition-opacity ${
        isDisabled ? 'pointer-events-none opacity-45 select-none' : ''
      }`}
    >
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2.5">
        {/* Left Cluster: Previous, Mark for Review, Clear Response */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Previous Button */}
          <button
            type="button"
            disabled={isDisabled || isFirst}
            onClick={onPrevious}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-poppins font-semibold border transition-all cursor-pointer ${
              isDisabled || isFirst
                ? 'opacity-40 cursor-not-allowed bg-slate-50 text-slate-400 border-slate-200'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:border-slate-400 active:scale-95'
            }`}
            title="Go to previous question"
          >
            <ChevronLeft className="w-4 h-4 shrink-0" />
            <span className="hidden xs:inline sm:inline">Prev</span>
          </button>

          {/* Mark for Review Button */}
          <button
            type="button"
            disabled={isDisabled}
            onClick={onToggleMarkForReview}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-poppins font-semibold border transition-all cursor-pointer ${
              isMarkedForReview
                ? 'bg-purple-50 text-purple-700 border-purple-400 shadow-sm'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:border-slate-400 active:scale-95'
            }`}
            title="Mark question for review later"
          >
            <Bookmark
              className={`w-4 h-4 shrink-0 ${
                isMarkedForReview ? 'fill-purple-600 text-purple-600' : 'text-slate-600'
              }`}
            />
            <span className="hidden sm:inline">
              {isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}
            </span>
            <span className="sm:hidden text-[11px]">
              {isMarkedForReview ? 'Marked' : 'Review'}
            </span>
          </button>

          {/* Clear Response Button */}
          <button
            type="button"
            disabled={isDisabled || !hasAnswer}
            onClick={onClearResponse}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-poppins font-semibold border transition-all cursor-pointer ${
              isDisabled || !hasAnswer
                ? 'opacity-40 cursor-not-allowed bg-slate-50 text-slate-400 border-slate-200'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:border-slate-400 active:scale-95'
            }`}
            title="Deselect chosen answer"
          >
            <RotateCcw className="w-4 h-4 shrink-0 text-slate-600" />
            <span className="hidden sm:inline">Clear Response</span>
            <span className="sm:hidden text-[11px]">Clear</span>
          </button>
        </div>

        {/* Right Cluster: Save & Next (or Submit on last question) */}
        <button
          type="button"
          disabled={isDisabled}
          onClick={onNext}
          className={`flex items-center justify-center gap-1.5 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-white font-poppins font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer ml-auto shrink-0 ${
            isDisabled
              ? 'opacity-50 cursor-not-allowed bg-slate-400'
              : isLast
              ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30 active:scale-95'
              : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30 active:scale-95'
          }`}
        >
          <span>{isLast ? 'Submit Test' : 'Save & Next'}</span>
          {isLast ? <Send className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
        </button>
      </div>
    </div>
  );
};
