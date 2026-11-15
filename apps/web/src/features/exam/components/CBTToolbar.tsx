'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Bookmark, RotateCcw } from 'lucide-react';

interface CBTToolbarProps {
  currentIndex: number;
  totalQuestions: number;
  isMarkedForReview: boolean;
  hasAnswer: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onToggleMarkForReview: () => void;
  onClearResponse: () => void;
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
}) => {
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalQuestions - 1;

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2.5 select-none mt-3 sm:mt-4">
      {/* Left Cluster: Previous, Mark for Review, Clear Response */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Previous Button */}
        <button
          type="button"
          disabled={isFirst}
          onClick={onPrevious}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-poppins font-semibold border transition-all cursor-pointer ${
            isFirst
              ? 'opacity-40 cursor-not-allowed bg-slate-50 text-slate-400 border-slate-200'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:border-slate-400 active:scale-95'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        {/* Mark for Review Button */}
        <button
          type="button"
          onClick={onToggleMarkForReview}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-poppins font-semibold border transition-all cursor-pointer ${
            isMarkedForReview
              ? 'bg-purple-50 text-purple-700 border-purple-400 shadow-sm'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:border-slate-400 active:scale-95'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${isMarkedForReview ? 'fill-purple-600 text-purple-600' : 'text-slate-600'}`} />
          <span className="hidden sm:inline">
            {isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}
          </span>
          <span className="sm:hidden">
            {isMarkedForReview ? 'Marked' : 'Review'}
          </span>
        </button>

        {/* Clear Response Button */}
        <button
          type="button"
          disabled={!hasAnswer}
          onClick={onClearResponse}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-poppins font-semibold border transition-all cursor-pointer ${
            !hasAnswer
              ? 'opacity-40 cursor-not-allowed bg-slate-50 text-slate-400 border-slate-200'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:border-slate-400 active:scale-95'
          }`}
          title="Deselect chosen answer"
        >
          <RotateCcw className="w-4 h-4 text-slate-600" />
          <span className="hidden sm:inline">Clear Response</span>
          <span className="sm:hidden">Clear</span>
        </button>
      </div>

      {/* Right Cluster: Save & Next (or Submit on last question) */}
      <button
        type="button"
        onClick={onNext}
        className="flex items-center gap-1.5 px-5 sm:px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-poppins font-bold text-xs sm:text-sm shadow-md shadow-blue-600/30 active:scale-95 transition-all cursor-pointer ml-auto"
      >
        <span>{isLast ? 'Submit' : 'Save & Next'}</span>
        {!isLast && <ChevronRight className="w-4 h-4" />}
      </button>
    </div>
  );
};
