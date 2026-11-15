'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { V4Navbar } from '../components/v4/V4Navbar';
import { V4Hero } from '../components/v4/V4Hero';
import { V4MarqueeRibbon } from '../components/v4/V4MarqueeRibbon';
import { V4GreyFooter } from '../components/v4/V4GreyFooter';
import dynamic from 'next/dynamic';
import { LoginModal } from '../components/auth/LoginModal';
import { PreExamVerificationModal } from '../components/PreExamVerificationModal';
import { MINING_STATUTORY_QUESTIONS } from '../data/miningQuestions';
import { shuffleArray } from '@mines-quiz/utils';
import { generateCandidateExamSession } from '../lib/questionSampling';
import { useQuizStore } from '../stores/useQuizStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useRBAC } from '../hooks/useRBAC';
import { Card, Button } from '@mines-quiz/ui';
import {
  Clock,
  Award,
  Video,
  Play,
  UserCheck,
  AlertCircle,
  Eye,
  ShieldCheck,
  ArrowRight,
  Layers,
  Sparkles,
  Lock,
  Workflow,
  BookOpen,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { isAdmin } = useRBAC();
  const setQuizSession = useQuizStore((s) => s.setQuizSession);

  const [mounted, setMounted] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [showPreExamModal, setShowPreExamModal] = useState(false);
  const [hasCompletedExam, setHasCompletedExam] = useState(false);
  const [completedAttemptId, setCompletedAttemptId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const mockQuiz = {
    id: 'quiz-mines-safety-demo',
    title: 'Mining Engineering & Safety Regulations (CMR)',
    description:
      'Statutory standardized examination assessing underground mine ventilation, Coal Mines Regulations (CMR 2017), inflammable gas limits, strata control, and mine safety standards.',
    category: 'Mining & Geo-Engineering',
    durationMinutes: 30,
    totalMarks: 20,
    passingMarks: 12,
    questionsCount: MINING_STATUTORY_QUESTIONS.length,
    shuffleQuestions: true,
    proctoringEnabled: true,
    maxViolationsAllowed: 3,
    status: 'published' as const,
    createdBy: 'admin',
    createdAt: '2026-11-10T00:00:00.000Z',
    updatedAt: '2026-11-10T00:00:00.000Z',
    questions: MINING_STATUTORY_QUESTIONS,
  };

  // Single-attempt check based on email in localStorage with automatic schema versioning
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const CURRENT_SCHEMA_VERSION = 'v4.0';
      const storedVersion = localStorage.getItem('mines_schema_version');
      if (storedVersion !== CURRENT_SCHEMA_VERSION) {
        // Automatically flush all prior examination attempts to start completely fresh
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
        localStorage.setItem('mines_schema_version', CURRENT_SCHEMA_VERSION);
      }

      if (user?.email) {
        const storedAttempt = localStorage.getItem(`mines_attempt_${user.email}_${mockQuiz.id}`);
        if (storedAttempt) {
          setHasCompletedExam(true);
          setCompletedAttemptId(storedAttempt);
        } else {
          setHasCompletedExam(false);
          setCompletedAttemptId(null);
        }
      }
    }
  }, [user?.email, mockQuiz.id]);

  const handleStartExamFlow = () => {
    if (isAdmin) {
      router.push('/admin');
      return;
    }
    if (user) {
      router.push('/candidate');
      return;
    }
    setIsLoginModalOpen(true);
  };

  const handleScrollToExam = () => {
    if (isAdmin) {
      router.push('/admin');
      return;
    }
    if (user) {
      router.push('/candidate');
      return;
    }
    setIsLoginModalOpen(true);
  };

  const handleProceedAfterFaceVerification = (mode: 'mock' | 'live' = 'mock', subjectCode: string = 'MIN-ALL') => {
    setShowPreExamModal(false);

    // Dynamically generate completely unique question set & shuffled options for this candidate
    const { quiz } = generateCandidateExamSession({
      subjectCode,
      candidateEmail: user?.email || 'candidate@minesquiz.com',
      candidateName: user?.displayName || 'Subham Khandual',
      mode,
    });

    const newAttempt = {
      id: 'attempt-' + Math.random().toString(36).substring(2, 9),
      quizId: quiz.id,
      quizTitle: quiz.title,
      userId: user?.firebaseUid || 'dev-user-001',
      userEmail: user?.email || 'candidate@minesquiz.com',
      userDisplayName: user?.displayName || 'Subham Khandual',
      answers: [],
      status: 'in-progress' as const,
      startTime: new Date().toISOString(),
      violationsCount: 0,
    };

    setQuizSession(quiz, newAttempt);
    router.push(`/exam/${quiz.id}`);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-inter flex flex-col selection:bg-purple-600 selection:text-white antialiased">
        
        {/* Header Navbar (Pure White Frosted Glass) */}
        <V4Navbar
          onLoginClick={() => setIsLoginModalOpen(true)}
          onStartExamClick={handleScrollToExam}
        />

        {/* Modal: Register / Login */}
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
        />

        {/* Modal: Pre-Exam Face Verification */}
        {showPreExamModal && (
          <PreExamVerificationModal
            quizTitle={mockQuiz.title}
            onVerifiedAndProceed={handleProceedAfterFaceVerification}
            onCancel={() => setShowPreExamModal(false)}
          />
        )}

        {/* Slot A: Hero Section (Soft Light Bluish #F0F7FF with Female Student Mascot) */}
        <V4Hero
          onStartExam={handleScrollToExam}
          onExploreFeatures={() => {
            router.push('/features');
          }}
        />

        {/* Dynamic Infinite Marquee Ribbon (Continuous Scrolling Cultural & Trust Badges) */}
        <V4MarqueeRibbon />

        {/* Slot B: Section 1 (Interactive Platform Modules Overview) */}
        <section className="py-20 bg-gradient-to-b from-[#FAF5FF] via-white to-[#F0F7FF] border-b border-purple-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <span className="font-poppins text-xs font-bold px-4 py-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 inline-flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                Statutory Architecture Overview
              </span>
              <h2 className="font-poppins text-3xl sm:text-4xl lg:text-5xl font-black text-[#1E1B4B] tracking-tight">
                Engineered Specifically for Mining & Statutory Assessments
              </h2>
              <p className="font-inter text-base text-slate-600 leading-relaxed">
                MinesQuiz combines Coal Mines Regulations (CMR 2017) question banking with client-side edge artificial intelligence. Explore our dedicated modules below.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: Features */}
              <div className="p-7 rounded-3xl bg-white border border-purple-100 shadow-xl shadow-purple-900/5 hover:border-purple-300 hover:shadow-2xl transition-all flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h3 className="font-poppins font-bold text-xl text-[#1E1B4B]">
                    Platform Features
                  </h3>
                  <p className="font-inter text-sm text-slate-600 leading-relaxed">
                    Fisher-Yates permutation algorithm, zero-knowledge question delivery, statutory negative marking, and instant DGMS pass benchmark grading.
                  </p>
                </div>
                <div className="pt-6">
                  <Link
                    href="/features"
                    prefetch={true}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 group-hover:translate-x-1 transition-all"
                  >
                    <span>Deep Dive into Features</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Card 2: AI Proctoring */}
              <div className="p-7 rounded-3xl bg-white border border-blue-100 shadow-xl shadow-blue-900/5 hover:border-blue-300 hover:shadow-2xl transition-all flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Eye className="w-6 h-6" />
                  </div>
                  <h3 className="font-poppins font-bold text-xl text-[#1E1B4B]">
                    AI Proctoring Lab
                  </h3>
                  <p className="font-inter text-sm text-slate-600 leading-relaxed">
                    In-browser 468 MediaPipe facial landmark mesh, tri-axis Euler angle pose tracker, absence alerts, and Web Audio acoustic noise monitoring.
                  </p>
                </div>
                <div className="pt-6">
                  <Link
                    href="/ai-proctoring"
                    prefetch={true}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 group-hover:translate-x-1 transition-all"
                  >
                    <span>Explore Proctoring Tech</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Card 3: How It Works */}
              <div className="p-7 rounded-3xl bg-white border border-indigo-100 shadow-xl shadow-indigo-900/5 hover:border-indigo-300 hover:shadow-2xl transition-all flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Workflow className="w-6 h-6" />
                  </div>
                  <h3 className="font-poppins font-bold text-xl text-[#1E1B4B]">
                    How It Works
                  </h3>
                  <p className="font-inter text-sm text-slate-600 leading-relaxed">
                    Dual-track user roadmap for Candidates (biometric verification to certified scorecard) and Administrators (exam creation to live audit logs).
                  </p>
                </div>
                <div className="pt-6">
                  <Link
                    href="/how-it-works"
                    prefetch={true}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 group-hover:translate-x-1 transition-all"
                  >
                    <span>View Step-by-Step Flow</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Card 4: Trust & Security */}
              <div className="p-7 rounded-3xl bg-white border border-emerald-100 shadow-xl shadow-emerald-900/5 hover:border-emerald-300 hover:shadow-2xl transition-all flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="font-poppins font-bold text-xl text-[#1E1B4B]">
                    Trust & Security
                  </h3>
                  <p className="font-inter text-sm text-slate-600 leading-relaxed">
                    5 immutable security invariants, zero cloud video leaks, scrypt cryptographic hashing, DPDP Act 2023 alignment, and DGMS compliance.
                  </p>
                </div>
                <div className="pt-6">
                  <Link
                    href="/trust-and-security"
                    prefetch={true}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 group-hover:translate-x-1 transition-all"
                  >
                    <span>Read Security Whitepaper</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Slot B: Active Examination Room Card (Single-Attempt Rule - Soft Light Bluish #F0F7FF) */}
        <section
          id="exam-launch-section"
          className="py-20 bg-[#F0F7FF] border-b border-blue-100"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-10 space-y-3">
              <h2 className="font-poppins text-3xl sm:text-4xl font-black text-[#1E1B4B] tracking-tight">
                Launch Official Examination
              </h2>
              <p className="font-inter text-sm sm:text-base text-slate-600">
                Protected by MinesQuiz AI face mesh, acoustic noise scanner, and single-attempt policy.
              </p>
            </div>

            <Card
              title={mockQuiz.title}
              subtitle={mockQuiz.description}
              className="border-blue-200 bg-white shadow-2xl p-2 sm:p-4 rounded-3xl"
            >
              <div className="space-y-6 font-inter">
                <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span>{mockQuiz.durationMinutes} Minutes</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>{mockQuiz.totalMarks} Marks Total</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <Video className="w-4 h-4 text-emerald-500" />
                    <span>AI Proctored</span>
                  </div>
                </div>

                {isAdmin ? (
                  <div className="p-5 rounded-2xl bg-purple-50 border border-purple-200 space-y-3 font-inter">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-poppins font-bold text-base text-purple-900">
                          Admin Management Mode Active
                        </h5>
                        <p className="text-sm text-purple-700 mt-1">
                          You are currently signed in as an <strong>Admin</strong> ({user?.email}). Under RBAC policy, administrator accounts manage examinations and invigilation telemetry, and cannot submit student attempts.
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      className="w-full flex items-center justify-center gap-2 cursor-pointer font-inter font-semibold py-3 border-purple-300 hover:bg-purple-100/50 text-purple-900"
                      onClick={() => setIsLoginModalOpen(true)}
                    >
                      <UserCheck className="w-4 h-4" />
                      Switch to Student Account to Attempt
                    </Button>
                  </div>
                ) : hasCompletedExam ? (
                  <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-poppins font-bold text-base text-amber-900">
                          Examination Already Completed
                        </h5>
                        <p className="font-inter text-sm text-amber-700 mt-1">
                          Your email (<strong>{user?.email}</strong>) has already submitted an attempt.
                          Re-attempts are permanently locked under the single-attempt policy.
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="secondary"
                      className="w-full flex items-center justify-center gap-2 cursor-pointer font-inter font-semibold py-3"
                      onClick={() => router.push(`/results/${completedAttemptId || 'demo'}`)}
                    >
                      <Eye className="w-4 h-4" />
                      View Your Scorecard & Result
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-blue-100 text-xs sm:text-sm font-inter">
                      <div className="flex items-center gap-2 text-slate-700">
                        <UserCheck className="w-4 h-4 text-emerald-500" />
                        <span>Candidate Account: <strong>{user?.email || 'candidate@minesquiz.com'}</strong></span>
                      </div>
                      <span className="font-poppins text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        1 Attempt Available
                      </span>
                    </div>

                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleStartExamFlow}
                      className="w-full text-base font-bold flex items-center justify-center gap-2.5 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-xl shadow-indigo-600/30 cursor-pointer font-poppins rounded-2xl"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Open Candidate Portal
                    </Button>
                  </>
                )}
              </div>
            </Card>
          </div>
        </section>

        {/* Slot A: Resources Spotlight Callout (Direct Link to /resources) */}
        <section className="py-16 bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/80 shadow-lg flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-3 text-center md:text-left">
                <span className="font-poppins text-xs font-bold px-3.5 py-1 rounded-full bg-blue-100/70 text-blue-800 border border-blue-200 inline-block">
                  Knowledge Hub & Downloads
                </span>
                <h3 className="font-poppins text-2xl sm:text-3xl font-black text-[#1E1B4B]">
                  Looking for Statutory CMR Study Guides & Blueprints?
                </h3>
                <p className="font-inter text-sm sm:text-base text-slate-600 max-w-2xl">
                  Access official First & Second Class Mine Manager examination blueprints, DGMS safety circulars, and downloadable sample question banks.
                </p>
              </div>

              <Link
                href="/resources"
                prefetch={true}
                className="shrink-0 flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-poppins font-bold text-sm shadow-md hover:shadow-xl hover:scale-105 transition-all"
              >
                <BookOpen className="w-4 h-4" />
                <span>Visit Resources Center</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        </section>

        {/* Modern Slate Charcoal Grey Footer (#1E242D) */}
        <V4GreyFooter />

      </div>
  );
}
