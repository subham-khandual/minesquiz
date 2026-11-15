'use client';

import React from 'react';
import { Question } from '@mines-quiz/types';
import { STATUTORY_SECTIONS } from './CBTSectionTabs';

interface CBTPaletteProps {
  questions: Question[];
  currentIndex: number;
  answers: Map<string, string[]>;
  markedForReview: Set<string>;
  visitedQuestions: Set<string>;
  onSelectIndex: (index: number) => void;
}

export const CBTPalette: React.FC<CBTPaletteProps> = ({
  questions,
  currentIndex,
  answers,
  markedForReview,
  visitedQuestions,
  onSelectIndex,
}) => {
  // Determine current active section so palette shows that section's questions (e.g. 1-10)
  const currentSection = STATUTORY_SECTIONS.find(
    (sec) => currentIndex >= sec.startIndex && currentIndex <= sec.endIndex
  ) || STATUTORY_SECTIONS[0];

  const sectionQuestions = questions.slice(currentSection.startIndex, currentSection.endIndex + 1);

  // Helper function to calculate question state according to NTA CBT rules
  const getQuestionState = (qIndex: number, qId: string) => {
    const isCurrent = qIndex === currentIndex;
    const isAnswered = (answers.get(qId) || []).length > 0;
    const isMarked = markedForReview.has(qId);
    const isVisited = visitedQuestions.has(qId);

    if (isCurrent) return 'current';
    if (isAnswered && isMarked) return 'answered-marked';
    if (isMarked) return 'marked';
    if (isAnswered) return 'answered';
    if (isVisited) return 'not-answered';
    return 'unvisited';
  };

  // Helper for styling
  const getStyleForState = (state: string) => {
    switch (state) {
      case 'current':
        return 'bg-blue-600 text-white font-black shadow-md ring-2 ring-blue-400 border-transparent';
      case 'answered':
        return 'bg-emerald-600 text-white font-bold border-transparent';
      case 'not-answered':
        return 'bg-red-500 text-white font-bold border-transparent';
      case 'marked':
        return 'bg-purple-600 text-white font-bold border-transparent';
      case 'answered-marked':
        return 'bg-purple-600 text-white font-bold border-transparent relative';
      case 'unvisited':
      default:
        return 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border-slate-200';
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm p-3.5 sm:p-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100">
        <h4 className="font-poppins font-black text-xs sm:text-sm text-slate-900 tracking-tight">
          Question Palette ({currentSection.shortTitle})
        </h4>
        <span className="text-[10px] font-mono text-slate-400">
          Q. {currentSection.startIndex + 1} - {currentSection.endIndex + 1}
        </span>
      </div>

      {/* Grid of 10 question buttons (2 rows of 5) */}
      <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
        {sectionQuestions.map((q, localIdx) => {
          const absoluteIndex = currentSection.startIndex + localIdx;
          const state = getQuestionState(absoluteIndex, q.id);
          const style = getStyleForState(state);

          return (
            <button
              key={q.id}
              type="button"
              onClick={() => onSelectIndex(absoluteIndex)}
              className={`h-9 sm:h-10 rounded-xl border text-xs sm:text-sm flex items-center justify-center transition-all cursor-pointer active:scale-95 ${style}`}
              title={`Question ${absoluteIndex + 1}: ${state}`}
            >
              <span>{absoluteIndex + 1}</span>
              {state === 'answered-marked' && (
                <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-300 ring-1 ring-white" />
              )}
            </button>
          );
        })}
      </div>

      {/* NTA CBT Color Legend (Hidden on small mobile screens to save height, visible on desktop) */}
      <div className="hidden sm:grid grid-cols-2 gap-y-1.5 gap-x-2 mt-4 pt-3 border-t border-slate-100 text-[11px] font-inter text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
          <span>Current</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
          <span>Answered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
          <span>Not Answered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0" />
          <span>Marked for Review</span>
        </div>
        <div className="flex items-center gap-1.5 col-span-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-600 relative shrink-0">
            <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 rounded-full bg-emerald-400" />
          </span>
          <span>Answered & Marked</span>
        </div>
      </div>
    </div>
  );
};
