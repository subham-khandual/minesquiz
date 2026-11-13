'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { V4Navbar } from '../../components/v4/V4Navbar';
import { V4TrustSecurity } from '../../components/v4/V4TrustSecurity';
import { V4FaqSection } from '../../components/v4/V4FaqSection';
import { V4GreyFooter } from '../../components/v4/V4GreyFooter';
import { LoginModal } from '../../components/auth/LoginModal';
import { motion } from 'motion/react';
import { ShieldCheck, Lock, KeyRound, Mail, CheckCircle2, ShieldAlert, Database, FileKey, Scale, Server, FileText } from 'lucide-react';
import { Button } from '@mines-quiz/ui';

export default function TrustAndSecurityPage() {
  const router = useRouter();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const securityFaqs = [
    {
      question: 'Why is there a single Administrator authority allowed?',
      answer:
        'To enforce strict enterprise governance and prevent unauthorized privilege escalation, the platform restricts Administrator authority exclusively to subhamkhandual215@gmail.com. All other emails are blocked at the API level.',
    },
    {
      question: 'How are administrator passwords secured?',
      answer:
        'Admin passwords are never stored in plaintext. They are hashed using Node.js native crypto.scryptSync with 16-byte cryptographically random salts. Timing-safe equality checks prevent side-channel timing attacks.',
    },
    {
      question: 'How does the Gmail SMTP OTP verification work?',
      answer:
        'Setting up or resetting the admin password requires a 6-digit OTP sent directly via Google Gmail SMTP SSL/TLS to the verified admin email. Verification codes expire after 5 minutes.',
    },
    {
      question: 'Are statutory questions and answers encrypted?',
      answer:
        'Yes. Statutory question banks are transmitted over TLS 1.3. Correct answer options are stripped from candidate payloads, and answers are only evaluated during secure submission grading.',
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
              Enterprise Security Architecture
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-poppins text-4xl sm:text-5xl lg:text-6xl font-black text-[#1E1B4B] tracking-tight max-w-4xl mx-auto"
            >
              Zero-Trust Examination &{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-600 to-blue-600">
                Data Security
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-inter text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed"
            >
              Learn how MinesQuiz protects statutory exam integrity through single-admin Gmail SMTP verification, cryptographic scrypt hashing, and strict sandbox boundaries.
            </motion.p>
          </div>
        </section>

        {/* Section 1: Main Trust & Security Grid */}
        <V4TrustSecurity />

        {/* Section 2: Single Sole Admin Protocol */}
        <section className="py-20 bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <span className="font-poppins text-xs font-bold px-3.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  Strict Access Governance
                </span>
                <h2 className="font-poppins text-3xl sm:text-4xl font-black text-[#1E1B4B] tracking-tight">
                  Single Sole Admin Whitelist Protocol
                </h2>
                <p className="font-inter text-base text-slate-600 leading-relaxed">
                  Unlike multi-tenant systems vulnerable to privilege escalation, MinesQuiz strictly locks administrative authority to a single verified address: <strong>subhamkhandual215@gmail.com</strong>.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>Two-step Gmail SMTP OTP verification required before setting master password</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>Single-use 10-minute reset tokens defend against replay attacks</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>All unauthorized login or OTP requests rejected with HTTP 403 Forbidden</span>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    variant="primary"
                    onClick={() => setIsLoginModalOpen(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-xl shadow-md cursor-pointer"
                  >
                    Open Admin Portal
                  </Button>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-purple-50/60 border border-purple-200 shadow-xl space-y-4 font-mono text-xs text-purple-900">
                <div className="flex items-center justify-between pb-3 border-b border-purple-200 font-sans text-xs font-bold text-purple-800">
                  <span>Governance Audit Log</span>
                  <span className="text-emerald-700">● Strict Whitelist Active</span>
                </div>
                <div className="p-4 rounded-xl bg-white border border-purple-200 space-y-1.5 font-sans">
                  <p className="text-purple-700 font-bold">Authorized Sole Admin:</p>
                  <p className="text-slate-900 font-mono text-xs">subhamkhandual215@gmail.com</p>
                  <p className="text-slate-500 text-[11px] pt-1">Status: Double-gated via Gmail SMTP & scrypt hash</p>
                </div>
                <div className="p-4 rounded-xl bg-white border border-purple-200 space-y-1.5 font-sans">
                  <p className="text-rose-700 font-bold">Unauthorized Identities:</p>
                  <p className="text-slate-500 text-[11px]">All non-whitelisted emails are rejected with HTTP 403</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Statutory DGMS & DPDP Act 2023 Compliance Matrix */}
        <section className="py-20 bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <span className="font-poppins text-xs font-bold px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Institutional Compliance
              </span>
              <h2 className="font-poppins text-3xl sm:text-4xl font-black text-[#1E1B4B] tracking-tight">
                Regulatory Alignment with DGMS & Privacy Law
              </h2>
              <p className="font-inter text-base text-slate-600 leading-relaxed">
                Engineered to satisfy Directorate General of Mines Safety computerized assessment rules and India Digital Personal Data Protection (DPDP) Act 2023.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-md space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                  <Scale className="w-6 h-6" />
                </div>
                <h3 className="font-poppins font-bold text-lg text-[#1E1B4B]">Mines Act 1952 Ready</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Conforms with statutory competency certification guidelines for Mine Managers, Safety Officers, and Surveyors under DGMS oversight.
                </p>
              </div>

              <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-md space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="font-poppins font-bold text-lg text-[#1E1B4B]">DPDP Act 2023 Compliant</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Strict data minimization: Candidate webcam footage is processed in RAM and destroyed instantly. No facial embeddings are retained on server disks.
                </p>
              </div>

              <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-md space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center">
                  <Server className="w-6 h-6" />
                </div>
                <h3 className="font-poppins font-bold text-lg text-[#1E1B4B]">Tamper-Proof Audit Trail</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Candidate scores, strike timestamps, and submission hashes are immutable. Results can be verified against administrative master records.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <V4FaqSection
          title="Security, Auth & Compliance FAQs"
          subtitle="Detailed technical answers about cryptographic hashing, OTP policies, and anti-leak protections."
          faqs={securityFaqs}
        />

        {/* Footer */}
        <V4GreyFooter />

      </div>
  );
}
