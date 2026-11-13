'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { useQuizStore } from '../../../stores/useQuizStore';
import { useProctorStore } from '../../../stores/useProctorStore';
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  Trophy,
  Lock,
  RotateCcw,
  BookOpen,
  Filter,
  Check,
  X,
  FileText,
  AlertTriangle,
  Clock,
  Sparkles,
  Award,
  ChevronRight
} from 'lucide-react';
import { Question, UserAnswer, Quiz, Attempt } from '@mines-quiz/types';
import { SocialFooter } from '../../../components/common/SocialFooter';

interface CachedReviewSession {
  quiz: Quiz;
  attempt: Attempt;
  answers: UserAnswer[];
  masterQuestions: Question[];
  mode: 'mock' | 'live';
}

export default function ResultsPage() {
  const router = useRouter();
  const params = useParams();
  const attemptId = (params?.attemptId as string) || '';

  const { currentQuiz, activeAttempt, answers: storeAnswersMap, masterQuestionsForScoring } = useQuizStore();
  const { violationsCount, maxAllowedViolations } = useProctorStore();

  const [mounted, setMounted] = useState(false);
  const [cachedSession, setCachedSession] = useState<CachedReviewSession | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'mistakes' | 'correct'>('all');

  useEffect(() => {
    setMounted(true);

    if (typeof window !== 'undefined' && attemptId) {
      try {
        const stored = localStorage.getItem(`mines_session_review_${attemptId}`);
        if (stored) {
          const parsed = JSON.parse(stored) as CachedReviewSession;
          setCachedSession(parsed);
        }
      } catch (err) {
        console.warn('Could not parse cached session review:', err);
      }
    }
  }, [attemptId]);

  // Resolve session quiz and questions
  const quiz = cachedSession?.quiz || currentQuiz;
  const attempt = cachedSession?.attempt || activeAttempt;
  const questions: Question[] = cachedSession?.masterQuestions || masterQuestionsForScoring || quiz?.questions || [];

  // Determine mode: mock vs live
  const isMock = Boolean(
    cachedSession?.mode === 'mock' ||
    quiz?.id?.includes('-mock') ||
    attempt?.id?.includes('mock') ||
    !quiz?.proctoringEnabled
  );

  // Map answers: questionId -> array of selected option IDs
  const answersMap = useMemo(() => {
    const map = new Map<string, string[]>();

    if (cachedSession?.answers) {
      cachedSession.answers.forEach((ans) => {
        map.set(ans.questionId, ans.selectedOptionIds);
      });
    } else if (storeAnswersMap && storeAnswersMap.size > 0) {
      storeAnswersMap.forEach((val, key) => {
        map.set(key, val);
      });
    }
    return map;
  }, [cachedSession, storeAnswersMap]);

  // Compute scoring analysis
  const scoreAnalysis = useMemo(() => {
    if (!questions || questions.length === 0) {
      return {
        totalQuestions: 0,
        answeredCount: 0,
        correctCount: 0,
        incorrectCount: 0,
        skippedCount: 0,
        totalMarks: 0,
        marksObtained: 0,
        percentage: 0,
        isPassed: false,
      };
    }

    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;
    let marksObtained = 0;
    const totalMarks = questions.length * 1;

    questions.forEach((q) => {
      const selected = answersMap.get(q.id) || [];
      const correctOptionIds = q.correctOptionIds || [];

      if (selected.length === 0) {
        skippedCount += 1;
      } else {
        const hasValidKey = correctOptionIds.length > 0;
        const isCorrect =
          hasValidKey &&
          selected.length === correctOptionIds.length &&
          selected.every((id) => correctOptionIds.includes(id));

        if (isCorrect) {
          correctCount += 1;
          marksObtained += q.marks || 1;
        } else {
          incorrectCount += 1;
          marksObtained = Math.max(0, marksObtained - (q.negativeMarks || 0));
        }
      }
    });

    const totalQuestions = questions.length;
    const answeredCount = correctCount + incorrectCount;
    const percentage = totalQuestions > 0 ? Math.round((marksObtained / totalMarks) * 1000) / 10 : 0;
    const isPassed = percentage >= 60.0;

    return {
      totalQuestions,
      answeredCount,
      correctCount,
      incorrectCount,
      skippedCount,
      totalMarks,
      marksObtained,
      percentage,
      isPassed,
    };
  }, [questions, answersMap]);

  // Filter questions for Mock Review
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const selected = answersMap.get(q.id) || [];
      const correctOptionIds = q.correctOptionIds || (q.options.length > 0 ? [q.options[0].id] : []);
      const isCorrect =
        selected.length > 0 &&
        selected.length === correctOptionIds.length &&
        selected.every((id) => correctOptionIds.includes(id));

      if (activeFilter === 'correct') return isCorrect;
      if (activeFilter === 'mistakes') return !isCorrect && selected.length > 0;
      return true;
    });
  }, [questions, answersMap, activeFilter]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#090D16] flex items-center justify-center text-white">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // =========================================================
  // VIEW 1: MOCK TEST (INSTANT QUESTION & ANSWER KEY REVIEW)
  // =========================================================
  if (isMock) {
    return (
      <div className="min-h-screen bg-[#090D16] text-slate-100 font-inter antialiased flex flex-col selection:bg-blue-600 selection:text-white">
        
        {/* Top Navbar Header */}
        <header className="h-16 bg-[#090D16]/90 backdrop-blur-md border-b border-slate-800/80 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Link
              href="/candidate"
              className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-all border border-slate-700/60"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex flex-col">
              <span className="font-poppins font-black text-sm text-white tracking-tight">
                Mock Practice Scorecard & Solution Sheet
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Session ID: {attemptId || 'mock-practice'}
              </span>
            </div>
          </div>

          <Link
            href="/candidate"
            className="text-xs font-inter font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          >
            Candidate Portal
          </Link>
        </header>

        {/* Main Content Workspace */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-7">
          
          {/* Hero Scorecard Banner (Obsidian & Emerald Aurora Gradient) */}
          <div
            className={`rounded-3xl p-6 sm:p-8 border shadow-2xl relative overflow-hidden text-left ${
              scoreAnalysis.isPassed
                ? 'bg-gradient-to-br from-[#0B1528] via-[#0D1E36] to-[#090D16] border-emerald-500/30'
                : 'bg-gradient-to-br from-[#1C0F16] via-[#1A121A] to-[#090D16] border-rose-500/30'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-inter font-semibold border bg-white/5 border-white/10">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      scoreAnalysis.isPassed ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}
                  />
                  <span>
                    {scoreAnalysis.isPassed ? 'DGMS Benchmark Passed' : 'Benchmark Unsuccessful'}
                  </span>
                </div>
                <h1 className="font-poppins text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {quiz?.title || 'Mining Engineering Statutory Practice'}
                </h1>
                <p className="font-inter text-xs sm:text-sm text-slate-300">
                  Immediate post-examination answer key review. Analyze mistakes and statutory references below.
                </p>
              </div>

              {/* Big Score Badge */}
              <div className="flex flex-col items-start sm:items-end shrink-0">
                <span className="font-poppins text-4xl sm:text-5xl font-black text-white tabular-nums tracking-tight">
                  {scoreAnalysis.percentage}%
                </span>
                <span className="font-inter text-xs text-slate-400 mt-1">
                  Passing Standard: 60.0%
                </span>
              </div>
            </div>

            {/* 4 Diagnostic Metric Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-white/10">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[11px] font-inter text-slate-400 uppercase tracking-wider block">
                  Final Marks
                </span>
                <span className="font-poppins text-xl font-bold text-white mt-1 block tabular-nums">
                  {scoreAnalysis.marksObtained} / {scoreAnalysis.totalMarks}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[11px] font-inter text-slate-400 uppercase tracking-wider block">
                  Correct Answers
                </span>
                <span className="font-poppins text-xl font-bold text-emerald-400 mt-1 block tabular-nums">
                  {scoreAnalysis.correctCount}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[11px] font-inter text-slate-400 uppercase tracking-wider block">
                  Incorrect Mistakes
                </span>
                <span className="font-poppins text-xl font-bold text-rose-400 mt-1 block tabular-nums">
                  {scoreAnalysis.incorrectCount}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[11px] font-inter text-slate-400 uppercase tracking-wider block">
                  Skipped / Blank
                </span>
                <span className="font-poppins text-xl font-bold text-slate-300 mt-1 block tabular-nums">
                  {scoreAnalysis.skippedCount}
                </span>
              </div>
            </div>
          </div>

          {/* Solution Sheet Interactive Filter Toolbar */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <h3 className="font-poppins text-sm font-bold text-white">
                Statutory Question & Answer Review Sheet
              </h3>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-inter font-semibold transition-all cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                All ({questions.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('mistakes')}
                className={`px-3 py-1.5 rounded-xl text-xs font-inter font-semibold transition-all cursor-pointer ${
                  activeFilter === 'mistakes'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-rose-400 hover:bg-rose-950/40'
                }`}
              >
                Mistakes ({scoreAnalysis.incorrectCount})
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('correct')}
                className={`px-3 py-1.5 rounded-xl text-xs font-inter font-semibold transition-all cursor-pointer ${
                  activeFilter === 'correct'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-400 hover:bg-emerald-950/40'
                }`}
              >
                Correct ({scoreAnalysis.correctCount})
              </button>
            </div>
          </div>

          {/* Questions Review List */}
          <div className="space-y-4 text-left">
            {filteredQuestions.map((q, idx) => {
              const selectedOptionIds = answersMap.get(q.id) || [];
              const correctOptionIds = q.correctOptionIds || (q.options.length > 0 ? [q.options[0].id] : []);

              const isAnswered = selectedOptionIds.length > 0;
              const isCorrect =
                isAnswered &&
                selectedOptionIds.length === correctOptionIds.length &&
                selectedOptionIds.every((id) => correctOptionIds.includes(id));

              return (
                <div
                  key={q.id}
                  className={`rounded-2xl p-6 border shadow-sm space-y-4 transition-all ${
                    !isAnswered
                      ? 'bg-slate-900/60 border-slate-800'
                      : isCorrect
                      ? 'bg-gradient-to-br from-[#0B1718] to-slate-900/90 border-emerald-500/30'
                      : 'bg-gradient-to-br from-[#1C0F14] to-slate-900/90 border-rose-500/30'
                  }`}
                >
                  {/* Question Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-white/10 text-slate-200 border border-white/10">
                        Q{idx + 1}
                      </span>
                      {isCorrect ? (
                        <span className="inline-flex items-center gap-1 text-xs font-inter font-bold text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Correct (+{q.marks || 1} Mark)</span>
                        </span>
                      ) : isAnswered ? (
                        <span className="inline-flex items-center gap-1 text-xs font-inter font-bold text-rose-400">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Incorrect (0 Marks)</span>
                        </span>
                      ) : (
                        <span className="text-xs font-inter text-slate-400 font-medium">
                          Skipped (Unattempted)
                        </span>
                      )}
                    </div>

                    <span className="font-mono text-[11px] text-slate-500">
                      ID: {q.id}
                    </span>
                  </div>

                  {/* Question Statement */}
                  <h4 className="font-inter text-sm sm:text-base font-semibold text-white leading-relaxed">
                    {q.text}
                  </h4>

                  {/* Options List with Visual Feedback */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {q.options.map((opt, optIdx) => {
                      const isCandidateChoice = selectedOptionIds.includes(opt.id);
                      const isCorrectKey = correctOptionIds.includes(opt.id);

                      let optionStyle = 'bg-slate-900/80 border-slate-800 text-slate-300';

                      if (isCorrectKey) {
                        optionStyle =
                          'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 font-semibold shadow-xs';
                      } else if (isCandidateChoice && !isCorrectKey) {
                        optionStyle =
                          'bg-rose-950/40 border-rose-500/60 text-rose-200 font-semibold';
                      }

                      return (
                        <div
                          key={opt.id}
                          className={`p-3 rounded-xl border text-xs sm:text-sm font-inter flex items-center justify-between gap-2 transition-all ${optionStyle}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-full bg-white/10 border border-white/20 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt.text}</span>
                          </div>

                          <div className="shrink-0 flex items-center gap-1">
                            {isCorrectKey && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold border border-emerald-500/30">
                                <Check className="w-3 h-3" />
                                <span>Correct Key</span>
                              </span>
                            )}
                            {isCandidateChoice && !isCorrectKey && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[11px] font-bold border border-rose-500/30">
                                <X className="w-3 h-3" />
                                <span>Your Choice</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Statutory DGMS Technical Explanation */}
                  {q.explanation && (
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900/40 border border-blue-500/30 text-xs font-inter text-slate-300 space-y-1">
                      <div className="flex items-center gap-1.5 text-blue-400 font-poppins font-bold">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Statutory Technical Reference (CMR):</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed font-normal">
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Navigation Actions */}
          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link
              href="/candidate"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-inter font-semibold text-xs transition-all border border-slate-700"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake Mock with New Questions</span>
            </Link>

            <Link
              href="/candidate"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-inter font-bold text-xs transition-all shadow-md shadow-blue-500/20"
            >
              <span>Return to Candidate Portal</span>
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </div>

        </main>
      </div>
    );
  }

  // =========================================================
  // VIEW 2: LIVE QUIZ (SEALED STATUTORY SUBMISSION RECEIPT)
  // =========================================================
  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 font-inter antialiased flex flex-col selection:bg-blue-600 selection:text-white">
      
      {/* Header */}
      <header className="h-16 bg-[#090D16]/90 backdrop-blur-md border-b border-slate-800/80 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/candidate"
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-all border border-slate-700/60"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex flex-col">
            <span className="font-poppins font-black text-sm text-white tracking-tight">
              Statutory Examination Receipt
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Attempt ID: {attemptId}
            </span>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-inter font-semibold border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Audit Enclosed</span>
        </span>
      </header>

      {/* Main Sealed Receipt Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-12 flex flex-col justify-center">
        
        <div className="bg-gradient-to-b from-[#0F172A] via-[#111827] to-[#090D16] rounded-3xl border border-slate-800 p-8 sm:p-10 shadow-2xl text-center space-y-6">
          
          <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="font-poppins text-xs font-bold uppercase tracking-wider text-blue-400 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 inline-block">
              Statutory Assessment Sealed
            </span>
            <h1 className="font-poppins text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Official Examination Completed
            </h1>
            <p className="font-inter text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              Your examination answers and AI invigilation biometric telemetry have been securely packaged and transmitted to the DGMS Board.
            </p>
          </div>

          {/* Receipt Data Table */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 text-left text-xs font-inter divide-y divide-slate-800/80">
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">Candidate Email:</span>
              <span className="font-mono font-semibold text-white">
                {attempt?.userEmail || 'subhamkhandual215@gmail.com'}
              </span>
            </div>

            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">Paper Reference:</span>
              <span className="font-poppins font-semibold text-white">
                {quiz?.title || 'Mining Engineering (CMR Statutory Assessment)'}
              </span>
            </div>

            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">Questions Submitted:</span>
              <span className="font-semibold text-white tabular-nums">
                {scoreAnalysis.answeredCount} / {scoreAnalysis.totalQuestions || 30}
              </span>
            </div>

            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">Submission Timestamp:</span>
              <span className="font-mono text-slate-300">
                {new Date().toLocaleString()}
              </span>
            </div>

            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">Invigilation Integrity Status:</span>
              <span className="font-semibold text-emerald-400 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Audit Trail ({violationsCount} Alerts)</span>
              </span>
            </div>
          </div>

          {/* Statutory Confidentiality Notice */}
          <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-900/40 text-left text-xs font-inter text-slate-400 space-y-1">
            <strong className="text-slate-200 block font-poppins font-semibold">
              Statutory Confidentiality Policy:
            </strong>
            <p className="leading-relaxed">
              Under Directorate General of Mines Safety regulations, live examination questions, answer keys, and scored percentiles are sealed and delivered exclusively to the Administrator Command Center.
            </p>
          </div>

          {/* Action */}
          <div className="pt-2">
            <Link
              href="/candidate"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-inter font-bold text-xs transition-all shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <span>Return to Candidate Portal</span>
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </div>

          {/* Social Footer */}
          <SocialFooter variant="dark" className="mt-12" />
        </div>

      </main>

    </div>
  );
}
