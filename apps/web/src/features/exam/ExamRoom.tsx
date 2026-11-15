'use client';

import React, { useState, useEffect, useRef } from 'react';
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

  // Tab Switch Violation & Grace Period States (Option B: 1 Warning with 10s Timer + 2nd Strike Disqualification)
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
  const [showTabSwitchWarning, setShowTabSwitchWarning] = useState<boolean>(false);
  const [tabSwitchCountdown, setTabSwitchCountdown] = useState<number>(10);
  const lastTabSwitchTimeRef = useRef<number>(0);

  // Determine if this session is an official Live Proctored Exam or self-paced Mock Practice
  const isLiveProctored = Boolean(currentQuiz?.proctoringEnabled && !currentQuiz?.id?.includes('-mock'));

  // Anti-Cheat: Fullscreen enforcer (Only for Live Proctored Exams, relaxed for mobile viewports)
  const { isFullscreen, requestFullscreen, isMobile, setIsFullscreen } = useFullscreen(() => {
    // Suppress redundant fullscreen violation while in tab switch warning state to avoid duplicate strikes
    if (isLiveProctored && !isMobile && !showTabSwitchWarning && !isTerminated) {
      reportViolation('fullscreen_exit', 'You exited fullscreen mode! This action has been logged.');
    }
  });

  // Anti-Cheat: Tab switch and window blur detector (Only for Live Proctored Exams)
  useTabVisibility(() => {
    if (!isLiveProctored || isTerminated) return;

    const isMasterUser = activeAttempt?.userEmail?.toLowerCase() === 'subhamkhandual215@gmail.com';
    const now = Date.now();
    // Debounce to prevent multiple triggers from blur + visibilitychange within 3 seconds
    if (now - lastTabSwitchTimeRef.current < 3000) return;
    lastTabSwitchTimeRef.current = now;

    const newSwitchCount = tabSwitchCount + 1;
    setTabSwitchCount(newSwitchCount);

    if (newSwitchCount === 1) {
      // Strike 1: Display 10-second alarming grace warning modal
      setShowTabSwitchWarning(true);
      setTabSwitchCountdown(10);
      reportViolation(
        'tab_switch',
        'Tab Switch Warning (Strike 1 of 2): You left the exam window. Next tab switch will immediately terminate your exam.'
      );
    } else {
      // Strike 2: Instant termination and disqualification
      setShowTabSwitchWarning(false);
      reportViolation(
        'tab_switch',
        'Tab Switch Disqualification (Strike 2 of 2): Multiple tab switches detected outside the examination window.'
      );
      if (!isMasterUser && typeof window !== 'undefined' && activeAttempt?.userEmail && currentQuiz?.id) {
        localStorage.setItem(`mines_terminated_${activeAttempt.userEmail}_${currentQuiz.id}`, 'true');
      }
    }
  });

  // Tab Switch Grace Countdown Timer (10s)
  useEffect(() => {
    if (!showTabSwitchWarning || tabSwitchCountdown <= 0 || isTerminated) return;

    const isMasterUser = activeAttempt?.userEmail?.toLowerCase() === 'subhamkhandual215@gmail.com';
    const timer = setInterval(() => {
      setTabSwitchCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowTabSwitchWarning(false);
          reportViolation(
            'tab_switch',
            'Tab switch grace period expired (10s elapsed). Examination permanently terminated.'
          );
          if (!isMasterUser && typeof window !== 'undefined' && activeAttempt?.userEmail && currentQuiz?.id) {
            localStorage.setItem(`mines_terminated_${activeAttempt.userEmail}_${currentQuiz.id}`, 'true');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showTabSwitchWarning, tabSwitchCountdown, isTerminated, reportViolation, activeAttempt, currentQuiz]);

  const handleResumeFromTabSwitch = async () => {
    setShowTabSwitchWarning(false);
    if (!isMobile) {
      try {
        await requestFullscreen();
      } catch {}
    }
  };

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

  // Check persistent termination lock on mount to prevent F5 strike erasure (master user exempt)
  useEffect(() => {
    if (activeAttempt?.userEmail && currentQuiz?.id && typeof window !== 'undefined') {
      const isMasterUser = activeAttempt.userEmail.toLowerCase() === 'subhamkhandual215@gmail.com';
      if (!isMasterUser) {
        const wasTerminated = localStorage.getItem(`mines_terminated_${activeAttempt.userEmail}_${currentQuiz.id}`);
        if (wasTerminated && !isTerminated) {
          reportViolation('tab_switch', 'Previous session was disqualified and permanently terminated.');
        }
      }
    }
  }, [activeAttempt, currentQuiz, isTerminated, reportViolation]);

  // Persist termination immediately upon reaching max violations (master user exempt)
  useEffect(() => {
    if (isTerminated && activeAttempt?.userEmail && currentQuiz?.id && typeof window !== 'undefined') {
      const isMasterUser = activeAttempt.userEmail.toLowerCase() === 'subhamkhandual215@gmail.com';
      if (!isMasterUser) {
        localStorage.setItem(`mines_terminated_${activeAttempt.userEmail}_${currentQuiz.id}`, 'true');
        localStorage.setItem(`mines_attempt_${activeAttempt.userEmail}_${currentQuiz.id}`, activeAttempt.id);
      }
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

        const reviewBundle = {
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
        };

        // Store session review bundles for both attemptId and latest fallback
        try {
          localStorage.setItem(`mines_session_review_${activeAttempt.id}`, JSON.stringify(reviewBundle));
          localStorage.setItem('mines_session_review_latest', JSON.stringify(reviewBundle));
        } catch (storageErr) {
          console.warn('[ExamRoom] LocalStorage review cache notice:', storageErr);
        }

        // Store completion notice for candidate dashboard
        try {
          localStorage.setItem(
            'mines_last_completion_notice',
            JSON.stringify({
              quizTitle: currentQuiz.title,
              marksObtained: genuineMarksObtained,
              totalMarks: currentQuiz.questions?.length || 30,
              isPassed: genuineMarksObtained >= 18,
              completedAt: new Date().toISOString(),
            })
          );
        } catch (noticeErr) {
          console.warn('[ExamRoom] Notice cache notice:', noticeErr);
        }
      }

      // Return smoothly to Candidate Portal dashboard (prevents Cloudflare dynamic route crash)
      router.push('/candidate');
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none">
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

      {/* Tab Switch Strike 1 Warning Grace Modal */}
      {showTabSwitchWarning && !isTerminated && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none">
          <div className="max-w-md w-full bg-slate-900 border-2 border-amber-500 rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 animate-pulse">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-inter font-bold text-xs uppercase tracking-wider">
                Tab Switch Warning (Strike 1 of 2)
              </span>
              <h2 className="text-xl sm:text-2xl font-poppins font-black text-white">
                Tab Switch Detected!
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 font-inter leading-relaxed">
              You navigated away from the active examination window. Under DGMS statutory regulations, leaving the exam window is strictly forbidden.
            </p>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs font-semibold">
              Your NEXT tab switch will immediately and permanently TERMINATE your examination.
            </div>

            <div className="flex flex-col items-center justify-center py-1">
              <span className="text-3xl font-black font-poppins text-amber-400 tabular-nums">
                {tabSwitchCountdown}s
              </span>
              <span className="text-[11px] text-slate-400 font-inter">
                Remaining to resume before automatic termination
              </span>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={handleResumeFromTabSwitch}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-poppins font-bold text-sm py-3 rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Resume Examination Now
            </Button>
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
      <header className="h-16 w-full max-w-full border-b border-slate-800 bg-slate-900/90 backdrop-blur px-3 sm:px-6 flex items-center justify-between sticky top-0 z-40 overflow-hidden">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-sm text-white shadow-md shadow-blue-500/20 shrink-0">
            🎯
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold text-sm sm:text-base text-white shrink-0">Mines Quiz</span>
              <span className="text-slate-500 text-xs hidden md:inline">•</span>
              <span className="font-medium text-xs sm:text-sm text-slate-300 truncate max-w-[140px] sm:max-w-xs hidden md:inline">
                {currentQuiz.title}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
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
            className="lg:hidden p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white shrink-0"
            title="Open Question Palette"
          >
            <LayoutGrid className="w-4 h-4 text-blue-400" />
          </button>

          {/* Mobile Camera Toggle Button (Only for Live Proctored Exams) */}
          {isLiveProctored && (
            <button
              onClick={() => setShowMobileCamera(!showMobileCamera)}
              className="lg:hidden p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white shrink-0"
              title="Toggle Proctor Camera"
            >
              <Camera className="w-4 h-4" />
            </button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowConfirmModal(true)}
            className="px-3 sm:px-4 text-xs font-bold shrink-0"
          >
            <span className="hidden sm:inline">Finish Exam</span>
            <span className="sm:hidden">Finish</span>
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
      <div className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-6">
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
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-7 flex-1 flex flex-col justify-between shadow-xl">
              <div>
                {/* Question Info Bar */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2.5 sm:pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="font-poppins font-bold text-xs sm:text-base text-blue-400">
                      Question {currentIndex + 1} of {currentQuiz.questions.length}
                    </span>
                    <span className="text-slate-600 text-xs">•</span>
                    <span className="text-[11px] sm:text-xs font-inter font-medium text-slate-400">
                      {currentQuestion.type === 'multiple-select' ? 'Multiple Choice' : 'Single Choice'}
                    </span>
                  </div>

                  {/* Zero Negative Marking Indicator */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] sm:text-xs font-inter font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>+{currentQuestion.marks || 1} Mark</span>
                    <span className="text-emerald-500/60">•</span>
                    <span>Zero Negative Marking</span>
                  </div>
                </div>

                {/* Actual Question Text - Bold & Enlarged with Mobile Screen Optimization */}
                <div
                  className="my-2.5 sm:my-6 select-none"
                  onContextMenu={(e) => e.preventDefault()}
                  onCopy={(e) => e.preventDefault()}
                >
                  <h2 className="text-sm sm:text-2xl font-poppins font-bold text-white leading-snug sm:leading-snug tracking-tight select-none">
                    {currentQuestion.text}
                  </h2>
                </div>

                {/* Radio Options List - Compact Vertical Rhythm on Mobile, Tactile A, B, C, D Badges */}
                <div className="space-y-2 sm:space-y-4">
                  {currentQuestion.options.map((opt, oIdx) => {
                    const isSelected = selectedOptions.includes(opt.id);
                    const isMultiple = currentQuestion.type === 'multiple-select';
                    const optionLetter = ['A', 'B', 'C', 'D', 'E'][oIdx] || String.fromCharCode(65 + oIdx);

                    return (
                      <div
                        key={opt.id}
                        onClick={() => selectOption(currentQuestion.id, opt.id, isMultiple)}
                        className={`flex items-center gap-2.5 sm:gap-4 p-2.5 sm:p-5 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all active:scale-[0.99] min-h-[44px] sm:min-h-[60px] ${isSelected
                          ? 'border-blue-500 bg-blue-950/60 text-white shadow-md shadow-blue-950/50 ring-2 ring-blue-500/30'
                          : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/80 hover:border-slate-700 text-slate-200'
                          }`}
                      >
                        {/* Tactile Letter Badge */}
                        <div
                          className={`w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl font-poppins font-bold sm:font-black text-xs sm:text-base flex items-center justify-center shrink-0 transition-all ${isSelected
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/40'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                        >
                          {optionLetter}
                        </div>

                        {/* Option Text */}
                        <span className="text-xs sm:text-lg font-inter font-medium leading-snug sm:leading-relaxed flex-1">
                          {opt.text}
                        </span>

                        {/* Radio Dot Indicator */}
                        <div
                          className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${isSelected ? 'border-blue-400 bg-blue-500' : 'border-slate-600 bg-slate-800'
                            }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Actions: Previous, Mark for Review, Save & Next - Single Compact Row on Mobile */}
              <div className="pt-3 sm:pt-6 border-t border-slate-800 flex flex-row items-center justify-between gap-1.5 sm:gap-4 mt-3 sm:mt-8">
                <Button
                  variant="outline"
                  onClick={() => toggleMarkForReview(currentQuestion.id)}
                  className={`min-h-[38px] sm:min-h-[46px] px-2.5 sm:px-4 font-poppins font-semibold text-[11px] sm:text-sm shrink-0 ${isMarked ? 'border-amber-500 text-amber-400 bg-amber-500/10' : ''
                    }`}
                >
                  <Flag className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">{isMarked ? 'Marked for Review' : 'Mark for Review'}</span>
                  <span className="sm:hidden">{isMarked ? 'Marked' : 'Review'}</span>
                </Button>

                <div className="flex items-center gap-1.5 sm:gap-3">
                  <Button
                    variant="secondary"
                    disabled={currentIndex === 0}
                    onClick={async () => {
                      await yieldToMainThread();
                      setCurrentIndex(currentIndex - 1);
                    }}
                    className="min-h-[38px] sm:min-h-[46px] px-2.5 sm:px-5 font-poppins font-semibold text-[11px] sm:text-sm shrink-0"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleNext}
                    className="min-h-[38px] sm:min-h-[46px] px-3 sm:px-6 bg-blue-600 hover:bg-blue-500 text-white font-poppins font-bold text-xs sm:text-sm shadow-md shadow-blue-600/30 shrink-0"
                  >
                    <span>{isLastQuestion ? 'Submit' : 'Save & Next'}</span>
                    {!isLastQuestion && <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1" />}
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
