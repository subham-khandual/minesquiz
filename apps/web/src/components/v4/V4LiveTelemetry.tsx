'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  GraduationCap,
  School,
  Briefcase,
  FileCheck2,
  CheckCircle2,
  Video,
  Mic,
  MonitorCheck,
  Clock
} from 'lucide-react';

export const V4LiveTelemetry: React.FC = () => {
  const [selectedAnswer, setSelectedAnswer] = useState<number>(1); // O(log n)

  const audiences = [
    {
      id: 'colleges',
      icon: GraduationCap,
      color: 'from-blue-500 to-indigo-600',
      title: 'Colleges & Universities',
      desc: 'Conduct semester midterms, final examinations, and campus placement coding assessments with zero cheating.',
      count: '45+ Universities',
    },
    {
      id: 'schools',
      icon: School,
      color: 'from-indigo-500 to-purple-600',
      title: 'Schools & Olympiads',
      desc: 'Seamless talent searches, STEM quizzes, and unit assessments with a distraction-free student interface.',
      count: '60+ Schools',
    },
    {
      id: 'corporate',
      icon: Briefcase,
      color: 'from-purple-500 to-pink-600',
      title: 'Corporate Skill Trainees',
      desc: 'Pre-employment technical screenings, fresher onboarding benchmarks, and employee compliance testing.',
      count: '30+ Enterprises',
    },
    {
      id: 'certification',
      icon: FileCheck2,
      color: 'from-blue-600 to-emerald-600',
      title: 'Certification Providers',
      desc: 'High-stakes remote certifications with verifiable cryptographic reports and multi-factor biometric logs.',
      count: '25+ Exam Bodies',
    },
  ];

  return (
    <section
      id="use-cases"
      className="py-24 bg-[#FAF5FF] border-b border-purple-100 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header (Badge strictly removed as requested) */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-poppins text-4xl sm:text-5xl lg:text-[52px] font-black tracking-tight text-[#1E1B4B]"
          >
            Who Can Use{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600">
              MinesQuiz?
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-inter text-base sm:text-lg text-slate-600 leading-relaxed"
          >
            Tailored for universities, corporate training, and certification bodies demanding 100% academic integrity.
          </motion.p>
        </div>

        {/* 2-Column Grid: Left Real-Time Proctoring Terminal & Right Audience Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Live Proctoring Terminal (6 cols) */}
          <div className="lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="p-7 rounded-3xl bg-white border border-purple-200 shadow-xl shadow-purple-500/5 space-y-5"
            >
              {/* Question Header & Palette */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5 font-inter">
                  <span className="px-3 py-1 rounded-xl bg-purple-100 text-purple-700 text-xs font-bold font-poppins">
                    Q12 of 12
                  </span>
                  <span className="text-xs sm:text-sm text-slate-500 font-semibold">Algorithms & Complexity</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-purple-600 font-inter">
                  <Clock className="w-4 h-4" />
                  <span>00:24:10</span>
                </div>
              </div>

              {/* Question Text */}
              <div>
                <h4 className="font-poppins text-base sm:text-lg font-bold text-[#1E1B4B]">
                  The time complexity of binary search on a sorted array of size n is:
                </h4>
              </div>

              {/* Radio Options */}
              <div className="space-y-2.5 font-inter">
                {[
                  { id: 0, text: 'O(n)' },
                  { id: 1, text: 'O(log n)' },
                  { id: 2, text: 'O(n log n)' },
                  { id: 3, text: 'O(1)' },
                ].map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedAnswer(opt.id)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl text-sm font-semibold cursor-pointer transition-all ${
                      selectedAnswer === opt.id
                        ? 'bg-purple-50 border border-purple-400 text-purple-900 shadow-xs font-bold'
                        : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100/70'
                    }`}
                  >
                    <span>{opt.text}</span>
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        selectedAnswer === opt.id
                          ? 'border-purple-600 bg-purple-600'
                          : 'border-slate-300'
                      }`}
                    >
                      {selectedAnswer === opt.id && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                  </div>
                ))}
              </div>

              {/* Question Grid Palette */}
              <div className="pt-2">
                <span className="font-poppins text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                  Question Palette
                </span>
                <div className="grid grid-cols-6 gap-2 text-center font-poppins">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                    <div
                      key={num}
                      className={`py-1.5 text-xs sm:text-sm font-bold rounded-xl border transition-colors ${
                        num === 12
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : num < 8
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {num}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Secured Status Bar */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between font-inter">
                <div className="flex items-center gap-3.5 text-xs sm:text-sm text-slate-500">
                  <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                    <Video className="w-4 h-4" /> Cam: OK
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                    <Mic className="w-4 h-4" /> Mic: Clean
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                    <MonitorCheck className="w-4 h-4" /> Tab: Locked
                  </span>
                </div>

                <div className="font-poppins px-3.5 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-xs">
                  Session Secured ✓
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: 4 Institutional Category Cards (6 cols) */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {audiences.map((aud, idx) => {
              const Icon = aud.icon;
              return (
                <motion.div
                  key={aud.id}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  className="p-6 rounded-3xl bg-white border border-purple-200/80 shadow-md shadow-purple-500/5 hover:shadow-xl hover:border-purple-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3.5">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${aud.color} flex items-center justify-center text-white shadow-md shadow-indigo-500/20`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    <h3 className="font-poppins text-lg font-bold text-[#1E1B4B]">
                      {aud.title}
                    </h3>
                    <p className="font-inter text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {aud.desc}
                    </p>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-purple-100 flex items-center justify-between text-xs sm:text-sm font-bold text-purple-700 font-inter">
                    <span>{aud.count}</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
};
