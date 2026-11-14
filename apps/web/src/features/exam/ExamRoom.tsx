'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuizStore } from '../../stores/useQuizStore';
import { useProctorStore } from '../../stores/useProctorStore';
import { useFullscreen } from '../../hooks/useFullscreen';
import { useTabVisibility } from '../../hooks/useTabVisibility';
import { useAntiCheat } from '../../hooks/useAntiCheat';
import { useNoiseDetector } from '../../hooks/useNoiseDetector';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { QuizTimer } from '../../components/QuizTimer';
import { WebcamProctorView } from '../../components/WebcamProctorView';
import { QuestionNavigator } from '../../components/QuestionNavigator';
import { ViolationToast } from '../../components/ViolationToast';
import { Button } from '@mines-quiz/ui';
import { apiClient } from '../../lib/apiClient';
import { useScreenWakeLock } from '../../hooks/useScreenWakeLock';
import { yieldToMainThread } from '../../lib/performanceYield';
import { MINING_STATUTORY_QUESTIONS } from '../../data/miningQuestions';
import { generateCandidateExamSession } from '../../lib/questionSampling';
import {
  Maximize,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle2,
  ShieldAlert,
  FileText,
  HelpCircle,
  AlertOctagon,
  BookOpen,
  Camera,
  X,
  LayoutGrid,
} from 'lucide-react';

