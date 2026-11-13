'use client';

import React, { useEffect } from 'react';
import { useQuizStore } from '../stores/useQuizStore';
import { formatSecondsToTime } from '@mines-quiz/utils';
import { Clock } from 'lucide-react';

interface QuizTimerProps {
  onTimeExpired?: () => void;
}

export const QuizTimer: React.FC<QuizTimerProps> = ({ onTimeExpired }) => {
  const { timeRemainingSeconds, decrementTimer } = useQuizStore();
  const hasInitializedRef = React.useRef(false);

  useEffect(() => {
    if (timeRemainingSeconds > 0) {
      hasInitializedRef.current = true;
    }
  }, [timeRemainingSeconds]);

  // Wall-clock resynchronization on interval and visibility change
  useEffect(() => {
    decrementTimer();

    const handleSync = () => {
      decrementTimer();
    };

    const timer = setInterval(handleSync, 1000);
    window.addEventListener('visibilitychange', handleSync);
    window.addEventListener('focus', handleSync);

    return () => {
      clearInterval(timer);
      window.removeEventListener('visibilitychange', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, [decrementTimer]);

  useEffect(() => {
    if (hasInitializedRef.current && timeRemainingSeconds === 0 && onTimeExpired) {
      onTimeExpired();
    }
  }, [timeRemainingSeconds, onTimeExpired]);

  const isLowTime = timeRemainingSeconds <= 300; // < 5 mins
  const isCritical = timeRemainingSeconds <= 60; // < 1 min

  return (
    <div
      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border font-mono font-bold text-sm tracking-wide transition-colors ${
        isCritical
          ? 'bg-rose-950/60 border-rose-500 text-rose-300 animate-pulse'
          : isLowTime
          ? 'bg-amber-950/50 border-amber-500 text-amber-300'
          : 'bg-slate-800 border-slate-700 text-slate-200'
      }`}
    >
      <Clock className={`w-4 h-4 ${isCritical ? 'text-rose-400' : 'text-blue-400'}`} />
      <span>{formatSecondsToTime(timeRemainingSeconds)}</span>
    </div>
  );
};

