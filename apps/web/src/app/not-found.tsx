import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F4F7FC] flex items-center justify-center p-6 text-slate-900 font-inter">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-xs text-center space-y-4">
        <span className="text-4xl font-black text-blue-600 block">404</span>
        <h1 className="text-xl font-bold text-slate-900">Page Not Found</h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          The requested page could not be located on the MinesQuiz portal.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A2540] hover:bg-[#071D33] text-white text-xs font-bold transition-all shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