export const ExamRoom: React.FC = () => {
  const router = useRouter();
  const {
    currentQuiz,
    activeAttempt,
    masterQuestionsForScoring,
    currentIndex,
    setCurrentIndex,
    answers,
    selectOption,
    markedForReview,
    toggleMarkForReview,
    getCurrentAnswersArray,
    timeRemainingSeconds,
    setQuizSession,
  } = useQuizStore();

  const [mounted, setMounted] = useState(false);

  // Auto-Recovery & Session Hydration across Cloudflare Workers / page reloads
  useEffect(() => {
    setMounted(true);

    if (!currentQuiz && typeof window !== 'undefined') {
      // 1. Try restoring from sessionStorage
      try {
        const cached = sessionStorage.getItem('mines_active_quiz_session');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.quiz && parsed.attempt) {
            setQuizSession(parsed.quiz, parsed.attempt, parsed.masterQuestions || []);
            return;
          }
        }
      } catch (err) {
        console.warn('[ExamRoom] Session cache restore notice:', err);
      }

      // 2. Auto-generate from route URL parameters if sessionStorage is empty
      const pathParts = window.location.pathname.split('/');
      const rawId = pathParts[pathParts.length - 1] || 'quiz-min-all-mock';
      const isLive = rawId.includes('-live');
      const cleanCode = rawId.replace('quiz-', '').replace('-live', '').replace('-mock', '').toUpperCase();
      const subjectCode = cleanCode || 'MIN-ALL';
      const mode = isLive ? 'live' : 'mock';

      const candidateEmail = localStorage.getItem('mines_candidate_email') || 'subhamkhandual215@gmail.com';
      const candidateName = localStorage.getItem('mines_candidate_name') || 'Candidate Student';

      const { quiz, rawMasterQuestionsForScoring } = generateCandidateExamSession({
        subjectCode,
        candidateEmail,
        candidateName,
        mode,
      });

      const attempt = {
        id: 'attempt-' + Math.random().toString(36).substring(2, 9),
        quizId: quiz.id,
        quizTitle: quiz.title,
        userId: 'candidate-user-' + Math.random().toString(36).substring(2, 6),
        userEmail: candidateEmail,
        userDisplayName: candidateName,
        answers: [],
        status: 'in-progress' as const,
        startTime: new Date().toISOString(),
        violationsCount: 0,
      };

      const scoringKeys = mode === 'mock' ? rawMasterQuestionsForScoring : [];
      setQuizSession(quiz, attempt, scoringKeys);
      try {
        sessionStorage.setItem('mines_active_quiz_session', JSON.stringify({
          quiz,
          attempt,
          masterQuestions: scoringKeys,
        }));
      } catch (e) {}
    }
  }, [currentQuiz, setQuizSession]);

  const {
    reportViolation,
    reportWarning,
    isTerminated,
    violationsCount,
    maxAllowedViolations,
    faceAbsenceCount,
    maxAllowedFaceAbsences,
    activeAlert,
  } = useProctorStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'quiz' | 'instructions' | 'help' | 'report'>('quiz');
  const [showMobileCamera, setShowMobileCamera] = useState(false);
  const [showMobileNavigator, setShowMobileNavigator] = useState(false);

  // Determine if this session is an official Live Proctored Exam or self-paced Mock Practice
  const isLiveProctored = Boolean(currentQuiz?.proctoringEnabled && !currentQuiz?.id?.includes('-mock'));

  // Anti-Cheat: Fullscreen enforcer (Only for Live Proctored Exams, relaxed for mobile viewports)
  const { isFullscreen, requestFullscreen, isMobile, setIsFullscreen } = useFullscreen(() => {
    if (isLiveProctored && !isMobile) {
      reportViolation('fullscreen_exit', 'You exited fullscreen mode! This action has been logged.');
    }
  });

  // Anti-Cheat: Tab switch and window blur detector (Only for Live Proctored Exams)
  useTabVisibility(() => {
    if (isLiveProctored) {
      reportViolation('tab_switch', 'Tab switch or window blur detected! Returning to quiz...');
    }
  });

  // Anti-Cheat: Context menu, clipboard, and DevTools blocker hook (Only for Live Proctored Exams)
  useAntiCheat({
    enabled: isLiveProctored && !isTerminated,
  });

  // Audio Proctoring: Detect excessive room noise or speech (Advisory warning only, no exam termination)
  useNoiseDetector({
    enabled: isLiveProctored && !isTerminated,
    noiseThresholdDb: 70,
    onNoiseViolation: (dB) => {
      reportWarning('audio_detected', `Elevated ambient noise (${dB} dB) detected in room. Please maintain silence.`);
    },
  });

  // Network Guard: Monitor candidate internet connectivity
  const { isOnline } = useNetworkStatus();

  // Screen Wake Lock: keeps display active during the 60-min exam per Modern Web Guidance
  const { isLocked: isScreenAwake } = useScreenWakeLock({
    enabled: !isTerminated,
  });

  // Check persistent termination lock on mount to prevent F5 strike erasure
  useEffect(() => {
    if (activeAttempt?.userEmail && currentQuiz?.id && typeof window !== 'undefined') {
      const wasTerminated = localStorage.getItem(`mines_terminated_${activeAttempt.userEmail}_${currentQuiz.id}`);
      if (wasTerminated && !isTerminated) {
        reportViolation('tab_switch', 'Previous session was disqualified and permanently terminated.');
      }
    }
  }, [activeAttempt, currentQuiz, isTerminated, reportViolation]);

  // Persist termination immediately upon reaching max violations
  useEffect(() => {
    if (isTerminated && activeAttempt?.userEmail && currentQuiz?.id && typeof window !== 'undefined') {
      localStorage.setItem(`mines_terminated_${activeAttempt.userEmail}_${currentQuiz.id}`, 'true');
      localStorage.setItem(`mines_attempt_${activeAttempt.userEmail}_${currentQuiz.id}`, activeAttempt.id);
    }
  }, [isTerminated, activeAttempt, currentQuiz]);

  if (!mounted || !currentQuiz || !activeAttempt || !currentQuiz.questions || currentQuiz.questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-white">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Loading examination environment...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = currentQuiz.questions[currentIndex];
  const selectedOptions = answers.get(currentQuestion.id) || [];
  const isMarked = markedForReview.has(currentQuestion.id);
  const isLastQuestion = currentIndex === currentQuiz.questions.length - 1;

  const handleNext = async () => {
    await yieldToMainThread();
    if (!isLastQuestion) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowConfirmModal(true);
    }
  };

  const handleSubmit = async () => {
    if (isTerminated) {
      alert('Examination session was terminated due to proctoring policy violations and cannot be submitted.');
      return;
    }

    try {
      setIsSubmitting(true);
      const userAnswers = getCurrentAnswersArray();

      try {
        await apiClient.post(`/attempts/${activeAttempt.id}/submit`, {
          answers: userAnswers,
        });
      } catch (apiErr: any) {
        console.warn('[ExamRoom] API submit fallback to local record:', apiErr.message);
      }

      // Scientific grading: Compare candidate answers against genuine master questions bank
      let genuineMarksObtained = 0;
      const questionMap = new Map(MINING_STATUTORY_QUESTIONS.map((q) => [q.id, q]));

      userAnswers.forEach((ans) => {
        const masterQ = questionMap.get(ans.questionId);
        const correctIds = masterQ?.correctOptionIds;
        if (masterQ && correctIds && correctIds.length > 0) {
          const selected = ans.selectedOptionIds || [];
          const isCorrect =
            selected.length === correctIds.length &&
            selected.every((id) => correctIds.includes(id));

          if (isCorrect) {
            genuineMarksObtained += masterQ.marks || 1;
          }
        }
      });

      // Sync official Live proctored attempt to Admin Command Center with genuine score
      if (isLiveProctored && activeAttempt) {
        try {
          await fetch('/api/admin/candidates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: activeAttempt.id,
              name: activeAttempt.userDisplayName,
              email: activeAttempt.userEmail,
              subjectCode: currentQuiz.id.replace('quiz-', '').replace('-live', '').toUpperCase(),
              subjectName: currentQuiz.title,
              mode: 'live',
              marksObtained: genuineMarksObtained,
              totalMarks: currentQuiz.questions?.length || 30,
              violationsCount,
              timeSpentMinutes: Math.max(1, Math.round((currentQuiz.durationMinutes * 60 - timeRemainingSeconds) / 60)),
            }),
          });
        } catch (adminSyncErr) {
          console.warn('[ExamRoom] Admin candidate record sync notice:', adminSyncErr);
        }
      }

      // Record completed attempt in localStorage to enforce single attempt policy
      if (typeof window !== 'undefined' && activeAttempt.userEmail) {
        localStorage.setItem(`mines_attempt_${activeAttempt.userEmail}_${currentQuiz.id}`, activeAttempt.id);

        // Store session review bundle for instant review on /results with full answer keys
        try {
          localStorage.setItem(
            `mines_session_review_${activeAttempt.id}`,
            JSON.stringify({
              quiz: currentQuiz,
              attempt: activeAttempt,
              answers: userAnswers,
              masterQuestions:
                masterQuestionsForScoring && masterQuestionsForScoring.length > 0
                  ? masterQuestionsForScoring
                  : (currentQuiz.questions || []).map((q) => {
                      const master = questionMap.get(q.id);
                      return master
                        ? {
                            ...q,
                            correctOptionIds: master.correctOptionIds,
                            explanation: master.explanation,
                          }
                        : q;
                    }),
              mode: currentQuiz.id?.includes('-mock') ? 'mock' : 'live',
            })
          );
        } catch (storageErr) {
          console.warn('[ExamRoom] LocalStorage review cache notice:', storageErr);
        }
      }

      router.push(`/results/${activeAttempt.id}`);
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none">
      <ViolationToast />

      {/* Fullscreen Overlay Enforcement - Only for Desktop Live Proctored Exams */}
      {isLiveProctored && !isMobile && !isFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <ShieldAlert className="w-16 h-16 text-amber-400 mb-4 animate-bounce" />
          <h2 className="text-2xl font-black text-white mb-2">Examination Mode Required</h2>
          <p className="text-slate-400 max-w-md text-sm mb-6">
            To ensure exam integrity, Mines Quiz requires focused examination mode. Leaving the exam screen or switching apps will log an integrity violation.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button size="lg" onClick={requestFullscreen} className="flex items-center gap-2">
              <Maximize className="w-5 h-5" />
              {isMobile ? 'Enter Exam Mode' : 'Enter Fullscreen & Continue'}
            </Button>
            {isMobile && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => setIsFullscreen(true)}
                className="text-slate-300 border-slate-700 hover:bg-slate-800"
              >
                Continue in Mobile View
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Disqualification / Terminated Modal */}
      {isTerminated && (
        <div className="fixed inset-0 z-50 bg-red-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <AlertTriangle className="w-16 h-16 text-rose-500 mb-4 animate-pulse" />
          <h2 className="text-2xl font-black text-white mb-2">Examination Terminated</h2>
          <p className="text-rose-200 max-w-md text-sm mb-6">
            {activeAlert || (faceAbsenceCount > maxAllowedFaceAbsences
              ? `Your examination has been automatically terminated because candidate left camera view (${maxAllowedFaceAbsences} chances exceeded).`
              : `Your examination has been automatically terminated due to excessive proctoring violations (${violationsCount} of ${maxAllowedViolations} maximum permitted).`)}
          </p>
          <Button
            variant="danger"
            size="lg"
            onClick={() => {
              if (typeof window !== 'undefined' && activeAttempt?.userEmail && currentQuiz?.id) {
                localStorage.setItem(`mines_terminated_${activeAttempt.userEmail}_${currentQuiz.id}`, 'true');
              }
              router.push('/candidate');
            }}
          >
            Exit to Candidate Portal
          </Button>
        </div>
      )}

      {/* Network Offline Alert Banner */}
      {!isOnline && (
        <div className="bg-rose-600 text-white px-4 py-2.5 text-center text-xs font-bold flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Internet connection interrupted! Please do not refresh. Your answers are stored locally and will sync once reconnected.</span>
        </div>
      )}

      {/* Top Session Bar (Mines Quiz Header) */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-sm text-white shadow-md shadow-blue-500/20">
            🎯
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base text-white">Mines Quiz</span>
              <span className="text-slate-500 text-xs hidden sm:inline">•</span>
              <span className="font-medium text-xs sm:text-sm text-slate-300 truncate max-w-[180px] sm:max-w-xs">
                {currentQuiz.title}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Screen Wake Lock Pill */}
          {isScreenAwake && (
            <div
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-950/50 border border-blue-800/60 text-blue-400 text-xs font-semibold"
              title="Screen Wake Lock: Display will stay awake during exam"
            >
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span>Screen Active</span>
            </div>
          )}

          {/* AI Active Pill or Practice Mode Pill */}
          {isLiveProctored ? (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950/50 border border-rose-800/60 text-rose-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>AI Proctoring: Active</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/50 border border-emerald-800/60 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Practice Mode: Camera OFF</span>
            </div>
          )}

          <QuizTimer onTimeExpired={handleSubmit} />

          {/* Mobile Question Palette Toggle Button */}
          <button
            onClick={() => setShowMobileNavigator(true)}
            className="lg:hidden p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
            title="Open Question Palette"
          >
            <LayoutGrid className="w-4 h-4 text-blue-400" />
          </button>

          {/* Mobile Camera Toggle Button (Only for Live Proctored Exams) */}
          {isLiveProctored && (
            <button
              onClick={() => setShowMobileCamera(!showMobileCamera)}
              className="lg:hidden p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
              title="Toggle Proctor Camera"
            >
              <Camera className="w-4 h-4" />
            </button>
          )}

          <Button variant="primary" size="sm" onClick={() => setShowConfirmModal(true)}>
            Finish Exam
          </Button>
        </div>
      </header>

      {/* Mobile Floating PIP Camera - Only for Live Proctored Exams */}
      {isLiveProctored && showMobileCamera && (
        <div className="lg:hidden fixed bottom-4 right-4 z-50 w-64 shadow-2xl rounded-xl border border-slate-700 overflow-hidden bg-slate-900">
          <div className="flex justify-between items-center bg-slate-800 px-3 py-1.5 text-xs text-white">
            <span className="font-semibold">AI Camera Feed</span>
            <button onClick={() => setShowMobileCamera(false)}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-2">
            <WebcamProctorView attemptId={activeAttempt.id} />
          </div>
        </div>
      )}

      {/* Main 3-Column / Responsive Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 2 Cols: Sidebar Navigation (Quiz, Instructions, Help, Report) */}
        <aside className="lg:col-span-2 hidden lg:flex flex-col gap-2">
          <button
            onClick={() => setActiveTab('quiz')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors text-left ${activeTab === 'quiz'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
              : 'text-slate-400 hover:bg-slate-900 border border-transparent'
              }`}
          >
            <FileText className="w-4 h-4" />
            <span>Quiz</span>
          </button>

          <button
            onClick={() => setActiveTab('instructions')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors text-left ${activeTab === 'instructions'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
              : 'text-slate-400 hover:bg-slate-900 border border-transparent'
              }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Instructions</span>
          </button>

          <button
            onClick={() => setActiveTab('help')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors text-left ${activeTab === 'help'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
              : 'text-slate-400 hover:bg-slate-900 border border-transparent'
              }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Help</span>
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors text-left ${activeTab === 'report'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
              : 'text-slate-400 hover:bg-slate-900 border border-transparent'
              }`}
          >
            <AlertOctagon className="w-4 h-4" />
            <span>Report Issue</span>
          </button>

          {/* Quick Question Navigator in sidebar */}
          <div className="mt-4 pt-4 border-t border-slate-800">
            <QuestionNavigator questions={currentQuiz.questions} />
          </div>
        </aside>

        {/* Center 7 Cols: Question Card */}
        <main className="lg:col-span-7 flex flex-col">
          {activeTab === 'quiz' ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 flex-1 flex flex-col justify-between shadow-xl">
              <div>
                {/* Question Info Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-poppins font-bold text-sm sm:text-base text-blue-400">
                      Question {currentIndex + 1} of {currentQuiz.questions.length}
                    </span>
                    <span className="text-slate-600 text-xs">•</span>
                    <span className="text-xs font-inter font-medium text-slate-400">
                      {currentQuestion.type === 'multiple-select' ? 'Multiple Choice' : 'Single Choice'}
                    </span>
                  </div>

                  {/* Zero Negative Marking Indicator */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-inter font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>+{currentQuestion.marks || 1} Mark</span>
                    <span className="text-emerald-500/60">•</span>
                    <span>Zero Negative Marking</span>
                  </div>
                </div>

                {/* Actual Question Text - Bold & Enlarged for Mobile and Desktop with Copy-Protection */}
                <div
                  className="my-5 sm:my-7 select-none"
                  onContextMenu={(e) => e.preventDefault()}
                  onCopy={(e) => e.preventDefault()}
                >
                  <h2 className="text-xl sm:text-2xl font-poppins font-bold text-white leading-relaxed sm:leading-snug tracking-tight select-none">
                    {currentQuestion.text}
                  </h2>
                </div>

                {/* Radio Options List - Tactile A, B, C, D Badges & Large Touch Targets */}
                <div className="space-y-3.5 sm:space-y-4">
                  {currentQuestion.options.map((opt, oIdx) => {
                    const isSelected = selectedOptions.includes(opt.id);
                    const isMultiple = currentQuestion.type === 'multiple-select';
                    const optionLetter = ['A', 'B', 'C', 'D', 'E'][oIdx] || String.fromCharCode(65 + oIdx);

                    return (
                      <div
                        key={opt.id}
                        onClick={() => selectOption(currentQuestion.id, opt.id, isMultiple)}
                        className={`flex items-center gap-3.5 sm:gap-4 p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all active:scale-[0.99] min-h-[60px] ${isSelected
                          ? 'border-blue-500 bg-blue-950/60 text-white shadow-md shadow-blue-950/50 ring-2 ring-blue-500/30'
                          : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/80 hover:border-slate-700 text-slate-200'
                          }`}
                      >
                        {/* Tactile Letter Badge */}
                        <div
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl font-poppins font-black text-sm sm:text-base flex items-center justify-center shrink-0 transition-all ${isSelected
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/40'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                        >
                          {optionLetter}
                        </div>

                        {/* Option Text */}
                        <span className="text-base sm:text-lg font-inter font-medium leading-relaxed flex-1">
                          {opt.text}
                        </span>

                        {/* Radio Dot Indicator */}
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${isSelected ? 'border-blue-400 bg-blue-500' : 'border-slate-600 bg-slate-800'
                            }`}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Actions: Previous, Mark for Review, Save & Next */}
              <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-8">
                <Button
                  variant="outline"
                  onClick={() => toggleMarkForReview(currentQuestion.id)}
                  className={`min-h-[46px] px-4 font-poppins font-semibold text-xs sm:text-sm ${isMarked ? 'border-amber-500 text-amber-400 bg-amber-500/10' : ''
                    }`}
                >
                  <Flag className="w-4 h-4 mr-2" />
                  {isMarked ? 'Marked for Review' : 'Mark for Review'}
                </Button>

                <div className="flex items-center gap-3">
                  <Button
                    variant="secondary"
                    disabled={currentIndex === 0}
                    onClick={async () => {
                      await yieldToMainThread();
                      setCurrentIndex(currentIndex - 1);
                    }}
                    className="flex-1 sm:flex-initial min-h-[46px] px-5 font-poppins font-semibold text-xs sm:text-sm"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleNext}
                    className="flex-1 sm:flex-initial min-h-[46px] px-6 bg-blue-600 hover:bg-blue-500 text-white font-poppins font-bold text-xs sm:text-sm shadow-md shadow-blue-600/30"
                  >
                    {isLastQuestion ? 'Review & Submit' : 'Save & Next'}
                    {!isLastQuestion && <ChevronRight className="w-4 h-4 ml-1" />}
                  </Button>
                </div>
              </div>
            </div>
          ) : activeTab === 'instructions' ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-sm text-slate-300 space-y-5 shadow-xl">
              <h4 className="text-xl font-bold font-poppins text-white">Examination Instructions & Rules</h4>
              <ul className="list-disc list-inside space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <li><strong className="text-white">Zero Negative Marking:</strong> There is zero penalty for incorrect answers. Attempt all questions with full confidence.</li>
                <li><strong className="text-white">Passing Benchmark:</strong> Minimum 60.0% score required to pass (at least 18 correct answers out of 30).</li>
                <li><strong className="text-white">Proctoring Enforcement:</strong> For live proctored exams, camera focus, tab switches, and fullscreen integrity are continuously monitored.</li>
                <li><strong className="text-white">Auto-Save Protection:</strong> All your selected answers are saved in real-time to your browser session.</li>
              </ul>
              <Button size="sm" onClick={() => setActiveTab('quiz')} className="mt-4">Return to Quiz</Button>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-sm text-slate-300 space-y-4 shadow-xl">
              <h4 className="text-xl font-bold font-poppins text-white">Support & Assistance</h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                If you face camera glitches or network issues, do not close your browser. The system automatically preserves your answers every 10 seconds.
              </p>
              <Button size="sm" onClick={() => setActiveTab('quiz')} className="mt-4">Return to Quiz</Button>
            </div>
          )}
        </main>

        {/* Right 3 Cols: AI Proctor Webcam View (Live) OR Practice Mode Card (Mock) */}
        <aside className="lg:col-span-3 hidden lg:flex flex-col gap-4">
          {isLiveProctored ? (
            <WebcamProctorView attemptId={activeAttempt.id} />
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-left space-y-3.5 shadow-lg">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Practice Session</span>
              </div>
              <h4 className="text-sm font-bold text-white">
                Webcam & Proctoring Disabled
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                You are in self-paced Mock Practice mode. Answer all questions freely without webcam monitoring, facial tracking, or violation penalties.
              </p>
              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-medium">
                Tip: Use Next and Previous to review any question before final submission.
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Mobile Question Palette Modal */}
      {showMobileNavigator && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl max-w-lg w-full p-5 sm:p-6 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-blue-400" />
                <h4 className="font-poppins font-bold text-white text-base">Question Palette</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileNavigator(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <QuestionNavigator questions={currentQuiz.questions} />
            <div className="mt-5 pt-3 border-t border-slate-800">
              <Button
                variant="primary"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-poppins font-bold min-h-[44px]"
                onClick={() => setShowMobileNavigator(false)}
              >
                Resume Question
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl">
            <CheckCircle2 className="w-12 h-12 text-blue-400 mx-auto mb-3" />
            <h4 className="text-lg font-bold text-white mb-2">Submit Examination?</h4>
            <p className="text-xs text-slate-400 mb-6">
              You have answered {answers.size} of {currentQuiz.questions.length} questions. Once submitted, your answers will be graded and you cannot re-attempt this exam with your email.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowConfirmModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" isLoading={isSubmitting} onClick={handleSubmit}>
                Yes, Submit Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
