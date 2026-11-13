'use client';

import React from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  ArrowRight,
  Play,
  Lock,
  Award
} from 'lucide-react';

interface V4HeroProps {
  onStartExam: () => void;
  onExploreFeatures?: () => void;
}

export const V4Hero: React.FC<V4HeroProps> = ({ onStartExam, onExploreFeatures }) => {
  return (
    <section
      id="home"
      className="relative pt-12 pb-24 overflow-hidden bg-[#F0F7FF] border-b border-blue-100 transition-colors"
    >
      {/* Soft Ambient Light Glows */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-blue-300/25 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-purple-300/20 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          
          {/* Left Column: Headline, Subtitle, CTAs, and Trust Signals (6 cols) */}
          <div className="lg:col-span-6 space-y-7 text-left">
            
            {/* Main Heading (Enlarged Poppins typography) */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="space-y-2"
            >
              <h1 className="font-poppins text-4xl sm:text-5xl lg:text-[54px] font-black tracking-tight leading-[1.16] cursor-default space-y-1">
                <span className="block text-[#1E1B4B] hover:text-blue-600 transition-colors duration-300">
                  Smarter Exams.
                </span>
                <span className="block text-[#1E1B4B] hover:text-purple-600 transition-colors duration-300">
                  Fairer Results.
                </span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 transition-all duration-500">
                  Powered by AI.
                </span>
              </h1>
            </motion.div>

            {/* Subtitle (Enlarged Inter text) */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="font-inter text-lg sm:text-xl text-slate-600 max-w-xl leading-relaxed"
            >
              Conduct secure, remote, and cheat-free quizzes with real-time AI face verification,
              noise detection, and intelligent behavior analysis.
            </motion.p>

            {/* CTA Buttons (Enlarged with Framer Motion physics) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="flex flex-wrap items-center gap-4 pt-1"
            >
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={onStartExam}
                className="font-poppins inline-flex items-center gap-3 px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 rounded-2xl shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Start Your Quiz</span>
                <ArrowRight className="w-5 h-5 ml-1" />
              </motion.button>

              <motion.a
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                href="#features"
                onClick={onExploreFeatures}
                className="font-poppins inline-flex items-center gap-2 px-7 py-4 text-base font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-xs hover:border-purple-300 transition-all cursor-pointer"
              >
                <span>Explore Features</span>
              </motion.a>
            </motion.div>

            {/* Trust Metrics Pill Strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="pt-3 flex flex-wrap items-center gap-3 text-xs sm:text-sm font-semibold text-slate-600"
            >
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-blue-100 shadow-2xs font-inter">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>99.9% Cheat Prevention</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-blue-100 shadow-2xs font-inter">
                <Award className="w-4 h-4 text-purple-500" />
                <span>50K+ Quizzes Completed</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-blue-100 shadow-2xs font-inter">
                <Lock className="w-4 h-4 text-blue-500" />
                <span>Single-Attempt Enforced</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Real-Time Female Student Sitting with Holographic HUD + Floating Round Quiz Time Badge (6 cols) */}
          <div className="lg:col-span-6 relative">
            
            {/* Ambient Background Glow Aura (Animated Breathing Glow) */}
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-400/30 via-indigo-300/25 to-blue-400/30 rounded-3xl blur-3xl transform scale-95 animate-pulse-glow pointer-events-none" />

            {/* Floating Small Round Circle: 3D Quiz Time Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: [0, -10, 0],
                rotate: [-2, 2, -2],
              }}
              transition={{
                opacity: { duration: 0.6 },
                scale: { duration: 0.6 },
                y: { repeat: Infinity, duration: 4.5, ease: 'easeInOut' },
                rotate: { repeat: Infinity, duration: 6, ease: 'easeInOut' },
              }}
              whileHover={{
                scale: 1.12,
                y: -14,
                rotate: 0,
                transition: { duration: 0.25 },
              }}
              className="absolute -top-6 -right-3 sm:-right-5 z-20 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white p-2 border-2 border-purple-300/90 shadow-2xl shadow-purple-500/30 flex items-center justify-center cursor-pointer group backdrop-blur-sm"
              title="Quiz Time!"
            >
              <img
                src="/images/quiz-time-badge.jpg"
                alt="Quiz Time Badge"
                className="w-full h-full object-contain rounded-full group-hover:scale-105 transition-transform drop-shadow-sm"
              />
            </motion.div>

            {/* Main Stage: High-Resolution Real-Time Female Student with MinesQuiz Laptop & Holographic HUD */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="relative z-10 rounded-3xl sm:rounded-[36px] overflow-hidden bg-white p-2.5 sm:p-3 border-2 border-purple-200/90 shadow-2xl shadow-indigo-500/20 group"
            >
              <div className="relative rounded-2xl sm:rounded-[28px] overflow-hidden bg-slate-900">
                <img
                  src="/images/hero-student-proctoring.jpg"
                  alt="Real-time Female Student Taking Proctored Exam on MinesQuiz Laptop"
                  className="w-full h-auto object-cover group-hover:scale-102 transition-transform duration-700"
                />
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};
