'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { V4Navbar } from '../../components/v4/V4Navbar';
import { V4SecurityPillars } from '../../components/v4/V4SecurityPillars';
import { V4FaqSection } from '../../components/v4/V4FaqSection';
import { V4GreyFooter } from '../../components/v4/V4GreyFooter';
import { LoginModal } from '../../components/auth/LoginModal';
import { motion } from 'motion/react';
import { Shuffle, ShieldAlert, Award, FileSpreadsheet, CheckCircle2, Play, Sparkles } from 'lucide-react';
import { Button } from '@mines-quiz/ui';

export default function FeaturesPage() {
  const router = useRouter();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const featureFaqs = [
    {
      question: 'How does the question randomization algorithm work?',
      answer:
        'Every time a candidate begins a session, questions are shuffled using the Fisher-Yates algorithm, and each question options (A, B, C, D) are also uniquely permuted. No two candidates ever receive the same sequence.',
    },
    {
      question: 'Are correct answers visible in the browser developer tools?',
      answer:
        'No. Under strict zero-knowledge delivery rules, correctOptionIds are completely stripped before sending questions to the candidate browser. Scoring occurs securely on submission.',
    },
    {
      question: 'What happens if a candidate attempts to copy or paste text?',
      answer:
        'Clipboard operations, text selection, and right-click context menus are locked during the examination session. Any attempt triggers an immediate warning strike.',
    },
    {
      question: 'Does the system support negative marking and custom pass benchmarks?',
      answer:
        'Yes. MinesQuiz supports configurable scoring parameters including statutory CMR negative marking formulas and customizable passing percentage thresholds.',
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

        {/* Page Hero Banner with Realistic Mining Engineering Background */}
        <section className="relative py-28 overflow-hidden bg-[#1E1B4B] border-b border-purple-900/40">
          {/* Realistic Background Image with Cinematic Overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src="/images/features-hero-bg.jpg"
              alt="Mining Operations & Examination Technology Control Room"
              className="w-full h-full object-cover object-center transform scale-105"
            />
            {/* Deep Slate Indigo Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/85 via-[#1E1B4B]/80 to-[#1E1B4B]/95 backdrop-blur-[1.5px]" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-poppins text-xs font-bold px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-purple-200 border border-white/20 inline-flex items-center gap-1.5 shadow-xl"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              Statutory Platform Capabilities
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-poppins text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto drop-shadow-lg"
            >
              Enterprise Examination &{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-indigo-200 to-blue-300">
                Anti-Cheat Features
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-inter text-base sm:text-lg text-purple-100/90 max-w-2xl mx-auto leading-relaxed font-normal"
            >
              Engineered specifically for Coal Mines Regulations (CMR 2017) statutory certifications with randomized question banking, sandbox lockdown, and instant grading.
            </motion.p>

            {/* Quick Hero Feature Badges */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="pt-4 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-white/90"
            >
              <span className="px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Fisher-Yates Permutation
              </span>
              <span className="px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Zero-Knowledge Client Payloads
              </span>
              <span className="px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                CMR 2017 Statutory Syllabus
              </span>
            </motion.div>
          </div>
        </section>

        {/* Section 1: Security Pillars */}
        <V4SecurityPillars />

        {/* Section 2: Dynamic Question Banking */}
        <section className="py-20 bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <span className="font-poppins text-xs font-bold px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Adaptive Shuffling Engine
                </span>
                <h2 className="font-poppins text-3xl sm:text-4xl font-black text-[#1E1B4B] tracking-tight">
                  Dynamic Permutation Defeats Screen-Sharing Cheats
                </h2>
                <p className="font-inter text-base text-slate-600 leading-relaxed">
                  Even if candidates attempt to sit side-by-side or share live screen feeds over secondary devices, every candidate receives a completely randomized question order and randomized option layout.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>Fisher-Yates algorithmic array permutation on session start</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>Zero correctOptionIds exposed in client runtime bundle</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>Statutory CMR 2017 regulatory compliance question banks</span>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    variant="primary"
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold px-6 py-3 rounded-xl shadow-md cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Try Practice Test
                  </Button>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 shadow-xl space-y-4 font-mono text-xs text-slate-700">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 font-sans text-xs font-bold text-slate-500">
                  <span>Candidate Session Payload</span>
                  <span className="text-emerald-600">● Live Randomized</span>
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                  <p className="text-purple-700 font-bold font-sans">Question #1 (Candidate A):</p>
                  <p className="font-sans text-slate-900 font-semibold">&quot;Under CMR 2017, Regulation 153, what is the maximum permissible velocity of air in a coal mine shaft?&quot;</p>
                  <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] font-sans">
                    <span className="p-2 rounded bg-slate-50 border">A: 8 m/sec</span>
                    <span className="p-2 rounded bg-slate-50 border">B: 15 m/sec</span>
                    <span className="p-2 rounded bg-slate-50 border">C: 10 m/sec</span>
                    <span className="p-2 rounded bg-slate-50 border">D: 5 m/sec</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-purple-50/80 border border-purple-200 text-purple-900 font-sans text-[11px]">
                  💡 For Candidate B, this question appears as Question #14 with options dynamically rearranged.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2.5: Mining Statutory Syllabus Coverage */}
        <section className="py-20 bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
              <span className="font-poppins text-xs font-bold px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Statutory Curriculum Alignment
              </span>
              <h2 className="font-poppins text-3xl sm:text-4xl font-black text-[#1E1B4B] tracking-tight">
                Built Around Coal Mines Regulations (CMR 2017)
              </h2>
              <p className="font-inter text-base text-slate-600 leading-relaxed">
                Pre-loaded and custom question banking covering mandatory competency subjects for Indian mining engineers, managers, and DGMS candidates.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-7 rounded-3xl bg-white border border-slate-200/80 shadow-md space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                  01
                </div>
                <h3 className="font-poppins font-bold text-lg text-[#1E1B4B]">
                  Mine Ventilation & Gas Dynamics
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Regulation 153 to 175: Permissible air velocities, split airways, methane ppm thresholds, and carbon monoxide detectors.
                </p>
              </div>

              <div className="p-7 rounded-3xl bg-white border border-slate-200/80 shadow-md space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm">
                  02
                </div>
                <h3 className="font-poppins font-bold text-lg text-[#1E1B4B]">
                  Strata Control & Support Plans
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Systematic Support Rules (SSR), roof bolting resin anchorage, depillaring guidelines, and Rock Mass Rating (RMR) assessments.
                </p>
              </div>

              <div className="p-7 rounded-3xl bg-white border border-slate-200/80 shadow-md space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
                  03
                </div>
                <h3 className="font-poppins font-bold text-lg text-[#1E1B4B]">
                  Blasting & Explosives Safety
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Permitted explosives, Nonel initiation, misfire protocols, danger zone radius, and statutory powder factor calculations.
                </p>
              </div>

              <div className="p-7 rounded-3xl bg-white border border-slate-200/80 shadow-md space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                  04
                </div>
                <h3 className="font-poppins font-bold text-lg text-[#1E1B4B]">
                  Opencast & HEMM Standards
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Heavy Earth Moving Machinery safety, bench heights, haul road gradients, dump slope stability, and berm specifications.
                </p>
              </div>

              <div className="p-7 rounded-3xl bg-white border border-slate-200/80 shadow-md space-y-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm">
                  05
                </div>
                <h3 className="font-poppins font-bold text-lg text-[#1E1B4B]">
                  Mine Emergency & Safety Plans
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Standing orders, spontaneous combustion management, inundation barriers, rescue apparatus, and DGMS notification procedures.
                </p>
              </div>

              <div className="p-7 rounded-3xl bg-white border border-slate-200/80 shadow-md space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                  06
                </div>
                <h3 className="font-poppins font-bold text-lg text-[#1E1B4B]">
                  Legislation & DGMS Circulars
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The Mines Act 1952, statutory duties of Managers, Safety Officers, and Overmen, plus technical circulars from DGMS Dhanbad.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2.6: Feature Comparison Table */}
        <section className="py-20 bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
              <span className="font-poppins text-xs font-bold px-3.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                Industry Comparison
              </span>
              <h2 className="font-poppins text-3xl sm:text-4xl font-black text-[#1E1B4B] tracking-tight">
                Why MinesQuiz Surpasses Generic Assessment Tools
              </h2>
              <p className="font-inter text-base text-slate-600 leading-relaxed">
                Standard form builders and generic quiz platforms lack the cryptographic invariants and client-side AI invigilation needed for statutory credentials.
              </p>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-slate-200 shadow-xl">
              <table className="w-full text-left border-collapse font-inter text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold font-poppins text-slate-600">
                    <th className="py-4 px-6">Capability / Security Parameter</th>
                    <th className="py-4 px-6">Generic Forms</th>
                    <th className="py-4 px-6">Standard LMS</th>
                    <th className="py-4 px-6 bg-purple-50 text-purple-900 border-l border-r border-purple-200">MinesQuiz Engine</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-4 px-6 font-semibold text-slate-900">Zero-Knowledge Answer Delivery (No browser answer leaks)</td>
                    <td className="py-4 px-6 text-red-500 font-medium">Vulnerable in Inspector</td>
                    <td className="py-4 px-6 text-amber-500 font-medium">Partial Encryption</td>
                    <td className="py-4 px-6 bg-purple-50/50 text-emerald-700 font-bold border-l border-r border-purple-200">100% Stripped Client Payload</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-4 px-6 font-semibold text-slate-900">Fisher-Yates Question & Option Permutation</td>
                    <td className="py-4 px-6 text-slate-500">Static Order</td>
                    <td className="py-4 px-6 text-slate-500">Question-only Shuffle</td>
                    <td className="py-4 px-6 bg-purple-50/50 text-emerald-700 font-bold border-l border-r border-purple-200">Full Dual Permutation (Q + A)</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-4 px-6 font-semibold text-slate-900">Edge Face Mesh & Tri-Axis Gaze Detection</td>
                    <td className="py-4 px-6 text-slate-400">None</td>
                    <td className="py-4 px-6 text-slate-400">Requires Heavy Plugin</td>
                    <td className="py-4 px-6 bg-purple-50/50 text-emerald-700 font-bold border-l border-r border-purple-200">468 Landmarks in WebAssembly</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-4 px-6 font-semibold text-slate-900">Candidate Privacy (Zero Cloud Video Storage)</td>
                    <td className="py-4 px-6 text-slate-400">N/A</td>
                    <td className="py-4 px-6 text-red-500 font-medium">Full Video Uploaded</td>
                    <td className="py-4 px-6 bg-purple-50/50 text-emerald-700 font-bold border-l border-r border-purple-200">100% Local RAM Processing</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-4 px-6 font-semibold text-slate-900">Single-Attempt Email Hash Lock</td>
                    <td className="py-4 px-6 text-red-500 font-medium">Easy Multiple Submissions</td>
                    <td className="py-4 px-6 text-amber-500 font-medium">Manual Reset Required</td>
                    <td className="py-4 px-6 bg-purple-50/50 text-emerald-700 font-bold border-l border-r border-purple-200">Cryptographic Hash Lock</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-4 px-6 font-semibold text-slate-900">Sole Admin Privilege with Gmail OTP 2FA</td>
                    <td className="py-4 px-6 text-slate-400">Shared Password</td>
                    <td className="py-4 px-6 text-slate-400">Basic Login</td>
                    <td className="py-4 px-6 bg-purple-50/50 text-emerald-700 font-bold border-l border-r border-purple-200">Gmail SMTP OTP + Scrypt Hash</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Section 3: Instant Grading & Integrity Reports */}
        <section className="py-20 bg-[#FAF5FF] border-b border-purple-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 mb-14">
            <h2 className="font-poppins text-3xl sm:text-4xl font-black text-[#1E1B4B] tracking-tight">
              Instant Scoring with Violation Telemetry
            </h2>
            <p className="font-inter text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Examiners and candidates receive an automated scorecard immediately upon submission, combining objective knowledge marks with proctoring integrity scores.
            </p>
          </div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-white border border-purple-200 shadow-sm space-y-3">
              <Award className="w-8 h-8 text-amber-500" />
              <h3 className="font-poppins font-bold text-lg text-[#1E1B4B]">Objective Grading</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automated calculation based on statutory syllabus questions, passing benchmark comparison, and negative marking adjustments.
              </p>
            </div>
            <div className="p-6 rounded-3xl bg-white border border-purple-200 shadow-sm space-y-3">
              <ShieldAlert className="w-8 h-8 text-purple-600" />
              <h3 className="font-poppins font-bold text-lg text-[#1E1B4B]">Integrity Rating</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Timestamped audit logs detailing gaze deviations, absence occurrences, and window-blur events during the exam duration.
              </p>
            </div>
            <div className="p-6 rounded-3xl bg-white border border-purple-200 shadow-sm space-y-3">
              <FileSpreadsheet className="w-8 h-8 text-blue-600" />
              <h3 className="font-poppins font-bold text-lg text-[#1E1B4B]">Statutory Breakdown</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Section-wise performance review across mine ventilation, mine gases, blasting safety, and statutory haulage regulations.
              </p>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <V4FaqSection
          title="Features & Examination FAQs"
          subtitle="Clear answers about dynamic question permutation, sandbox boundaries, and grading rules."
          faqs={featureFaqs}
        />

        {/* Footer */}
        <V4GreyFooter />

      </div>
  );
}
