'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  UserCheck,
  Camera,
  Award,
  ShieldCheck,
  ArrowRight,
  Scan,
  Check
} from 'lucide-react';

interface V4VerificationFlowProps {
  onStartExam?: () => void;
}

export const V4VerificationFlow: React.FC<V4VerificationFlowProps> = ({ onStartExam }) => {
  const [activeStep, setActiveStep] = useState<number>(1);

  const steps = [
    {
      step: 1,
      title: 'Identity Authentication',
      subtitle: 'Single-attempt email or Roll Number verification',
      description:
        'Students and trainees sign in securely with their designated institutional email or roll number. The system verifies candidate eligibility and enforces the strict single-attempt rule.',
      icon: UserCheck,
    },
    {
      step: 2,
      title: 'Biometric Face Verification',
      subtitle: '3-second instant camera alignment',
      description:
        'WebRTC camera initiates an automated 3D facial verification check. The AI matches facial landmarks and confirms candidate presence before granting quiz access.',
      icon: Camera,
    },
    {
      step: 3,
      title: 'Secure Exam & Results',
      subtitle: 'Locked attempt with live proctoring & score',
      description:
        'Attempt questions in full-screen locked mode. Upon completion or violation cutoff, automated evaluation generates immediate tamper-proof scores and audit logs.',
      icon: Award,
    },
  ];

  return (
    <section
      id="how-it-works"
      className="py-24 bg-[#F0F7FF] border-b border-blue-100 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading (Badge strictly removed as requested) */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-poppins text-4xl sm:text-5xl lg:text-[52px] font-black tracking-tight text-[#1E1B4B]"
          >
            How <span className="text-[#6D28D9]">MinesQuiz</span> Works?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-inter text-base sm:text-lg text-slate-600 leading-relaxed"
          >
            From seamless biometric onboarding to fair evaluation, designed for student and trainee confidence.
          </motion.p>
        </div>

        {/* 2-Column Grid: Left Stepper & Right Female Student Biometric Verification Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: 3-Step Interactive Process (6 cols) */}
          <div className="lg:col-span-6 space-y-5 font-inter">
            {steps.map((item) => {
              const isActive = activeStep === item.step;
              return (
                <motion.div
                  key={item.step}
                  onClick={() => setActiveStep(item.step)}
                  whileHover={{ x: 6, scale: 1.01 }}
                  className={`p-6 rounded-3xl border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white border-blue-400 shadow-xl shadow-blue-500/10'
                      : 'bg-white/80 border-blue-200/60 hover:bg-white'
                  }`}
                >
                  <div className="flex items-start gap-5">
                    <div
                      className={`font-poppins w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 font-black text-xl transition-transform ${
                        isActive
                          ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 scale-105'
                          : 'bg-blue-100/70 text-slate-700'
                      }`}
                    >
                      {item.step}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <h3 className="font-poppins text-lg sm:text-xl font-bold text-[#1E1B4B]">
                          {item.title}
                        </h3>
                        {isActive && (
                          <span className="font-inter px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                            Active Step
                          </span>
                        )}
                      </div>
                      <p className="font-inter text-xs sm:text-sm font-semibold text-purple-600">
                        {item.subtitle}
                      </p>
                      <p className="font-inter text-sm text-slate-600 leading-relaxed pt-1">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Right Column: Female Student Biometric Verification Showcase (6 cols) */}
          <div id="verification" className="lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative p-7 sm:p-9 rounded-3xl bg-white border border-blue-200 shadow-2xl shadow-blue-500/10"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                <div className="flex items-center gap-2.5 font-poppins">
                  <Scan className="w-6 h-6 text-purple-600" />
                  <span className="text-base font-bold text-[#1E1B4B]">
                    Female Student Biometric Verification
                  </span>
                </div>
                <span className="font-inter text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1.5">
                  <Check className="w-4 h-4 stroke-[3]" /> Match 99.8%
                </span>
              </div>

              {/* Character Photo in Biometric Frame */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                <div className="sm:col-span-5 relative flex justify-center">
                  <div className="relative w-44 sm:w-full rounded-2xl overflow-hidden bg-gradient-to-b from-blue-50 to-purple-50 p-2.5 border-2 border-blue-200 shadow-md">
                    {/* Bounding box brackets */}
                    <div className="absolute inset-2 z-10 pointer-events-none rounded-xl border border-dashed border-emerald-400">
                      <span className="absolute -top-1 -left-1 w-3.5 h-3.5 border-t-2 border-l-2 border-emerald-500" />
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 border-t-2 border-r-2 border-emerald-500" />
                      <span className="absolute -bottom-1 -left-1 w-3.5 h-3.5 border-b-2 border-l-2 border-emerald-500" />
                      <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 border-b-2 border-r-2 border-emerald-500" />
                    </div>

                    {/* Female Student Image (Directly from /images/female-student.jpg) */}
                    <img
                      src="/images/female-student.jpg"
                      alt="Verified Female Student Candidate"
                      className="w-full h-auto object-cover rounded-xl"
                    />
                  </div>
                </div>

                {/* Candidate Biometric Checklist */}
                <div className="sm:col-span-7 space-y-4 font-inter">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Candidate Details
                    </span>
                    <h4 className="font-poppins text-lg font-bold text-[#1E1B4B]">
                      Ananya Sharma (Verified Student)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Exam: CS101 • Engineering Aptitude
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs sm:text-sm font-medium">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                      <span className="text-slate-600">Facial Geometry Match</span>
                      <span className="font-bold text-emerald-600">PASS (0.02 delta)</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                      <span className="text-slate-600">Lighting & Contrast</span>
                      <span className="font-bold text-emerald-600">Optimal (94%)</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                      <span className="text-slate-600">Secondary Person Check</span>
                      <span className="font-bold text-emerald-600">Zero Detected</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ready to Attempt Action */}
              <div className="mt-7 pt-5 border-t border-slate-100 flex items-center justify-between font-inter">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <span>Integrity verification complete</span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onStartExam}
                  className="font-poppins inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <span>Launch Assessment</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          </div>

        </div>

      </div>
    </section>
  );
};
