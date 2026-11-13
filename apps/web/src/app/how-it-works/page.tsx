'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { V4Navbar } from '../../components/v4/V4Navbar';
import { V4VerificationFlow } from '../../components/v4/V4VerificationFlow';
import { V4FaqSection } from '../../components/v4/V4FaqSection';
import { V4GreyFooter } from '../../components/v4/V4GreyFooter';
import { LoginModal } from '../../components/auth/LoginModal';
import { motion } from 'motion/react';
import {
  UserCheck,
  Camera,
  Clock,
  FileCheck2,
  ShieldCheck,
  CheckCircle2,
  Play,
  User,
  Shield,
  Laptop,
  Mic,
  Maximize,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Button } from '@mines-quiz/ui';

export default function HowItWorksPage() {
  const router = useRouter();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activePersona, setActivePersona] = useState<'candidate' | 'admin'>('candidate');
  const [diagnosticRunning, setDiagnosticRunning] = useState(false);
  const [diagnosticComplete, setDiagnosticComplete] = useState(false);

  const runDiagnostic = () => {
    setDiagnosticRunning(true);
    setDiagnosticComplete(false);
    setTimeout(() => {
      setDiagnosticRunning(false);
      setDiagnosticComplete(true);
    }, 1200);
  };

  const howItWorksFaqs = [
    {
      question: 'What hardware and browser do I need to take the statutory examination?',
      answer:
        'A standard laptop or desktop with a working webcam, microphone, and a modern Chromium-based browser (Google Chrome, Microsoft Edge, or Brave). Mobile devices are not supported for high-stakes statutory exams.',
    },
    {
      question: 'How does the single attempt policy prevent fraud?',
      answer:
        'Each candidate email is cryptographically mapped to an attempt token. Once the candidate launches the exam, re-attempts with that email are permanently locked.',
    },
    {
      question: 'What happens if my internet connection drops during the quiz?',
      answer:
        'MinesQuiz caches answered questions locally in the browser sandbox. When the connection resumes, responses are automatically reconciled and submitted without data loss.',
    },
    {
      question: 'How do examiners view the proctoring audit log after submission?',
      answer:
        'Authorized administrators can inspect individual candidate scorecards with timestamped violation logs, head pose deviation metrics, and overall integrity ratings.',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-inter flex flex-col selection:bg-purple-600 selection:text-white antialiased">
        
        {/* Navigation */}
        <V4Navbar
          onLoginClick={() => setIsLoginModalOpen(true)}
          onStartExamClick={() => router.push('/')}
        />

        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
        />

        {/* Page Hero Banner */}
        <section className="py-20 bg-gradient-to-b from-[#FFF9F5] via-[#FAF5FF] to-white border-b border-purple-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-poppins text-xs font-bold px-4 py-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 inline-block"
            >
              Step-by-Step Walkthrough
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-poppins text-4xl sm:text-5xl lg:text-6xl font-black text-[#1E1B4B] tracking-tight max-w-4xl mx-auto"
            >
              How MinesQuiz Works:{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600">
                Candidate Journey
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-inter text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed"
            >
              From pre-exam device calibration to automated statutory scoring, explore how MinesQuiz delivers fair and secure assessments.
            </motion.p>
          </div>
        </section>

        {/* Section 1: Verification Flow (The 4 Steps) */}
        <V4VerificationFlow onStartExam={() => router.push('/')} />

        {/* Section 2: Interactive Persona Workflow Track */}
        <section className="py-20 bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
              <span className="font-poppins text-xs font-bold px-3.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                Tailored Perspectives
              </span>
              <h2 className="font-poppins text-3xl sm:text-4xl font-black text-[#1E1B4B] tracking-tight">
                Choose Your Role to Explore the Flow
              </h2>
              <p className="font-inter text-base text-slate-600 leading-relaxed">
                Whether you are a candidate appearing for DGMS competency tests or an administrator managing cohort exams, MinesQuiz streamlines every step.
              </p>

              {/* Persona Selector Buttons */}
              <div className="inline-flex p-1.5 rounded-2xl bg-slate-100 border border-slate-200 font-poppins text-xs font-bold gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setActivePersona('candidate')}
                  className={`px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                    activePersona === 'candidate'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Candidate Track (Students)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePersona('admin')}
                  className={`px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                    activePersona === 'admin'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>Administrator Track (Examiners)</span>
                </button>
              </div>
            </div>

            {/* Candidate Persona Track */}
            {activePersona === 'candidate' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-300">
                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 shadow-md space-y-3 relative">
                  <span className="font-poppins text-2xl font-black text-purple-600">01</span>
                  <UserCheck className="w-6 h-6 text-purple-600" />
                  <h3 className="font-poppins font-bold text-lg text-[#1E1B4B]">Email Hash Check</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Enter verified student email. The system verifies candidate single-attempt status against cryptographic records.
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 shadow-md space-y-3 relative">
                  <span className="font-poppins text-2xl font-black text-blue-600">02</span>
                  <Camera className="w-6 h-6 text-blue-600" />
                  <h3 className="font-poppins font-bold text-lg text-[#1E1B4B]">Biometric Calibration</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Camera alignment checks single face presence. Fullscreen sandbox locks, and microphone tests ambient noise levels.
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 shadow-md space-y-3 relative">
                  <span className="font-poppins text-2xl font-black text-emerald-600">03</span>
                  <Clock className="w-6 h-6 text-emerald-600" />
                  <h3 className="font-poppins font-bold text-lg text-[#1E1B4B]">Proctored Exam</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Candidate answers randomized statutory CMR questions while in-browser MediaPipe tracks head orientation in real time.
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 shadow-md space-y-3 relative">
                  <span className="font-poppins text-2xl font-black text-amber-600">04</span>
                  <FileCheck2 className="w-6 h-6 text-amber-600" />
                  <h3 className="font-poppins font-bold text-lg text-[#1E1B4B]">Instant Scorecard</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Objective marks and proctoring audit telemetry are processed immediately to issue a verified performance summary.
                  </p>
                </div>
              </div>
            ) : (
              /* Administrator Persona Track */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-300">
                <div className="p-6 rounded-3xl bg-purple-50/50 border border-purple-200 shadow-md space-y-3 relative">
                  <span className="font-poppins text-2xl font-black text-purple-700">01</span>
                  <ShieldCheck className="w-6 h-6 text-purple-700" />
                  <h3 className="font-poppins font-bold text-lg text-purple-950">Sole Admin Auth</h3>
                  <p className="text-xs text-purple-900/80 leading-relaxed">
                    Secure login with Gmail SMTP 6-digit OTP verification and salted scrypt master password for subhamkhandual215@gmail.com.
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-purple-50/50 border border-purple-200 shadow-md space-y-3 relative">
                  <span className="font-poppins text-2xl font-black text-indigo-700">02</span>
                  <Clock className="w-6 h-6 text-indigo-700" />
                  <h3 className="font-poppins font-bold text-lg text-purple-950">Statutory Exam Setup</h3>
                  <p className="text-xs text-purple-900/80 leading-relaxed">
                    Configure time limits, CMR syllabus modules, passing benchmarks, and negative marking formulas.
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-purple-50/50 border border-purple-200 shadow-md space-y-3 relative">
                  <span className="font-poppins text-2xl font-black text-blue-700">03</span>
                  <UserCheck className="w-6 h-6 text-blue-700" />
                  <h3 className="font-poppins font-bold text-lg text-purple-950">Cohort Enrollment</h3>
                  <p className="text-xs text-purple-900/80 leading-relaxed">
                    Distribute secure tokens or enrollment links. Single-attempt hash prevents unauthorized duplicate registrations.
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-purple-50/50 border border-purple-200 shadow-md space-y-3 relative">
                  <span className="font-poppins text-2xl font-black text-emerald-700">04</span>
                  <FileCheck2 className="w-6 h-6 text-emerald-700" />
                  <h3 className="font-poppins font-bold text-lg text-purple-950">Live Audit & Export</h3>
                  <p className="text-xs text-purple-900/80 leading-relaxed">
                    Monitor live invigilation strikes, inspect timestamped violation logs, and export certified results for DGMS records.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Section 3: Live In-Browser Diagnostic Sandbox Widget */}
        <section className="py-20 bg-slate-50 border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <span className="font-poppins text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 inline-block mb-2">
                    Pre-Flight Sandbox Check
                  </span>
                  <h3 className="font-poppins text-2xl font-black text-[#1E1B4B]">
                    Interactive Device Readiness Check
                  </h3>
                  <p className="font-inter text-xs sm:text-sm text-slate-600 mt-1">
                    Simulate the pre-exam hardware diagnostic before starting an official examination session.
                  </p>
                </div>

                <Button
                  variant="primary"
                  onClick={runDiagnostic}
                  isLoading={diagnosticRunning}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-xl shadow-md cursor-pointer shrink-0"
                >
                  {diagnosticComplete ? 'Re-Run System Check' : 'Run Diagnostics'}
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-purple-600" />
                      Webcam Hardware
                    </span>
                    {diagnosticComplete ? (
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Ready</span>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-400">Idle</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">HD 720p 30fps webcam feed verified locally.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Mic className="w-4 h-4 text-blue-600" />
                      Microphone Audio
                    </span>
                    {diagnosticComplete ? (
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Ready</span>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-400">Idle</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">Ambient decibel calibration within safe noise limits.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Maximize className="w-4 h-4 text-emerald-600" />
                      Browser Sandbox
                    </span>
                    {diagnosticComplete ? (
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Supported</span>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-400">Idle</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">Page Visibility API and fullscreen locks supported.</p>
                </div>
              </div>

              {diagnosticComplete && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Your device is 100% compliant and ready for the MinesQuiz Examination.</span>
                  </div>
                  <button
                    onClick={() => router.push('/')}
                    className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Proceed to Exam</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* FAQs */}
        <V4FaqSection
          title="Candidate Journey & Operational FAQs"
          subtitle="Learn about exam steps, device rules, and recovery procedures."
          faqs={howItWorksFaqs}
        />

        {/* Footer */}
        <V4GreyFooter />

      </div>
  );
}
