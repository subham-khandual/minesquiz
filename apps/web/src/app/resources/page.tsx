'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { V4Navbar } from '../../components/v4/V4Navbar';
import { V4Resources } from '../../components/v4/V4Resources';
import { V4FaqSection } from '../../components/v4/V4FaqSection';
import { V4GreyFooter } from '../../components/v4/V4GreyFooter';
import { LoginModal } from '../../components/auth/LoginModal';
import { motion } from 'motion/react';
import { BookOpen, Code2, ClipboardCheck, ArrowRight, Play, CheckCircle2, Download, FileSpreadsheet, FileText, Compass, ExternalLink } from 'lucide-react';
import { Button } from '@mines-quiz/ui';

export default function ResourcesPage() {
  const router = useRouter();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const resourceFaqs = [
    {
      question: 'Where can I access the 21-phase System Design AI Prompt Kit?',
      answer:
        'The complete framework is saved in the repository at docs/SYSTEM_DESIGN_AI_KIT.md. It contains 21 systematic phases covering request tracing, DB scaling, LLD/HLD diagrams, and capacity planning.',
    },
    {
      question: 'Are the practice questions aligned with DGMS Coal Mines Regulations 2017?',
      answer:
        'Yes. Questions directly test statutory provisions of CMR 2017 including Mine Ventilation (Regulation 153), Dangerous Gases thresholds, Explosive Storage & Blasting, and Winding Gear safety.',
    },
    {
      question: 'Can candidates download a summary of their results?',
      answer:
        'Yes. After completing an exam session, candidates can view their detailed scorecard with statutory marks, question explanations, and proctoring audit integrity ratings.',
    },
    {
      question: 'Is access to the resources and mock question bank free?',
      answer:
        'Yes. MinesQuiz provides open access to the statutory curriculum guidelines, candidate preparation checklists, and standard practice mock questions.',
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
        <section className="relative py-20 bg-gradient-to-b from-[#FFF7ED] via-[#F0F7FF] to-white border-b border-orange-100 overflow-hidden">
          {/* Subtle ambient light orange and bluish background glows */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-200/25 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-200/25 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-poppins text-xs font-bold px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-50 to-blue-50 text-slate-800 border border-orange-200/70 inline-block shadow-xs"
            >
              Curriculum & Technical Documentation
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-poppins text-4xl sm:text-5xl lg:text-6xl font-black text-[#1E1B4B] tracking-tight max-w-4xl mx-auto"
            >
              Examination & Engineering{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-600 to-blue-600">
                Resources
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-inter text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed"
            >
              Access official Coal Mines Regulations syllabus modules, the 21-phase system design AI exploration kit, and candidate preparation checklists.
            </motion.p>
          </div>
        </section>

        {/* Section 1: Main Resources Grid */}
        <V4Resources />

        {/* Section 1.5: Statutory Mining Certification Blueprints */}
        <section className="py-20 bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
              <span className="font-poppins text-xs font-bold px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Examination Blueprints
              </span>
              <h2 className="font-poppins text-3xl sm:text-4xl font-black text-[#1E1B4B] tracking-tight">
                Statutory DGMS Competency Blueprints
              </h2>
              <p className="font-inter text-base text-slate-600 leading-relaxed">
                Structured curriculum mapping and statutory mark weighting for Board of Mining Examinations certifications.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-md space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="font-poppins text-xs font-bold px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 inline-block">
                    First Class Manager
                  </span>
                  <h3 className="font-poppins font-bold text-lg text-[#1E1B4B]">
                    CMR 2017 First Class
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Legislation & Safety, Winning & Working, Mine Ventilation, Explosives & Mining Machinery. 100 marks benchmark.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 text-[11px] font-mono text-purple-700 font-bold">
                  Passing Standard: 60% Aggregate
                </div>
              </div>

              <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-md space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="font-poppins text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 inline-block">
                    Second Class Manager
                  </span>
                  <h3 className="font-poppins font-bold text-lg text-[#1E1B4B]">
                    CMR 2017 Second Class
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Underground support rules, depillaring protocols, methane gas standards, and statutory mine ventilation networks.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 text-[11px] font-mono text-blue-700 font-bold">
                  Passing Standard: 50% Aggregate
                </div>
              </div>

              <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-md space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="font-poppins text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block">
                    Overman / Sirdar
                  </span>
                  <h3 className="font-poppins font-bold text-lg text-[#1E1B4B]">
                    Overman Competency
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Daily inspection duties, dangerous gas testing with Flame Safety Lamp, haulage signals, and shot-firing precautions.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 text-[11px] font-mono text-emerald-700 font-bold">
                  Passing Standard: 50% Aggregate
                </div>
              </div>

              <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-md space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="font-poppins text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 inline-block">
                    Gas Testing
                  </span>
                  <h3 className="font-poppins font-bold text-lg text-[#1E1B4B]">
                    Statutory Gas Testing
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Gas caps calculation, percentage of firedamp (CH4), carbon monoxide gas mask filters, and air sample analysis.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 text-[11px] font-mono text-amber-700 font-bold">
                  Passing Standard: 65% Aggregate
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 1.6: Downloadable Assets & Templates */}
        <section className="py-20 bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
              <span className="font-poppins text-xs font-bold px-3.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                Download Center
              </span>
              <h2 className="font-poppins text-3xl sm:text-4xl font-black text-[#1E1B4B] tracking-tight">
                Curriculum Downloads & Examiner Templates
              </h2>
              <p className="font-inter text-base text-slate-600 leading-relaxed">
                Download official blueprints, standardized bulk question import templates, and candidate proctoring compliance guides.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-7 rounded-3xl bg-slate-50 border border-slate-200 shadow-md space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h3 className="font-poppins font-bold text-lg text-[#1E1B4B]">
                  Bulk Question Bank Template
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Standardized CSV schema with question text, option permutations, difficulty weighting, and statutory CMR tag headers.
                </p>
                <div className="pt-2">
                  <a
                    href="#download"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Sample template downloaded: mines_quiz_question_template.csv');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV Template (3.2 KB)</span>
                  </a>
                </div>
              </div>

              <div className="p-7 rounded-3xl bg-slate-50 border border-slate-200 shadow-md space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="font-poppins font-bold text-lg text-[#1E1B4B]">
                  Candidate Proctoring Handbook
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Comprehensive candidate manual on MediaPipe webcam alignment, strike limits, room lighting requirements, and appeal rules.
                </p>
                <div className="pt-2">
                  <a
                    href="#download"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Handbook downloaded: candidate_proctoring_guide.pdf');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:underline"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF Manual (1.1 MB)</span>
                  </a>
                </div>
              </div>

              <div className="p-7 rounded-3xl bg-slate-50 border border-slate-200 shadow-md space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="font-poppins font-bold text-lg text-[#1E1B4B]">
                  DGMS Safety Circulars Compendium
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Technical circulars and statutory amendments issued by Directorate General of Mines Safety (2018 to 2026).
                </p>
                <div className="pt-2">
                  <a
                    href="#download"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Compendium downloaded: dgms_statutory_circulars.pdf');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Compendium (2.4 MB)</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: 21-Phase System Design Kit Highlight */}
        <section className="py-20 bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="p-10 rounded-3xl bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="space-y-4 max-w-2xl">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-700 uppercase tracking-wider">
                  <Code2 className="w-4 h-4" />
                  <span>Senior Developer Tooling</span>
                </div>
                <h2 className="font-poppins text-3xl font-bold text-[#1E1B4B]">
                  System Design & AI Exploration Kit
                </h2>
                <p className="font-inter text-sm sm:text-base text-slate-600 leading-relaxed">
                  Learn how to master any backend codebase using our 21-phase AI prompt kit. Covers high-level and low-level design diagrams, DB scaling, distributed failure handling, and capacity estimation.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <span className="font-mono text-xs px-3 py-1.5 rounded-lg bg-white border border-purple-200 text-purple-900 font-semibold">
                    docs/SYSTEM_DESIGN_AI_KIT.md
                  </span>
                  <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                    Phases 0 to 21 Complete
                  </span>
                </div>
              </div>

              <div className="shrink-0">
                <Button
                  variant="primary"
                  onClick={() => router.push('/')}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-7 py-3.5 rounded-xl shadow-lg cursor-pointer"
                >
                  Start Practice Quiz
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <V4FaqSection
          title="Resource & Exam Preparation FAQs"
          subtitle="Common questions regarding syllabus coverage, system design documentation, and downloads."
          faqs={resourceFaqs}
        />

        {/* Footer */}
        <V4GreyFooter />

      </div>
  );
}
