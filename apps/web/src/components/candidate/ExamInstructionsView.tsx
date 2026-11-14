'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Wifi,
  Laptop,
  FileText,
  Cloud,
  Clock,
  Monitor,
  UserX,
  Smartphone,
  EyeOff,
  AlertTriangle,
  ShieldCheck,
  Check,
  X,
  Info,
  Play,
  ChevronRight,
} from 'lucide-react';

interface ExamInstructionsViewProps {
  onStartExam?: (mode: 'mock' | 'live') => void;
  defaultMode?: 'mock' | 'live';
  subjectTitle?: string;
  isStarting?: boolean;
}

export const ExamInstructionsView: React.FC<ExamInstructionsViewProps> = ({
  onStartExam,
  defaultMode = 'mock',
  subjectTitle,
  isStarting = false,
}) => {
  const [hasAgreed, setHasAgreed] = useState<boolean>(false);
  const [selectedMode, setSelectedMode] = useState<'mock' | 'live'>(defaultMode);

  const handleLaunch = () => {
    if (!hasAgreed || isStarting) return;
    if (onStartExam) {
      onStartExam(selectedMode);
    }
  };

  return (
    <div className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-[#F5F7FF] via-[#FFFFFF] to-[#EFF3FE] p-4 sm:p-6 md:p-8 lg:p-10 border border-indigo-100/80 shadow-xl shadow-indigo-100/40 text-slate-900 font-inter">
      {/* Background Ambient Lighting Spheres */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-300/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-purple-300/20 blur-3xl"
      />

      {/* ========================================================= */}
      {/* 1. TOP HEADER BAR                                         */}
      {/* ========================================================= */}
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-6">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white shadow-md shadow-indigo-600/30">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6"
            >
              <path d="M3 20L9 4L12 13L15 4L21 20" />
            </svg>
          </div>
          <div className="h-6 w-px bg-slate-300 hidden sm:block" />
          <div className="flex flex-col">
            <span className="font-poppins font-black text-xl sm:text-2xl tracking-tight text-indigo-950">
              Mines Quiz
            </span>
            {subjectTitle && (
              <span className="text-xs font-semibold text-slate-500 max-w-[240px] sm:max-w-xs truncate">
                {subjectTitle}
              </span>
            )}
          </div>
        </div>

        {/* Security Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/90 border border-emerald-300 text-emerald-800 text-xs sm:text-sm font-semibold shadow-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Secure Exam Environment</span>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. CENTER TITLE & SUBTITLE BLOCK                          */}
      {/* ========================================================= */}
      <div className="relative z-10 text-center my-4 sm:my-6 space-y-1 sm:space-y-2">
        <div className="flex items-center justify-center gap-3">
          <span className="w-8 sm:w-16 h-px bg-slate-300/90" />
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
            ONLINE EXAMINATION
          </span>
          <span className="w-8 sm:w-16 h-px bg-slate-300/90" />
        </div>

        <h1 className="font-poppins text-2xl sm:text-4xl md:text-5xl font-black text-indigo-950 tracking-tight">
          Exam Instructions
        </h1>

        <p className="font-inter text-xs sm:text-sm md:text-base text-slate-600 font-medium max-w-xl mx-auto">
          Read the guidelines carefully before starting your exam
        </p>
      </div>

      {/* ========================================================= */}
      {/* 3. THREE-COLUMN PANORAMIC CARDS GRID                      */}
      {/* ========================================================= */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch mt-6">
        {/* COLUMN 1: 3D Visual Hero + Important Card (lg:col-span-4) */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          {/* 3D Visual Illustration Container */}
          <div className="relative flex-1 flex items-center justify-center min-h-[220px] sm:min-h-[260px] p-4 rounded-3xl bg-gradient-to-br from-indigo-50/60 to-purple-50/40 border border-indigo-100/60 shadow-xs">
            <div className="relative w-full h-full max-w-[340px] flex items-center justify-center">
              <Image
                src="/images/exam-3d-hero.png"
                alt="Mines Quiz Examination Setup"
                width={360}
                height={278}
                priority
                className="w-full h-auto max-h-[240px] object-contain drop-shadow-lg"
              />
            </div>
          </div>

          {/* Important Notice Card */}
          <div className="rounded-2xl bg-white/95 border border-indigo-100 p-4 sm:p-4.5 shadow-sm flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
              <Info className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-poppins font-bold text-sm text-indigo-950">Important</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-snug">
                Follow these instructions to ensure a smooth and fair exam experience.
              </p>
            </div>
          </div>
        </div>

        {/* COLUMN 2: Exam Guidelines (Green Card, lg:col-span-4) */}
        <div className="lg:col-span-4 rounded-3xl bg-white/95 border border-slate-200/90 p-5 sm:p-6 md:p-7 shadow-md shadow-slate-200/50 flex flex-col justify-between">
          <div>
            {/* Green Header Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500 text-white font-poppins font-bold text-sm sm:text-base shadow-xs mb-5">
              <div className="w-4 h-4 rounded-full bg-white text-emerald-600 flex items-center justify-center">
                <Check className="w-3 h-3 stroke-[3.5]" />
              </div>
              <span>Exam Guidelines</span>
            </div>

            {/* 5 Guidelines List */}
            <ul className="space-y-4">
              {/* Item 1: Stable Internet */}
              <li className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <Wifi className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-slate-800 leading-snug">
                  Ensure a stable internet connection throughout the exam.
                </span>
              </li>

              {/* Item 2: Face on Webcam */}
              <li className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <Laptop className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-slate-800 leading-snug">
                  Keep your face clearly visible via webcam.
                </span>
              </li>

              {/* Item 3: Read Questions Carefully */}
              <li className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <FileText className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-slate-800 leading-snug">
                  Read each question carefully before selecting an answer.
                </span>
              </li>

              {/* Item 4: Auto-saved regularly */}
              <li className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <Cloud className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-slate-800 leading-snug">
                  Your answers will be auto-saved regularly.
                </span>
              </li>

              {/* Item 5: Complete within time */}
              <li className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <Clock className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-slate-800 leading-snug">
                  Complete the exam within the time limit.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* COLUMN 3: Do Not (Red Card, lg:col-span-4) */}
        <div className="lg:col-span-4 rounded-3xl bg-white/95 border border-slate-200/90 p-5 sm:p-6 md:p-7 shadow-md shadow-slate-200/50 flex flex-col justify-between">
          <div>
            {/* Red Header Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500 text-white font-poppins font-bold text-sm sm:text-base shadow-xs mb-5">
              <div className="w-4 h-4 rounded-full bg-white text-rose-600 flex items-center justify-center">
                <X className="w-3 h-3 stroke-[3.5]" />
              </div>
              <span>Do Not</span>
            </div>

            {/* 5 Restrictions List */}
            <ul className="space-y-4">
              {/* Item 1: Window Switch Prohibited */}
              <li className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center shrink-0 shadow-2xs">
                  <Monitor className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-slate-800 leading-snug">
                  Do not switch or minimize the browser window.
                </span>
              </li>

              {/* Item 2: No Other Person */}
              <li className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center shrink-0 shadow-2xs">
                  <UserX className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-slate-800 leading-snug">
                  Do not allow any other person in the room.
                </span>
              </li>

              {/* Item 3: No Phones or Gadgets */}
              <li className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center shrink-0 shadow-2xs">
                  <Smartphone className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-slate-800 leading-snug">
                  Do not use mobile phones or other gadgets.
                </span>
              </li>

              {/* Item 4: Do Not Look Away */}
              <li className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center shrink-0 shadow-2xs">
                  <EyeOff className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-slate-800 leading-snug">
                  Do not look away from the screen for long.
                </span>
              </li>

              {/* Item 5: Unfair Means Prohibited */}
              <li className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center shrink-0 shadow-2xs">
                  <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-slate-800 leading-snug">
                  Do not try to cheat or use unfair means.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. BOTTOM ACTION & CONFIRMATION BAR                       */}
      {/* ========================================================= */}
      <footer className="relative z-10 w-full bg-white/90 backdrop-blur-md rounded-2xl sm:rounded-full p-3 sm:px-6 sm:py-3.5 border border-indigo-100 shadow-lg shadow-indigo-100/50 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 sm:mt-8">
        {/* Checkbox Agreement */}
        <label className="flex items-center gap-3 cursor-pointer select-none group w-full sm:w-auto">
          <input
            type="checkbox"
            checked={hasAgreed}
            onChange={(e) => setHasAgreed(e.target.checked)}
            className="w-5 h-5 rounded-md border-2 border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-all group-hover:border-indigo-500"
          />
          <span className="font-inter text-xs sm:text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
            I have read and understood the instructions above.
          </span>
        </label>

        {/* Action Controls: Mode Choice + Start Exam Pill */}
        <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
          {/* Mode Switcher (Optional Quick Selector) */}
          <div className="hidden sm:inline-flex items-center bg-slate-100 p-1 rounded-full text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSelectedMode('mock')}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                selectedMode === 'mock'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Mock Practice
            </button>
            <button
              type="button"
              onClick={() => setSelectedMode('live')}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                selectedMode === 'live'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Live Proctored
            </button>
          </div>

          {/* Start Exam Pill Button */}
          <button
            type="button"
            disabled={!hasAgreed || isStarting}
            onClick={handleLaunch}
            className={`w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-full font-poppins font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all duration-200 shadow-md ${
              hasAgreed && !isStarting
                ? 'bg-gradient-to-r from-purple-700 via-indigo-600 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white shadow-indigo-600/30 active:scale-98 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            <Play className="w-4 h-4 fill-current shrink-0" />
            <span>{isStarting ? 'Preparing Exam...' : 'Start Exam'}</span>
            <ChevronRight className="w-4 h-4 stroke-[3] shrink-0" />
          </button>
        </div>
      </footer>
    </div>
  );
};
