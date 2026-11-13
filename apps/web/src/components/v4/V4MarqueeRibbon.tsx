'use client';

import React from 'react';
import {
  ShieldCheck,
  Lock,
  Camera,
  Volume2,
  MonitorCheck,
  Zap,
  Award,
  Building2
} from 'lucide-react';

export const V4MarqueeRibbon: React.FC = () => {
  const items = [
    { label: 'DGMS Statutory Compliant', icon: ShieldCheck, color: 'text-emerald-500' },
    { label: 'Single-Attempt Enforced', icon: Lock, color: 'text-blue-500' },
    { label: 'AI Biometric Face Mesh (0.02s Delta)', icon: Camera, color: 'text-purple-500' },
    { label: 'Acoustic Noise Detection (0dB)', icon: Volume2, color: 'text-indigo-500' },
    { label: 'Full-Screen & Tab Freeze', icon: MonitorCheck, color: 'text-cyan-500' },
    { label: 'WebRTC P2P Encrypted Stream', icon: Zap, color: 'text-amber-500' },
    { label: '50,000+ Proctored Quizzes', icon: Award, color: 'text-emerald-500' },
    { label: 'Coal Mines Regulations (CMR) 2017', icon: Building2, color: 'text-purple-500' },
  ];

  // Repeat items for seamless infinite scroll
  const marqueeList = [...items, ...items];

  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-r from-[#1E1B4B] via-[#2E1065] to-[#1E1B4B] py-3.5 border-y border-purple-500/20 shadow-md">
      {/* Left and Right Fade Masks for smooth edge blending */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#1E1B4B] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#1E1B4B] to-transparent z-10" />

      {/* Marquee Track */}
      <div className="flex w-max animate-marquee-x pause-on-hover will-change-transform">
        {marqueeList.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="flex items-center gap-2.5 px-6 py-1 select-none whitespace-nowrap text-white/90 font-inter text-xs sm:text-sm font-semibold tracking-wide"
            >
              <span className="p-1 rounded-lg bg-white/10 backdrop-blur-xs">
                <Icon className={`w-3.5 h-3.5 ${item.color}`} />
              </span>
              <span>{item.label}</span>
              <span className="ml-5 text-purple-400/40 text-xs">•</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
