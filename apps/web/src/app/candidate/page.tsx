'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CandidateExamSessionPortal } from '../../components/candidate/CandidateExamSessionPortal';
import { PreExamVerificationModal } from '../../components/PreExamVerificationModal';
import { useAuthStore } from '../../stores/useAuthStore';
import { useQuizStore } from '../../stores/useQuizStore';
import { generateCandidateExamSession } from '../../lib/questionSampling';

export default function CandidatePortalPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { setQuizSession } = useQuizStore();
  const [mounted, setMounted] = useState(false);
  const [showPreModal, setShowPreModal] = useState(false);
  const [pendingMode, setPendingMode] = useState<'mock' | 'live'>('mock');
  const [pendingSubjectCode, setPendingSubjectCode] = useState<string>('MIN-ALL');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleStartExam = (mode: 'mock' | 'live' = 'mock', subjectCode: string = 'MIN-ALL') => {
    const candidateEmail = user?.email || 'subhamkhandual215@gmail.com';
    const targetQuizId = `quiz-${subjectCode.toLowerCase()}-${mode}`;

    // Single Attempt Enforcement for Live Proctored Exams
    if (mode === 'live' && typeof window !== 'undefined') {
      const priorAttempt = localStorage.getItem(`mines_attempt_${candidateEmail}_${targetQuizId}`);
      const wasTerminated = localStorage.getItem(`mines_terminated_${candidateEmail}_${targetQuizId}`);

      if (priorAttempt || wasTerminated) {
        alert(
          'Single Attempt Enforcement: You have already attempted or completed this statutory examination paper (' +
            subjectCode +
            '). Under DGMS regulations, multiple retakes on the same candidate email are strictly prohibited.'
        );
        return;
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
