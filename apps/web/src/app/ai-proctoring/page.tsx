'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { V4Navbar } from '../../components/v4/V4Navbar';
import { V4LiveTelemetry } from '../../components/v4/V4LiveTelemetry';
import { V4FaqSection } from '../../components/v4/V4FaqSection';
import { V4GreyFooter } from '../../components/v4/V4GreyFooter';
import { LoginModal } from '../../components/auth/LoginModal';
import { motion } from 'motion/react';
import { Eye, ShieldCheck, Cpu, Volume2, UserX, Compass, WifiOff, Activity, ShieldAlert, MonitorOff, Mic } from 'lucide-react';

export default function AiProctoringPage() {
  const router = useRouter();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const proctoringFaqs = [
    {
      question: 'Is my webcam video uploaded or stored on any server?',
      answer:
        'No. MinesQuiz processes all 468 MediaPipe facial landmarks locally in your browser sandbox. Video frames are never uploaded, recorded, or stored on backend servers, ensuring absolute candidate privacy.',
    },
    {
      question: 'What is the acceptable head rotation threshold before a warning is triggered?',
      answer:
        'The mathematical gaze estimator allows natural slight movement up to 25 degrees yaw (left or right) and 20 degrees pitch (up or down). Exceeding these angles triggers an on-screen deviation alert.',
    },
    {
      question: 'How does the acoustic noise scanner work?',
      answer:
        'The audio analyzer tracks ambient decibel levels via your microphone input. If sudden whispering, speech patterns, or background prompting are detected, an acoustic warning is registered.',
    },
    {
      question: 'What happens if a second person enters the camera frame?',
      answer:
        'The MediaPipe face detection model continuously counts visible faces in the webcam viewport. Detecting two or more faces immediately logs a multi-face violation strike.',
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

        {/* Page Hero Banner with Realistic AI Biometric Proctoring Background */}
        <section className="relative py-28 overflow-hidden bg-[#1E1B4B] border-b border-blue-900/40">
          {/* Realistic Background Image with High-Tech AI Overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src="/images/ai-proctoring-hero-bg.jpg"
              alt="AI Computer Vision Biometric Proctoring"
              className="w-full h-full object-cover object-center transform scale-105"
            />
            {/* Deep Navy Violet Cybernetic Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F19]/85 via-[#1E1B4B]/80 to-[#1E1B4B]/95 backdrop-blur-[1.5px]" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-poppins text-xs font-bold px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-blue-200 border border-white/20 inline-flex items-center gap-1.5 shadow-xl"
            >
              <Eye className="w-3.5 h-3.5 text-blue-300" />
              Client-Side Computer Vision
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-poppins text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto drop-shadow-lg"
            >
              In-Browser MediaPipe{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-200 to-purple-300">
                AI Proctoring
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-inter text-base sm:text-lg text-blue-100/90 max-w-2xl mx-auto leading-relaxed"
            >
              Precision 3D facial landmark estimation, head pose tracking, absence alerts, and acoustic noise monitoring running 100% locally on candidate hardware.
            </motion.p>

            {/* Quick Hero Proctoring Telemetry Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="pt-4 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-white/90"
            >
              <span className="px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                468 3D Mesh Landmarks
              </span>
              <span className="px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                0 MB Cloud Video Storage
              </span>
              <span className="px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-purple-300" />
                &lt;35ms Vector Latency
              </span>
            </motion.div>
          </div>
        </section>

        {/* Section 1: Live Proctoring Telemetry */}
        <V4LiveTelemetry />

        {/* Section 2: Mathematical Head Pose & Gaze Architecture */}
        <section className="py-20 bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
              <h2 className="font-poppins text-3xl sm:text-4xl font-black text-[#1E1B4B] tracking-tight">
                Tri-Axis Angular Pose Estimation
              </h2>
              <p className="font-inter text-base text-slate-600 leading-relaxed">
                Using 468 landmark coordinates from MediaPipe Face Mesh, MinesQuiz calculates exact 3D orientation vectors in real time without sending frames to the cloud.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-md space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center">
                  <Compass className="w-6 h-6" />
                </div>
                <h3 className="font-poppins font-bold text-xl text-[#1E1B4B]">Yaw (Lateral Turn)</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Monitors left and right head rotation with a statutory 25-degree threshold. Flags candidates looking at secondary monitors or unauthorized companions.
                </p>
                <div className="text-xs font-mono font-bold text-purple-700 bg-purple-50 p-2 rounded-xl">
                  Threshold: ±25.0° Max Deviation
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-md space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                  <Eye className="w-6 h-6" />
                </div>
                <h3 className="font-poppins font-bold text-xl text-[#1E1B4B]">Pitch (Elevation)</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Tracks upward and downward head tilt with a 20-degree threshold. Detects candidates looking down at notes, textbooks, or mobile phones on their desk.
                </p>
                <div className="text-xs font-mono font-bold text-blue-700 bg-blue-50 p-2 rounded-xl">
                  Threshold: ±20.0° Max Deviation
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-md space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                  <UserX className="w-6 h-6" />
                </div>
                <h3 className="font-poppins font-bold text-xl text-[#1E1B4B]">Absence & Multi-Face</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Zero-face conditions (leaving the desk) and multi-face conditions (second person entering frame) are flagged with immediate countdown warnings.
                </p>
                <div className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 p-2 rounded-xl">
                  Condition: Exactly 1 Face Enforced
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Privacy & Edge Computing */}
        <section className="py-20 bg-[#FAF5FF] border-b border-purple-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="p-10 rounded-3xl bg-white border border-purple-200 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="space-y-4 max-w-2xl">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-700 uppercase tracking-wider">
                  <Cpu className="w-4 h-4" />
                  <span>Edge Architecture</span>
                </div>
                <h2 className="font-poppins text-3xl font-bold text-[#1E1B4B]">
                  100% Privacy-Preserving Computer Vision
                </h2>
                <p className="font-inter text-sm sm:text-base text-slate-600 leading-relaxed">
                  Unlike traditional platforms that stream thousands of raw video feeds to expensive cloud servers, MinesQuiz runs lightweight WebAssembly models directly inside the candidate browser. Video never leaves the user computer.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto shrink-0">
                <div className="p-5 rounded-2xl bg-purple-50 border border-purple-200 text-center min-w-[140px]">
                  <p className="font-poppins text-3xl font-black text-purple-700">0 MB</p>
                  <p className="font-inter text-xs font-semibold text-slate-600 mt-1">Video Cloud Storage</p>
                </div>
                <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 text-center min-w-[140px]">
                  <p className="font-poppins text-3xl font-black text-blue-700">&lt;35ms</p>
                  <p className="font-inter text-xs font-semibold text-slate-600 mt-1">Pose Vector Latency</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Multi-Vector Violation Detection Suite */}
        <section className="py-20 bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <span className="font-poppins text-xs font-bold px-3.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                Real-Time Anti-Cheat Triggers
              </span>
              <h2 className="font-poppins text-3xl sm:text-4xl font-black text-[#1E1B4B] tracking-tight">
                4-Vector Violation Detection Engine
              </h2>
              <p className="font-inter text-base text-slate-600 leading-relaxed">
                Every second during the exam session, client-side algorithms monitor these 4 critical fraud vectors without recording biometric data.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-7 rounded-3xl bg-slate-50 border border-slate-200 shadow-md space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
                  <UserX className="w-6 h-6" />
                </div>
                <h3 className="font-poppins font-bold text-lg text-[#1E1B4B]">Absence Detection</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Monitors whether candidate remains seated in front of the camera. Leaving the examination desk for more than 5 seconds logs an absence strike.
                </p>
                <div className="pt-2 text-[11px] font-mono font-bold text-rose-700">
                  Strike Threshold: 5.0 Seconds
                </div>
              </div>

              <div className="p-7 rounded-3xl bg-slate-50 border border-slate-200 shadow-md space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="font-poppins font-bold text-lg text-[#1E1B4B]">Multi-Face Detection</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Detects unauthorized companions, helpers, or whisperers entering the camera viewport. Instantly flags a strike upon detecting &gt;1 face.
                </p>
                <div className="pt-2 text-[11px] font-mono font-bold text-purple-700">
                  Tolerance: 0 Extra Faces
                </div>
              </div>

              <div className="p-7 rounded-3xl bg-slate-50 border border-slate-200 shadow-md space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                  <Mic className="w-6 h-6" />
                </div>
                <h3 className="font-poppins font-bold text-lg text-[#1E1B4B]">Acoustic Whisper Scanner</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Calculates real-time audio decibels using Web Audio API Fast Fourier Transform. Sudden whispering or dictation prompts trigger audio strikes.
                </p>
                <div className="pt-2 text-[11px] font-mono font-bold text-amber-700">
                  Dynamic Ambient Baseline
                </div>
              </div>

              <div className="p-7 rounded-3xl bg-slate-50 border border-slate-200 shadow-md space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                  <MonitorOff className="w-6 h-6" />
                </div>
                <h3 className="font-poppins font-bold text-lg text-[#1E1B4B]">Tab & Window Lockout</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Listens to Page Visibility API events and window blur hooks. Alt+Tab, opening new tabs, or minimizing the browser generates an instant violation strike.
                </p>
                <div className="pt-2 text-[11px] font-mono font-bold text-blue-700">
                  Instant Event Penalty
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Remote Mining Centers Hardware & Low-Bandwidth Profile */}
        <section className="py-20 bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-blue-900 to-indigo-950 text-white shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-10">
              <div className="space-y-4 max-w-2xl">
                <span className="font-poppins text-xs font-bold px-3 py-1 rounded-full bg-blue-500/30 text-blue-300 border border-blue-400/30 inline-block">
                  Remote Mining Hub Optimized
                </span>
                <h3 className="font-poppins text-3xl font-black">
                  Engineered for Low-Bandwidth Mining Sites Across India
                </h3>
                <p className="font-inter text-sm sm:text-base text-blue-200 leading-relaxed">
                  Examination centers in Dhanbad, Korba, Singrauli, or Asansol often face intermittent internet. Because our AI executes 100% inside the browser with zero video stream upload, exams operate smoothly even on 256 kbps 4G connections.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full lg:w-auto shrink-0 font-poppins">
                <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
                  <p className="text-2xl font-black text-emerald-400">&lt;250 kbps</p>
                  <p className="text-xs text-blue-200 mt-1">Uplink Required</p>
                </div>
                <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
                  <p className="text-2xl font-black text-amber-400">&lt;15%</p>
                  <p className="text-xs text-blue-200 mt-1">Laptop CPU Load</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <V4FaqSection
          title="AI Proctoring & Privacy FAQs"
          subtitle="How our local MediaPipe computer vision model ensures compliance without compromising candidate privacy."
          faqs={proctoringFaqs}
        />

        {/* Footer */}
        <V4GreyFooter />

      </div>
  );
}
