'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CandidateExamSessionPortal } from '../../components/candidate/CandidateExamSessionPortal';
import { PreExamVerificationModal } from '../../components/PreExamVerificationModal';
import { useAuthStore } from '../../stores/useAuthStore';
import { useQuizStore } from '../../stores/useQuizStore';
import { generateCandidateExamSession } from '../../lib/questionSampling';
import { auth, onAuthStateChanged } from '../../lib/firebase';

export default function CandidatePortalPage() {
  const router = useRouter();
  const { user, setUser, logout } = useAuthStore();
  const { setQuizSession } = useQuizStore();
  const [mounted, setMounted] = useState(false);
  const [showPreModal, setShowPreModal] = useState(false);
  const [pendingMode, setPendingMode] = useState<'mock' | 'live'>('mock');
  const [pendingSubjectCode, setPendingSubjectCode] = useState<string>('MIN-ALL');

  useEffect(() => {
    setMounted(true);

    if (auth) {
      try {
        const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
          if (fbUser && fbUser.email) {
            const email = fbUser.email.toLowerCase().trim();
            const name = fbUser.displayName || email.split('@')[0];
            setUser({
              id: fbUser.uid,
              firebaseUid: fbUser.uid,
              email,
              displayName: name,
              role: email === 'subhamkhandual215@gmail.com' ? 'both' : 'student',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            if (typeof window !== 'undefined') {
              localStorage.setItem('mines_candidate_email', email);
              localStorage.setItem('mines_candidate_name', name);
            }
          }
        });
        return () => unsubscribe();
      } catch (authListenerErr) {
        console.warn('Firebase Auth state listener notice:', authListenerErr);
      }
    }
  }, [setUser]);

  // Automatic Fresh Reset: clears prior attempts and lockouts so candidate can take exam fresh
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const CANDIDATE_SCHEMA_VERSION = 'v4.0';
      const stored = localStorage.getItem('mines_candidate_schema_version');
      if (stored !== CANDIDATE_SCHEMA_VERSION) {
        Object.keys(localStorage).forEach((key) => {
          if (
            key.startsWith('mines_attempt_') ||
            key.startsWith('mines_terminated_') ||
            key.startsWith('mines_lockout_') ||
            key.startsWith('mines_session_review_') ||
            key === 'mines_last_completion_notice'
          ) {
            localStorage.removeItem(key);
          }
        });
        try {
          sessionStorage.removeItem('mines_active_quiz_session');
        } catch {}
        localStorage.setItem('mines_candidate_schema_version', CANDIDATE_SCHEMA_VERSION);
      }
    }
  }, []);

  const handleStartExam = (mode: 'mock' | 'live' = 'mock', subjectCode: string = 'MIN-ALL') => {
    const candidateEmail = user?.email || 'subhamkhandual215@gmail.com';
    const targetQuizId = `quiz-${subjectCode.toLowerCase()}-${mode}`;

    // Single Attempt Enforcement for Live Proctored Exams (Exempts designated master user)
    if (mode === 'live' && typeof window !== 'undefined') {
      const isMasterUser = candidateEmail.toLowerCase() === 'subhamkhandual215@gmail.com';
      if (!isMasterUser) {
        const priorAttempt = localStorage.getItem(`mines_attempt_${candidateEmail}_${targetQuizId}`);
        const wasTerminated = localStorage.getItem(`mines_terminated_${candidateEmail}_${targetQuizId}`);
        let cookieAttempt = false;
        try {
          cookieAttempt =
            document.cookie.includes(`mines_sub_${btoa(candidateEmail).replace(/=/g, '')}`) ||
            document.cookie.includes(`mines_term_${btoa(candidateEmail).replace(/=/g, '')}`);
        } catch {}

        if (priorAttempt || wasTerminated || cookieAttempt) {
          alert(
            'Single Attempt Enforcement: You have already attempted or completed this statutory examination paper (' +
              subjectCode +
              '). Under DGMS regulations, multiple retakes on the same candidate email are strictly prohibited.'
          );
          return;
        }
      }
    }

    // Dynamically generate completely unique question set & shuffled options for this candidate
    const { quiz, rawMasterQuestionsForScoring } = generateCandidateExamSession({
      subjectCode,
      candidateEmail,
      candidateName: user?.displayName || 'Subham Khandual',
      mode,
    });

    const attempt = {
      id: 'attempt-' + Math.random().toString(36).substring(2, 9),
      quizId: quiz.id,
      quizTitle: quiz.title,
      userId: user?.firebaseUid || 'candidate-user-001',
      userEmail: candidateEmail,
      userDisplayName: user?.displayName || 'Subham Khandual',
      answers: [],
      status: 'in-progress' as const,
      startTime: new Date().toISOString(),
      violationsCount: 0,
    };

    // In live proctored mode, do not leak master answer keys to client Zustand store during exam
    const scoringKeysForSession = mode === 'mock' ? rawMasterQuestionsForScoring : [];

    setQuizSession(quiz, attempt, scoringKeysForSession);

    // Persist session across Cloudflare routing and browser refreshes
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(
          'mines_active_quiz_session',
          JSON.stringify({
            quiz,
            attempt,
            masterQuestions: scoringKeysForSession,
          })
        );
        localStorage.setItem('mines_candidate_email', candidateEmail);
        localStorage.setItem('mines_candidate_name', user?.displayName || 'Subham Khandual');
      } catch (storageErr) {
        console.warn('Could not cache active quiz session:', storageErr);
      }
    }

    router.push(`/exam/${quiz.id}`);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#F4F7FC] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <>
      {showPreModal && (
        <PreExamVerificationModal
          quizTitle="Mining Statutory Assessment"
          onVerifiedAndProceed={() => {
            setShowPreModal(false);
            handleStartExam(pendingMode, pendingSubjectCode);
          }}
          onCancel={() => setShowPreModal(false)}
        />
      )}

      <CandidateExamSessionPortal
        onStartExam={(mode, subjectCode) => {
          setPendingMode(mode);
          if (subjectCode) setPendingSubjectCode(subjectCode);
          handleStartExam(mode, subjectCode || 'MIN-ALL');
        }}
        onLogout={() => {
          logout();
          router.push('/');
        }}
      />
    </>
  );
}
