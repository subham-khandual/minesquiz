'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuizStore } from '../../stores/useQuizStore';
import { useProctorStore } from '../../stores/useProctorStore';
import { useFullscreen } from '../../hooks/useFullscreen';
import { useTabVisibility } from '../../hooks/useTabVisibility';
import { useAntiCheat } from '../../hooks/useAntiCheat';
import { useNoiseDetector } from '../../hooks/useNoiseDetector';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { ViolationToast } from '../../components/ViolationToast';
import { Button } from '@mines-quiz/ui';
import { apiClient } from '../../lib/apiClient';
import { useScreenWakeLock } from '../../hooks/useScreenWakeLock';
import { yieldToMainThread } from '../../lib/performanceYield';
import { MINING_STATUTORY_QUESTIONS } from '../../data/miningQuestions';
import { generateCandidateExamSession } from '../../lib/questionSampling';
import {
  CBTHeader,
} from './components/CBTHeader';
import {
  CBTSectionTabs,
} from './components/CBTSectionTabs';
import {
  CBTQuestionCanvas,
} from './components/CBTQuestionCanvas';
import {
  CBTToolbar,
} from './components/CBTToolbar';
import {
  CBTProctorWidget,
} from './components/CBTProctorWidget';
import {
  CBTPalette,
} from './components/CBTPalette';
import {
  CBTFooter,
} from './components/CBTFooter';
import {
  Maximize,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
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
    clearResponse,
    markedForReview,
    toggleMarkForReview,
    visitedQuestions,
    getCurrentAnswersArray,
    timeRemainingSeconds,
    decrementTimer,
    setQuizSession,
  } = useQuizStore();

  const [mounted, setMounted] = useState(false);

  // Auto-Recovery & Session Hydration across Cloudflare Workers / page reloads
  useEffect(() => {
    setMounted(true);

    if (!currentQuiz && typeof window !== 'undefined') {
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

      // Auto-generate from route URL parameters if sessionStorage is empty
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

  // Tab Switch Violation & Grace Period States (Option B: 1 Warning with 10s Timer + 2nd Strike Disqualification)
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
  const [showTabSwitchWarning, setShowTabSwitchWarning] = useState<boolean>(false);
  const [tabSwitchCountdown, setTabSwitchCountdown] = useState<number>(10);
  const lastTabSwitchTimeRef = useRef<number>(0);

  // Determine if this session is an official Live Proctored Exam or self-paced Mock Practice
  const isLiveProctored = Boolean(currentQuiz?.proctoringEnabled && !currentQuiz?.id?.includes('-mock'));

  // Countdown Timer Interval
  useEffect(() => {
    if (!mounted || isTerminated || timeRemainingSeconds <= 0) return;

    const timer = setInterval(() => {
      decrementTimer();
    }, 1000);

    return () => clearInterval(timer);
  }, [mounted, isTerminated, timeRemainingSeconds, decrementTimer]);

  // Anti-Cheat: Fullscreen enforcer (Only for Live Proctored Exams, relaxed for mobile viewports)
  const handleExitFullscreen = useCallback(() => {
    if (isLiveProctored && !showTabSwitchWarning && !isTerminated) {
      reportViolation('fullscreen_exit', 'You exited fullscreen mode! This action has been logged.');
    }
  }, [isLiveProctored, showTabSwitchWarning, isTerminated, reportViolation]);

  const { isFullscreen, requestFullscreen, isMobile, setIsFullscreen } = useFullscreen(handleExitFullscreen);

  // Anti-Cheat: Tab Visibility Listener
  useTabVisibility(() => {
    if (!isLiveProctored || isTerminated) return;

    const now = Date.now();
    if (now - lastTabSwitchTimeRef.current < 2000) return;
    lastTabSwitchTimeRef.current = now;

    setTabSwitchCount((prev) => {
      const nextCount = prev + 1;

      if (nextCount === 1) {
        setShowTabSwitchWarning(true);
        setTabSwitchCountdown(10);
        reportWarning(
          'tab_switch',
          'Warning: Tab switch detected (Strike 1 of 2). You have 10 seconds to return before disqualification.'
        );
      } else {
        setShowTabSwitchWarning(false);
        const isMasterUser = activeAttempt?.userEmail?.toLowerCase() === 'subhamkhandual215@gmail.com';
        reportViolation(
          'tab_switch',
          'Final Disqualification: Multiple tab switches detected (Strike 2 of 2). Examination terminated.'
        );
        if (!isMasterUser && typeof window !== 'undefined' && activeAttempt?.userEmail && currentQuiz?.id) {
          localStorage.setItem(`mines_terminated_${activeAttempt.userEmail}_${currentQuiz.id}`, 'true');
        }
      }

      return nextCount;
    });
  });

  // 10-Second Tab-Switch Grace Countdown Timer
  useEffect(() => {
    if (!showTabSwitchWarning || isTerminated) return;

    const timer = setInterval(() => {
      setTabSwitchCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowTabSwitchWarning(false);
          const isMasterUser = activeAttempt?.userEmail?.toLowerCase() === 'subhamkhandual215@gmail.com';
          reportViolation(
            'tab_switch',
            'Disqualification: Failed to resume examination within the 10-second warning window.'
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
  }, [showTabSwitchWarning, isTerminated, reportViolation, activeAttempt, currentQuiz]);

  const handleResumeFromTabSwitch = async () => {
    setShowTabSwitchWarning(false);
    if (!isMobile) {
      try {
        await requestFullscreen();
      } catch {}
    }
  };

  // Anti-Cheat: Context menu, clipboard, and DevTools blocker hook
  useAntiCheat({
    enabled: isLiveProctored && !isTerminated,
  });

  // Audio Proctoring: Candidate room audio monitoring verified under DGMS standards
  // Note: Active stream, VU meter, and audio_detected events are managed in CBTProctorWidget
  const handleNoiseViolation = useCallback((dB: number) => {
    reportWarning('audio_detected', `Elevated ambient noise (${dB} dB) detected in room. Please maintain silence.`);
  }, [reportWarning]);

  useNoiseDetector({
    enabled: false,
    noiseThresholdDb: 70,
    onNoiseViolation: handleNoiseViolation,
  });

  // Network Guard: Monitor internet connectivity
  const { isOnline } = useNetworkStatus();

  // Screen Wake Lock
  const { isLocked: isScreenAwake } = useScreenWakeLock({
    enabled: !isTerminated,
  });

  // Check persistent termination lock on mount
  useEffect(() => {
    if (activeAttempt?.userEmail && currentQuiz?.id && typeof window !== 'undefined') {
      const isMasterUser = activeAttempt.userEmail.toLowerCase() === 'subhamkhandual215@gmail.com';
      if (!isMasterUser) {
        const wasTerminated = localStorage.getItem(`mines_terminated_${activeAttempt.userEmail}_${currentQuiz.id}`);
        let cookieTerminated = false;
        try {
          cookieTerminated = typeof document !== 'undefined' && document.cookie.includes(`mines_term_${btoa(activeAttempt.userEmail).replace(/=/g, '')}=true`);
        } catch {}
        if ((wasTerminated || cookieTerminated) && !isTerminated) {
          reportViolation('tab_switch', 'Previous session was disqualified and permanently terminated.');
        }
      }
    }
  }, [activeAttempt, currentQuiz, isTerminated, reportViolation]);

  // Persist termination immediately and release hardware tracks
  useEffect(() => {
    if (isTerminated && typeof window !== 'undefined') {
      try {
        if ((window as any).__stopAllWebcamHardware) {
          (window as any).__stopAllWebcamHardware();
        }
        if ((window as any).__stopAllAudioHardware) {
          (window as any).__stopAllAudioHardware();
        }
      } catch {}

      if (activeAttempt?.userEmail && currentQuiz?.id) {
        const isMasterUser = activeAttempt.userEmail.toLowerCase() === 'subhamkhandual215@gmail.com';
        if (!isMasterUser) {
          localStorage.setItem(`mines_terminated_${activeAttempt.userEmail}_${currentQuiz.id}`, 'true');
          localStorage.setItem(`mines_attempt_${activeAttempt.userEmail}_${currentQuiz.id}`, activeAttempt.id);
          try {
            document.cookie = `mines_term_${btoa(activeAttempt.userEmail).replace(/=/g, '')}=true; path=/; max-age=86400; SameSite=Strict`;
          } catch {}
        }
      }
    }
  }, [isTerminated, activeAttempt, currentQuiz]);

  if (!mounted || !currentQuiz || !activeAttempt || !currentQuiz.questions || currentQuiz.questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#0A192F] text-white">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm font-inter">Loading statutory CBT examination environment...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = currentQuiz.questions[currentIndex];
  const selectedOptions = answers.get(currentQuestion.id) || [];
  const isMarked = markedForReview.has(currentQuestion.id);
  const isLastQuestion = currentIndex === currentQuiz.questions.length - 1;

  // Format candidate metadata
  const candidateDisplayName =
    activeAttempt.userDisplayName ||
    (typeof window !== 'undefined' ? localStorage.getItem('mines_candidate_name') : null) ||
    'Candidate Student';

  const rollNumber = 'MQ2025' + (activeAttempt.userId?.replace(/\D/g, '').slice(-3) || '001').padStart(3, '0');

  const handleNext = async () => {
    await yieldToMainThread();
    if (!isLastQuestion) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowConfirmModal(true);
    }
  };

  const handlePrevious = async () => {
    await yieldToMainThread();
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (isTerminated) {
      alert('Examination session was terminated due to proctoring policy violations and cannot be submitted.');
      return;
    }

    // 1. Immediately cut off webcam and mic hardware before processing submission
    if (typeof window !== 'undefined') {
      try {
        if ((window as any).__stopAllWebcamHardware) {
          (window as any).__stopAllWebcamHardware();
        }
        if ((window as any).__stopAllAudioHardware) {
          (window as any).__stopAllAudioHardware();
        }
      } catch {}
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

      // Scientific grading
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
            genuineMarksObtained += masterQ.marks || 2;
          }
        }
      });

      // Sync official Live proctored attempt to Admin Command Center
      if (isLiveProctored && activeAttempt) {
        try {
          await fetch('/api/admin/candidates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: activeAttempt.id,
              name: candidateDisplayName,
              email: activeAttempt.userEmail,
              subjectCode: currentQuiz.id.replace('quiz-', '').replace('-live', '').toUpperCase(),
              subjectName: currentQuiz.title,
              mode: 'live',
              marksObtained: genuineMarksObtained,
              totalMarks: (currentQuiz.questions?.length || 30) * 2,
              violationsCount,
              timeSpentMinutes: Math.max(1, Math.round((currentQuiz.durationMinutes * 60 - timeRemainingSeconds) / 60)),
            }),
          });
        } catch (adminSyncErr) {
          console.warn('[ExamRoom] Admin candidate record sync notice:', adminSyncErr);
        }
      }

      // Record completed attempt in localStorage and secure browser cookie
      if (typeof window !== 'undefined' && activeAttempt.userEmail) {
        localStorage.setItem(`mines_attempt_${activeAttempt.userEmail}_${currentQuiz.id}`, activeAttempt.id);
        try {
          document.cookie = `mines_sub_${btoa(activeAttempt.userEmail).replace(/=/g, '')}=${activeAttempt.id}; path=/; max-age=604800; SameSite=Strict`;
        } catch {}

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

        try {
          localStorage.setItem(`mines_session_review_${activeAttempt.id}`, JSON.stringify(reviewBundle));
          localStorage.setItem('mines_session_review_latest', JSON.stringify(reviewBundle));
        } catch (storageErr) {
          console.warn('[ExamRoom] LocalStorage review cache notice:', storageErr);
        }

        try {
          localStorage.setItem(
            'mines_last_completion_notice',
            JSON.stringify({
              quizTitle: currentQuiz.title,
              marksObtained: genuineMarksObtained,
              totalMarks: (currentQuiz.questions?.length || 30) * 2,
              isPassed: genuineMarksObtained >= 36,
              completedAt: new Date().toISOString(),
            })
          );
        } catch (noticeErr) {
          console.warn('[ExamRoom] Notice cache notice:', noticeErr);
        }
      }

      // Return smoothly to Candidate Portal dashboard
      router.push('/candidate');
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col select-none">
      <ViolationToast />

      {/* Network Offline Alert Banner */}
      {!isOnline && (
        <div className="bg-rose-600 text-white px-4 py-2 text-center text-xs font-bold flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Internet connection interrupted! Answers are preserved locally and will sync once reconnected.</span>
        </div>
      )}

      {/* Fullscreen Overlay Enforcement - Only for Desktop Live Proctored Exams */}
      {isLiveProctored && !isMobile && !isFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <ShieldAlert className="w-16 h-16 text-amber-400 mb-4 animate-bounce" />
          <h2 className="text-2xl font-black text-white mb-2">Examination Mode Required</h2>
          <p className="text-slate-400 max-w-md text-sm mb-6 font-inter">
            To ensure exam integrity under DGMS guidelines, MinesQuiz requires focused full-screen mode.
          </p>
          <Button size="lg" onClick={requestFullscreen} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500">
            <Maximize className="w-5 h-5" />
            Enter Fullscreen & Continue
          </Button>
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
              Navigating away from the active examination window is strictly forbidden under DGMS statutory regulations.
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
          <p className="text-rose-200 max-w-md text-sm mb-6 font-inter">
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

      {/* =========================================================================
          1. TOP CBT HEADER
          Desktop: 68px Full Meta Navy Bar
          Mobile: 44px Unified Single Bar (NO Hamburger, NO Redundant Timer Row!)
          ========================================================================= */}
      <CBTHeader
        candidateName={candidateDisplayName}
        rollNumber={rollNumber}
        examTitle={currentQuiz.title}
        totalQuestions={currentQuiz.questions.length}
        totalMarks={currentQuiz.questions.length * 2}
        timeRemainingSeconds={timeRemainingSeconds}
        onSubmitClick={() => setShowConfirmModal(true)}
      />

      {/* =========================================================================
          2. SECTION TABS BAR
          Desktop: Full Statutory Titles
          Mobile: Compact Sec A / Sec B / Sec C Pills
          ========================================================================= */}
      <CBTSectionTabs
        currentIndex={currentIndex}
        onSelectSection={(startIndex) => setCurrentIndex(startIndex)}
      />

      {/* =========================================================================
          3. MAIN EXAMINATION CANVAS
          Conditional Rendering: Exactly ONE ProctorWidget mounted to prevent hardware lock
          ========================================================================= */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-3 sm:p-6">
        {isMobile ? (
          /* =========================================================================
             MOBILE VIEWPORT (Single-Column Vertical Ergonomic Stack)
             ========================================================================= */
          <div className="flex flex-col gap-2.5">
            {/* Question Canvas */}
            <CBTQuestionCanvas
              question={currentQuestion}
              currentIndex={currentIndex}
              totalQuestions={currentQuiz.questions.length}
              selectedOptionIds={selectedOptions}
              onSelectOption={selectOption}
            />

            {/* Action Toolbar (Previous, Review, Clear, Save & Next) - Immediate Thumb Tap */}
            <CBTToolbar
              currentIndex={currentIndex}
              totalQuestions={currentQuiz.questions.length}
              isMarkedForReview={isMarked}
              hasAnswer={selectedOptions.length > 0}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onToggleMarkForReview={() => toggleMarkForReview(currentQuestion.id)}
              onClearResponse={() => clearResponse(currentQuestion.id)}
            />

            {/* Compact Inline Proctoring Bar (Below Toolbar) */}
            <CBTProctorWidget
              attemptId={activeAttempt.id}
              isLiveProctored={isLiveProctored}
              isActive={!isSubmitting && !isTerminated && timeRemainingSeconds > 0}
              layout="mobile"
            />

            {/* Question Palette Docked at Bottom */}
            <CBTPalette
              questions={currentQuiz.questions}
              currentIndex={currentIndex}
              answers={answers}
              markedForReview={markedForReview}
              visitedQuestions={visitedQuestions}
              onSelectIndex={(index) => setCurrentIndex(index)}
            />
          </div>
        ) : (
          /* =========================================================================
             DESKTOP VIEWPORT (Dual-Column Layout: 67% Question Canvas, 33% Proctor & Palette)
             ========================================================================= */
          <div className="grid grid-cols-12 gap-6 items-start">
            {/* Left Column: Question Canvas + Action Toolbar (8 cols = ~67% width) */}
            <div className="col-span-8 flex flex-col">
              <CBTQuestionCanvas
                question={currentQuestion}
                currentIndex={currentIndex}
                totalQuestions={currentQuiz.questions.length}
                selectedOptionIds={selectedOptions}
                onSelectOption={selectOption}
              />

              <CBTToolbar
                currentIndex={currentIndex}
                totalQuestions={currentQuiz.questions.length}
                isMarkedForReview={isMarked}
                hasAnswer={selectedOptions.length > 0}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onToggleMarkForReview={() => toggleMarkForReview(currentQuestion.id)}
                onClearResponse={() => clearResponse(currentQuestion.id)}
              />
            </div>

            {/* Right Column: Proctoring Sidebar + Question Palette (4 cols = ~33% width) */}
            <div className="col-span-4 flex flex-col gap-4">
              <CBTProctorWidget
                attemptId={activeAttempt.id}
                isLiveProctored={isLiveProctored}
                isActive={!isSubmitting && !isTerminated && timeRemainingSeconds > 0}
                layout="desktop"
              />

              <CBTPalette
                questions={currentQuiz.questions}
                currentIndex={currentIndex}
                answers={answers}
                markedForReview={markedForReview}
                visitedQuestions={visitedQuestions}
                onSelectIndex={(index) => setCurrentIndex(index)}
              />
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
          4. STATUTORY FOOTER
          ========================================================================= */}
      <CBTFooter />

      {/* Final Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-2xl border border-slate-200">
            <CheckCircle2 className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h4 className="text-lg font-poppins font-bold text-slate-900 mb-2">Submit Examination?</h4>
            <p className="text-xs text-slate-600 mb-6 font-inter">
              You have answered {answers.size} of {currentQuiz.questions.length} questions. Once submitted, your answers will be graded under DGMS statutory standards and cannot be re-attempted with your email.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                isLoading={isSubmitting}
                onClick={handleSubmit}
                className="bg-blue-600 hover:bg-blue-500 text-white"
              >
                Yes, Submit Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
