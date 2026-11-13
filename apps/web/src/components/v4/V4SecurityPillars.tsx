'use client';

import React from 'react';
import { motion } from 'motion/react';
import {
  ScanFace,
  MonitorX,
  Volume2,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

export const V4SecurityPillars: React.FC = () => {
  const pillars = [
    {
      id: 'face-tracking',
      icon: ScanFace,
      iconBg: 'from-blue-500 to-indigo-600',
      tag: 'Biometric AI',
      title: 'AI Face & Gaze Tracking',
      description:
        'Continuous candidate face verification, head pose estimation, and gaze tracking to detect external glance or multiple individuals in frame.',
      features: ['Multi-face detection', 'Continuous identity check', 'Attention duration scoring'],
    },
    {
      id: 'tab-blocking',
      icon: MonitorX,
      iconBg: 'from-purple-500 to-indigo-600',
      tag: 'Lockdown Engine',
      title: 'Tab Switch & Copy Blocker',
      description:
        'Strict full-screen enforcement locks copy, cut, paste, DevTools, and keyboard shortcuts. Switching tabs triggers immediate warnings.',
      features: ['Zero copy-paste allowed', 'Full-screen enforcement', 'Auto-strike on blur'],
    },
    {
      id: 'noise-detection',
      icon: Volume2,
      iconBg: 'from-indigo-500 to-purple-600',
      tag: 'Audio AI',
      title: 'Ambient Noise Detection',
      description:
        'Real-time acoustic analysis detects whisper levels, room conversations, and secondary device audio without recording raw private chatter.',
      features: ['Decibel spike detection', 'Whisper recognition', 'Noise floor calibration'],
    },
    {
      id: 'auto-submit',
      icon: AlertTriangle,
      iconBg: 'from-amber-500 to-rose-600',
      tag: 'Strike System',
      title: 'Instant Alerts & Auto-Submit',
      description:
        'Transparent 3-strike violation warning system. Once maximum allowable infractions are crossed, the assessment is automatically submitted.',
      features: ['Live on-screen warnings', 'Timestamped audit logs', 'Instant scorecard lock'],
    },
  ];

  return (
    <section
      id="features"
      className="py-24 bg-[#FAF5FF] border-b border-purple-100 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header (Badge strictly removed as requested) */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-poppins text-4xl sm:text-5xl lg:text-[52px] font-black tracking-tight text-[#1E1B4B] leading-tight"
          >
            Powerful Features for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600">
              Secure & Reliable
            </span>{' '}
            Exams
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-inter text-base sm:text-lg text-slate-600 leading-relaxed"
          >
            Smart proctoring layers working seamlessly in parallel to safeguard test fairness,
            protect academic integrity, and keep assessment stress-free.
          </motion.p>
        </div>

        {/* 4 Cards Grid (With Framer Motion hover & viewport reveal) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-14">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group p-7 rounded-3xl bg-white border border-purple-200/80 shadow-md shadow-purple-500/5 hover:shadow-2xl hover:shadow-purple-500/15 hover:border-purple-400 transition-all flex flex-col justify-between cursor-pointer"
              >
                <div>
                  {/* Top Bar with Icon and Tag */}
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${pillar.iconBg} flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <span className="font-inter text-xs font-bold px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                      {pillar.tag}
                    </span>
                  </div>

                  {/* Title & Description (Enlarged) */}
                  <h3 className="font-poppins text-xl font-bold text-[#1E1B4B] group-hover:text-[#6D28D9] transition-colors">
                    {pillar.title}
                  </h3>
                  <p className="font-inter mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>

                {/* Sub Features Checklist */}
                <div className="mt-6 pt-5 border-t border-purple-100 space-y-2 font-inter">
                  {pillar.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
