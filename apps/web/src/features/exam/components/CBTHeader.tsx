'use client';

import React from 'react';
import { Clock, Send, ShieldCheck } from 'lucide-react';

interface CBTHeaderProps {
  candidateName: string;
  rollNumber: string;
  examTitle: string;
  totalQuestions: number;
  totalMarks: number;
  timeRemainingSeconds: number;
  onSubmitClick: () => void;
}

export const CBTHeader: React.FC<CBTHeaderProps> = ({
  candidateName,
  rollNumber,
  examTitle,
  totalQuestions,
  totalMarks,
  timeRemainingSeconds,
  onSubmitClick,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formattedTime = formatTime(timeRemainingSeconds);
  const isUrgent = timeRemainingSeconds < 300; // Under 5 minutes

  return (
    <>
      {/* =========================================================================
          DESKTOP / LAPTOP HEADER (lg:flex)
          Deep Navy #0A192F with Candidate Meta, Exam Meta, Countdown, & Red Submit
          ========================================================================= */}
      <header className="hidden lg:flex h-[68px] w-full bg-[#0A192F] text-white px-6 items-center justify-between border-b border-slate-800 shadow-md sticky top-0 z-40 select-none">
        {/* Left: Brand Identity with Official Logo Image */}
        <div className="flex items-center gap-3 shrink-0">
          <img
            src="/images/minesquiz-logo.png"
            alt="MinesQuiz Official Logo"
            className="w-10 h-10 object-contain drop-shadow-md"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-poppins font-black text-lg tracking-tight text-white">
                Mines<span className="text-blue-400">Quiz</span>
              </span>
              <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 font-mono text-[10px] font-bold uppercase tracking-wider border border-blue-400/30">
                CBT
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-inter tracking-wide">
              Secure · Fair · Professional
            </span>
          </div>
        </div>

        {/* Center-Left: Candidate Info Block */}
        <div className="flex items-center gap-6 px-4 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
          <div className="flex flex-col">
            <span className="text-slate-400 font-inter text-[11px]">Candidate:</span>
            <span className="font-poppins font-bold text-white text-xs truncate max-w-[170px]" title={candidateName}>
              {candidateName}
            </span>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div className="flex flex-col">
            <span className="text-slate-400 font-inter text-[11px]">Roll No:</span>
            <span className="font-mono font-bold text-blue-400 text-xs">
              {rollNumber}
            </span>
          </div>
        </div>

        {/* Center-Right: Exam Info Block */}
        <div className="flex items-center gap-6 px-4 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
          <div className="flex flex-col">
            <span className="text-slate-400 font-inter text-[11px]">Exam:</span>
            <span className="font-poppins font-bold text-slate-200 text-xs truncate max-w-[190px]" title={examTitle}>
              {examTitle}
            </span>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div className="flex flex-col">
            <span className="text-slate-400 font-inter text-[11px]">Total:</span>
            <span className="font-inter font-semibold text-slate-300 text-xs">
              {totalQuestions} Questions | {totalMarks} Marks
            </span>
          </div>
        </div>

        {/* Right: Timer Widget & Submit Button */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Digital Timer */}
          <div className={`flex items-center gap-2.5 px-4 py-1.5 rounded-xl border shadow-inner transition-colors ${
            isUrgent
              ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
              : 'bg-slate-900/90 border-slate-700 text-slate-100'
          }`}>
            <Clock className={`w-4 h-4 ${isUrgent ? 'text-rose-400' : 'text-blue-400'}`} />
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Time Remaining</span>
              <span className="font-mono font-black text-lg tracking-wider text-white">
                {formattedTime}
              </span>
            </div>
          </div>

          {/* Red Submit Button */}
          <button
            type="button"
            onClick={onSubmitClick}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-poppins font-bold text-sm shadow-lg shadow-red-600/30 active:scale-95 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Submit Test</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          MOBILE VIEWPORT HEADER (lg:hidden)
          Unified Single 44px Bar: NO Hamburger Menu, NO Double-Row Timer Clutter.
          Maximum Vertical Space Preserved for Exam Questions.
          ========================================================================= */}
      <header className="lg:hidden h-11 w-full bg-[#0A192F] text-white px-3 flex items-center justify-between border-b border-slate-800 sticky top-0 z-40 select-none shadow-sm">
        {/* Left: Compact Exam Subject Badge with Official Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <img
            src="/images/minesquiz-logo.png"
            alt="MinesQuiz Official Logo"
            className="w-7 h-7 object-contain drop-shadow-sm shrink-0"
          />
          <div className="flex flex-col leading-none">
            <span className="font-poppins font-bold text-xs text-white truncate max-w-[110px]" title={examTitle}>
              {examTitle.replace('DGMS ', '').replace('Statutory ', '')}
            </span>
            <span className="font-mono text-[9px] text-blue-400">
              {rollNumber}
            </span>
          </div>
        </div>

        {/* Center: Live Digital Countdown Box */}
        <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border font-mono font-black text-xs shadow-xs ${
          isUrgent
            ? 'bg-rose-950/90 border-rose-500 text-rose-300 animate-pulse'
            : 'bg-slate-900 border-slate-700 text-white'
        }`}>
          <Clock className={`w-3 h-3 ${isUrgent ? 'text-rose-400' : 'text-blue-400'}`} />
          <span>{formattedTime}</span>
        </div>

        {/* Right: Red Submit Button */}
        <button
          type="button"
          onClick={onSubmitClick}
          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-poppins font-bold text-xs shadow-md shadow-red-600/30 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Send className="w-3 h-3" />
          <span>Submit</span>
        </button>
      </header>
    </>
  );
};
