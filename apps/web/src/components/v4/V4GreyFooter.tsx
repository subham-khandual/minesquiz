'use client';

import React from 'react';
import { Heart, Github, Linkedin, Instagram, Facebook } from 'lucide-react';

export const V4GreyFooter: React.FC = () => {
  return (
    <footer className="bg-[#1E242D] border-t border-slate-700/80 text-slate-300 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Brand Info with Official Logo */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/images/minesquiz-logo.png"
                alt="MinesQuiz Official Logo"
                className="w-12 h-12 object-contain drop-shadow-sm"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="flex flex-col">
                <span className="font-poppins text-2xl font-black tracking-tight text-white">
                  Mines<span className="text-purple-400">Quiz</span>
                </span>
                <span className="font-inter text-[10px] text-slate-400 font-medium">
                  Next-Gen Examination Platform
                </span>
              </div>
            </div>

            <p className="font-inter text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
              MinesQuiz empowers universities, institutes, and enterprises to conduct remote examinations
              with absolute confidence, zero cheating, and real-time biometric proctoring.
            </p>

            <div className="pt-2 flex items-center gap-3 text-xs text-slate-400 font-inter">
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 font-medium text-slate-300">
                🛡️ Single-Attempt Enforced
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 font-medium text-slate-300">
                🔒 WebRTC Encrypted
              </span>
            </div>
          </div>

          {/* Column 1: Solutions */}
          <div className="space-y-3 font-inter">
            <h4 className="font-poppins text-xs font-bold text-white uppercase tracking-wider">Solutions</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
              <li>
                <a href="#how-it-works" className="hover:text-purple-400 transition-colors">
                  University Finals
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-purple-400 transition-colors">
                  Campus Placement Tests
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-purple-400 transition-colors">
                  Corporate Trainee Audits
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-purple-400 transition-colors">
                  Olympiad Competitions
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Proctoring AI */}
          <div className="space-y-3 font-inter">
            <h4 className="font-poppins text-xs font-bold text-white uppercase tracking-wider">Proctoring AI</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
              <li>
                <a href="#features" className="hover:text-purple-400 transition-colors">
                  Facial Landmark Tracking
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-purple-400 transition-colors">
                  Ambient Noise Scanner
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-purple-400 transition-colors">
                  Full-Screen Lockdown
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-purple-400 transition-colors">
                  Multi-Strike Warning System
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Trust & Resources */}
          <div className="space-y-3 font-inter">
            <h4 className="font-poppins text-xs font-bold text-white uppercase tracking-wider">Trust & Resources</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
              <li>
                <a href="#trust-and-security" className="hover:text-purple-400 transition-colors">
                  Trust & Security Architecture
                </a>
              </li>
              <li>
                <a href="#resources" className="hover:text-purple-400 transition-colors">
                  Statutory CMR 2017 Guidelines
                </a>
              </li>
              <li>
                <a href="#ai-proctoring" className="hover:text-purple-400 transition-colors">
                  AI Proctoring Privacy Shield
                </a>
              </li>
              <li>
                <a href="mailto:support@minesquiz.com" className="hover:text-purple-400 transition-colors">
                  Contact Support
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-inter">
          <div className="flex flex-wrap items-center gap-1.5 text-center sm:text-left">
            <span>© 2026 MinesQuiz Inc. All rights reserved.</span>
            <span className="hidden sm:inline mx-1">•</span>
            <span className="inline-flex items-center gap-1 text-slate-300">
              Crafted with <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" /> by{' '}
              <a
                href="https://github.com/subham-khandual"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-white hover:text-purple-400 transition-colors underline underline-offset-2"
              >
                Subham Khandual
              </a>
            </span>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/subham-khandual"
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all hover:scale-105"
              aria-label="GitHub Profile"
              title="GitHub: Subham Khandual"
            >
              <Github className="w-4 h-4" />
            </a>
            <a
              href="https://www.linkedin.com/in/subham-khandual"
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-blue-400 transition-all hover:scale-105"
              aria-label="LinkedIn Profile"
              title="LinkedIn: Subham Khandual"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <a
              href="https://www.instagram.com/mr_subham7.0"
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-pink-400 transition-all hover:scale-105"
              aria-label="Instagram Profile"
              title="Instagram: @mr_subham7.0"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=100057584082708&rdid=grcQ1elrKcFjgWRS&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1BvyvvJBKA%2F#"
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-blue-500 transition-all hover:scale-105"
              aria-label="Facebook Profile"
              title="Facebook: Subham Khandual"
            >
              <Facebook className="w-4 h-4" />
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};
