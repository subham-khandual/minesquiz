'use client';

import React from 'react';
import { useQuizStore } from '../stores/useQuizStore';
import { Question } from '@mines-quiz/types';

interface QuestionNavigatorProps {
  questions: Question[];
}

export const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({ questions }) => {
  const { currentIndex, setCurrentIndex, answers, markedForReview } = useQuizStore();

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
        Question Overview ({questions.length})
      </h4>

      <div className="grid grid-cols-5 gap-2">
        {questions.map((q, idx) => {
          const isCurrent = idx === currentIndex;
          const isAnswered = (answers.get(q.id) || []).length > 0;
          const isMarked = markedForReview.has(q.id);

          let buttonStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';

          if (isCurrent) {
            buttonStyle = 'ring-2 ring-blue-500 bg-blue-600 text-white font-bold border-transparent';
          } else if (isMarked) {
            buttonStyle = 'bg-amber-500 text-white font-semibold border-amber-600';
          } else if (isAnswered) {
            buttonStyle = 'bg-emerald-600 text-white font-semibold border-emerald-700';
          }

          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              className={`h-9 rounded-lg border text-xs font-medium flex items-center justify-center transition-all ${buttonStyle}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-emerald-600" />
          <span>Answered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-amber-500" />
          <span>Review</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-blue-600" />
          <span>Current</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-slate-200 dark:bg-slate-700" />
          <span>Unvisited</span>
        </div>
      </div>
    </div>
  );
};

