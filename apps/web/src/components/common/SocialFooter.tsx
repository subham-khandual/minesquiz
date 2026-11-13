'use client';

import React from 'react';
import { Github, Linkedin, Instagram, Facebook } from 'lucide-react';

interface SocialFooterProps {
  variant?: 'light' | 'dark';
  className?: string;
}

export const SocialFooter: React.FC<SocialFooterProps> = ({
  variant = 'light',
  className = '',
}) => {
  const isDark = variant === 'dark';

  return (
    <footer
      className={`pt-8 pb-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-inter transition-colors ${
        isDark
          ? 'border-slate-800 text-slate-400'
          : 'border-slate-200 text-slate-500'
      } ${className}`}
    >
      <div className="flex flex-wrap items-center gap-1.5 text-center sm:text-left">
        <span>© 2026 MinesQuiz Platform. All rights reserved.</span>
        <span className="hidden sm:inline mx-1">•</span>
        <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>
          Crafted by{' '}
          <a
            href="https://github.com/subham-khandual"
            target="_blank"
            rel="noreferrer"
            className={`font-semibold hover:underline ${
              isDark ? 'text-white hover:text-blue-400' : 'text-slate-900 hover:text-blue-600'
            }`}
          >
            Subham Khandual
          </a>
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        {/* GitHub */}
        <a
          href="https://github.com/subham-khandual"
          target="_blank"
          rel="noreferrer"
          className={`p-2 rounded-xl transition-all hover:scale-105 ${
            isDark
              ? 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 shadow-2xs'
          }`}
          aria-label="GitHub Profile"
          title="GitHub: Subham Khandual"
        >
          <Github className="w-4 h-4" />
        </a>

        {/* LinkedIn */}
        <a
          href="https://www.linkedin.com/in/subham-khandual"
          target="_blank"
          rel="noreferrer"
          className={`p-2 rounded-xl transition-all hover:scale-105 ${
            isDark
              ? 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-blue-400 hover:bg-slate-800'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-100 shadow-2xs'
          }`}
          aria-label="LinkedIn Profile"
          title="LinkedIn: Subham Khandual"
        >
          <Linkedin className="w-4 h-4" />
        </a>

        {/* Instagram */}
        <a
          href="https://www.instagram.com/mr_subham7.0"
          target="_blank"
          rel="noreferrer"
          className={`p-2 rounded-xl transition-all hover:scale-105 ${
            isDark
              ? 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-pink-400 hover:bg-slate-800'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-pink-600 hover:bg-slate-100 shadow-2xs'
          }`}
          aria-label="Instagram Profile"
          title="Instagram: @mr_subham7.0"
        >
          <Instagram className="w-4 h-4" />
        </a>

        {/* Facebook */}
        <a
          href="https://www.facebook.com/profile.php?id=100057584082708&rdid=grcQ1elrKcFjgWRS&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1BvyvvJBKA%2F#"
          target="_blank"
          rel="noreferrer"
          className={`p-2 rounded-xl transition-all hover:scale-105 ${
            isDark
              ? 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-blue-500 hover:bg-slate-800'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-100 shadow-2xs'
          }`}
          aria-label="Facebook Profile"
          title="Facebook: Subham Khandual"
        >
          <Facebook className="w-4 h-4" />
        </a>
      </div>
    </footer>
  );
};
