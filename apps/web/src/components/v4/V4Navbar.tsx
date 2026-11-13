'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, User, ArrowRight, LogOut } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { signOutUser } from '../../lib/firebase';

interface V4NavbarProps {
  onLoginClick?: () => void;
  onStartExamClick?: () => void;
}

export const V4Navbar: React.FC<V4NavbarProps> = ({ onLoginClick, onStartExamClick }) => {
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Features', href: '/features' },
    { label: 'AI Proctoring', href: '/ai-proctoring' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Trust & Security', href: '/trust-and-security' },
    { label: 'Resources', href: '/resources' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-2xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Left Corner: Official MinesQuiz Circular Logo */}
          <Link href="/" prefetch={true} className="flex items-center gap-3 group shrink-0">
            <img
              src="/images/minesquiz-logo.png"
              alt="MinesQuiz Official Logo"
              className="w-11 h-11 object-contain group-hover:scale-105 transition-transform drop-shadow-sm"
              onError={(e) => {
                // Graceful fallback to branded badge if file loading
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="flex flex-col">
              <span className="font-poppins text-xl sm:text-2xl font-black tracking-tight text-[#1E1B4B]">
                Mines<span className="text-[#6D28D9]">Quiz</span>
              </span>
              <span className="font-inter text-[10px] text-slate-500 font-medium">
                Examination Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links: Strictly single line, whitespace-nowrap, zero upar-niche text wrapping */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 whitespace-nowrap shrink-0">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                prefetch={true}
                className="font-inter px-3 py-2 text-sm xl:text-base font-semibold text-slate-700 hover:text-[#6D28D9] rounded-xl hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3.5">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold font-inter">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      user.role === 'admin' ? 'bg-purple-500' : 'bg-emerald-500'
                    }`}
                  />
                  <span className="font-bold text-[#1E1B4B]">
                    {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-black ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>

                {user.role === 'admin' ? (
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    Admin Console
                  </Link>
                ) : (
                  <Link
                    href="/candidate"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    Candidate Portal
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    signOutUser().catch(() => {});
                  }}
                  title="Logout"
                  className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onLoginClick}
                className="font-inter inline-flex items-center gap-2 px-5 py-2.5 text-base font-semibold text-[#1E1B4B] bg-white border border-slate-200 rounded-xl hover:border-purple-300 hover:bg-slate-50 shadow-xs transition-all cursor-pointer"
              >
                <User className="w-4 h-4 text-[#6D28D9]" />
                <span>Login</span>
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={onStartExamClick}
              className="font-inter inline-flex items-center gap-2 px-6 py-2.5 text-base font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 rounded-xl shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/35 transition-all cursor-pointer"
            >
              <span>Start Quiz</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl text-slate-700 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-slate-200 bg-white/95 backdrop-blur-lg px-4 pt-2 pb-6 space-y-3"
          >
            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  prefetch={true}
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-inter block px-4 py-2.5 text-base font-semibold text-slate-700 hover:text-[#6D28D9] rounded-xl hover:bg-slate-50"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              {user ? (
                <>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 font-inter text-xs font-semibold">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        user.role === 'admin' ? 'bg-purple-500' : 'bg-emerald-500'
                      }`}
                    />
                    <span className="font-bold text-[#1E1B4B]">
                      {user.displayName || user.email}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-black ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      signOutUser().catch(() => {});
                      setMobileMenuOpen(false);
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
                <Link
                  href={user.role === 'admin' ? '/admin' : '/candidate'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-inter w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-xl"
                >
                  <span>{user.role === 'admin' ? 'Open Admin Console' : 'Open Candidate Portal'}</span>
                </Link>
                </>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLoginClick?.();
                  }}
                  className="font-inter w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-base font-semibold text-[#1E1B4B] bg-white border border-slate-200 rounded-xl"
                >
                  <User className="w-4 h-4 text-[#6D28D9]" />
                  <span>Login</span>
                </button>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onStartExamClick?.();
                }}
                className="font-inter w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-base font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl shadow-md"
              >
                <span>Start Quiz Now</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
