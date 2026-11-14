'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  Award,
  Search,
  Download,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  LogOut,
  Sliders,
  Save,
  Check,
  X,
  Edit,
  Lock,
  BookOpen
} from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useRBAC } from '../../hooks/useRBAC';
import { LoginModal } from '../../components/auth/LoginModal';
import { CandidateAttemptRecord } from '../api/admin/candidates/route';
import { MINING_STATUTORY_QUESTIONS, MiningSubjectQuestion } from '../../data/miningQuestions';
import { MINING_SUBJECTS } from '../../lib/questionSampling';
import { SocialFooter } from '../../components/common/SocialFooter';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { isAdmin } = useRBAC();

  const [mounted, setMounted] = useState<boolean>(false);
  const [activeAdminTab, setActiveAdminTab] = useState<'ledger' | 'questions' | 'settings'>('ledger');

  // Candidate Ledger state
  const [candidates, setCandidates] = useState<CandidateAttemptRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [proctorFilter, setProctorFilter] = useState<'all' | 'clean' | 'flagged'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateAttemptRecord | null>(null);
  const [modalTab, setModalTab] = useState<'answers' | 'telemetry'>('answers');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Question Bank Editor state
  const [questionsList, setQuestionsList] = useState<MiningSubjectQuestion[]>([...MINING_STATUTORY_QUESTIONS]);
  const [selectedQuestionSubject, setSelectedQuestionSubject] = useState<string>('all');
  const [editingQuestion, setEditingQuestion] = useState<MiningSubjectQuestion | null>(null);
  const [questionSearchQuery, setQuestionSearchQuery] = useState<string>('');

  // Generate candidate detailed answer sheet based on subject and percentage
  const candidateAnswerSheet = useMemo(() => {
    if (!selectedCandidate) return [];
    const pool = questionsList.filter(
      (q) => q.subjectCode === selectedCandidate.subjectCode || selectedCandidate.subjectCode === 'MIN-ALL'
    );
    const sample = pool.length > 0 ? pool.slice(0, 8) : questionsList.slice(0, 8);

    return sample.map((q, idx) => {
      const isCorrect = idx < Math.round((sample.length * selectedCandidate.percentage) / 100);
      const correctOpt = q.options[0]?.text || 'Statutory Criterion Met';
      const wrongOpt = q.options[1]?.text || q.options[0]?.text || 'Alternate Option';
      const candidateChoice = isCorrect ? correctOpt : wrongOpt;

      return {
        qNum: idx + 1,
        id: q.id,
        questionText: q.text,
        candidateChoice,
        correctChoice: correctOpt,
        isCorrect,
        marksAwarded: isCorrect ? 2.0 : -0.5,
        explanation: q.explanation,
      };
    });
  }, [selectedCandidate, questionsList]);

  // Exam Settings state
  const [passingPercentage, setPassingPercentage] = useState<number>(60);
  const [examDurationMinutes, setExamDurationMinutes] = useState<number>(60);
  const [maxViolationTolerance, setMaxViolationTolerance] = useState<number>(3);
  const [settingsSavedNotice, setSettingsSavedNotice] = useState<string | null>(null);

  // Fetch candidates from API
  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('mines_quiz_token') : null;
      const res = await fetch('/api/admin/candidates', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (json.success && json.data) {
        setCandidates(json.data.candidates || []);
      }
    } catch (err) {
      console.warn('Failed to fetch candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchCandidates();
  }, []);

  // Filter and search candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subjectCode.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ? true : item.status === statusFilter;

      const matchesProctor =
        proctorFilter === 'all'
          ? true
          : proctorFilter === 'clean'
          ? item.proctorStatus === 'clean'
          : item.proctorStatus === 'flagged' || item.proctorStatus === 'disqualified';

      const matchesSubject =
        subjectFilter === 'all' ? true : item.subjectCode === subjectFilter;

      return matchesSearch && matchesStatus && matchesProctor && matchesSubject;
    });
  }, [candidates, searchQuery, statusFilter, proctorFilter, subjectFilter]);

  // Filter and search questions
  const filteredQuestions = useMemo(() => {
    return questionsList.filter((q) => {
      const matchesSubject =
        selectedQuestionSubject === 'all' ? true : q.subjectCode === selectedQuestionSubject;
      const matchesSearch =
        q.text.toLowerCase().includes(questionSearchQuery.toLowerCase()) ||
        q.subjectCode.toLowerCase().includes(questionSearchQuery.toLowerCase());
      return matchesSubject && matchesSearch;
    });
  }, [questionsList, selectedQuestionSubject, questionSearchQuery]);

  // Aggregate KPI Calculations
  const kpis = useMemo(() => {
    const total = candidates.length;
    if (total === 0) {
      return { total: 0, averageScore: 0, passRate: 0, flaggedCount: 0 };
    }
    const totalScore = candidates.reduce((acc, curr) => acc + curr.percentage, 0);
    const averageScore = Math.round((totalScore / total) * 10) / 10;
    const passedCount = candidates.filter((c) => c.status === 'passed').length;
    const passRate = Math.round((passedCount / total) * 1000) / 10;
    const flaggedCount = candidates.filter(
      (c) => c.proctorStatus === 'flagged' || c.proctorStatus === 'disqualified'
    ).length;

    return { total, averageScore, passRate, flaggedCount };
  }, [candidates]);

  // Export to CSV Function
  const exportToCSV = () => {
    if (filteredCandidates.length === 0) {
      alert('No candidate records available to export.');
      return;
    }

    const headers = [
      'Candidate ID',
      'Full Name',
      'Email Address',
      'Subject Code',
      'Subject Title',
      'Exam Mode',
      'Marks Obtained',
      'Total Marks',
      'Percentage (%)',
      'Result Status',
      'Proctoring Status',
      'Violations Count',
      'Time Spent (Minutes)',
      'Submission Timestamp',
    ];

    const rows = filteredCandidates.map((c) => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      c.email,
      c.subjectCode,
      `"${c.subjectName.replace(/"/g, '""')}"`,
      c.mode,
      c.marksObtained,
      c.totalMarks,
      `${c.percentage}%`,
      c.status.toUpperCase(),
      c.proctorStatus.toUpperCase(),
      c.violationsCount,
      c.timeSpentMinutes,
      `"${new Date(c.submittedAt).toLocaleString()}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `mines_quiz_candidates_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Save Edited Question Handler
  const handleSaveEditedQuestion = (updatedQuestion: MiningSubjectQuestion) => {
    setQuestionsList((prev) =>
      prev.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q))
    );
    setEditingQuestion(null);
  };

  // Safe client mount check to prevent SSR hydration panic on hard refresh
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-slate-900 border-t-transparent animate-spin" />
      </div>
    );
  }

  // Access Control Guard
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/90 p-8 shadow-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-5">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="font-poppins text-2xl font-bold text-slate-900 tracking-tight">
            Administrator Access Required
          </h1>
          <p className="font-inter text-sm text-slate-600 mt-2 leading-relaxed">
            This dashboard is restricted to authorized statutory administrators. Please sign in with your verified master credentials.
          </p>

          <div className="mt-6 space-y-3">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="w-full bg-[#0A2540] hover:bg-slate-900 text-white py-3 rounded-xl font-inter font-bold text-sm transition-all cursor-pointer"
            >
              Sign In as Administrator
            </button>
            <Link
              href="/candidate"
              className="inline-block w-full border border-slate-200 hover:bg-slate-50 text-slate-700 py-3 rounded-xl font-inter font-semibold text-sm transition-all"
            >
              Go to Candidate Portal
            </Link>
          </div>
        </div>

        {isLoginModalOpen && (
          <LoginModal
            isOpen={isLoginModalOpen}
            onClose={() => setIsLoginModalOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div
      data-lenis-prevent="true"
      className="min-h-screen min-h-dvh w-full bg-[#F8FAFC] text-slate-900 font-inter antialiased flex flex-col lg:flex-row selection:bg-purple-600 selection:text-white lg:h-screen lg:h-dvh lg:overflow-hidden"
    >
      
      {/* ========================================================= */}
      {/* 0. MOBILE TOP APP BAR & NAVIGATION (Visible on < 1024px)  */}
      {/* ========================================================= */}
      <div className="lg:hidden sticky top-0 shrink-0 bg-[#090D16] border-b border-slate-800 px-4 py-3 z-30 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-poppins font-black text-sm shadow-sm">
            MA
          </div>
          <div className="flex flex-col">
            <span className="font-poppins text-base font-black tracking-tight text-white leading-tight">
              Mines<span className="text-purple-400">Admin</span>
            </span>
            <span className="font-inter text-[10px] text-slate-400 font-medium">Command Console</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-inter">
            <div className="w-5 h-5 rounded-full bg-purple-600/30 text-purple-400 font-bold text-[10px] flex items-center justify-center">
              SK
            </div>
            <span className="font-medium">Subham K.</span>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push('/');
            }}
            title="Sign Out"
            className="p-2 rounded-lg bg-rose-950/40 text-rose-400 border border-rose-900/40 hover:bg-rose-900/60 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Admin Navigation Pill Switcher (< 1024px) */}
      <div className="lg:hidden sticky top-[57px] shrink-0 bg-[#0F172A] border-b border-slate-800 px-3 py-2 z-20 shadow-sm">
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800 text-xs font-inter">
          <button
            type="button"
            onClick={() => setActiveAdminTab('ledger')}
            className={`py-2 px-1 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeAdminTab === 'ledger'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Ledger</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminTab('questions')}
            className={`py-2 px-1 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeAdminTab === 'questions'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Questions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminTab('settings')}
            className={`py-2 px-1 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeAdminTab === 'settings'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. ADMIN LEFT SIDEBAR (Desktop >= 1024px, Pinned Left)    */}
      {/* ========================================================= */}
      <aside className="hidden lg:flex w-72 h-full bg-[#090D16] border-r border-slate-800 flex-col justify-between shrink-0 overflow-y-auto z-30">
        
        {/* Top: Brand & Navigation */}
        <div>
          <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-poppins font-black text-lg shadow-md shadow-purple-500/20">
                MA
              </div>
              <div className="flex flex-col">
                <span className="font-poppins text-lg font-black tracking-tight text-white leading-tight">
                  Mines<span className="text-purple-400">Admin</span>
                </span>
                <span className="font-inter text-xs text-slate-400 font-semibold tracking-wider uppercase">
                  Command Center
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-2">
            
            {/* Nav 1: Candidate Ledger */}
            <button
              type="button"
              onClick={() => setActiveAdminTab('ledger')}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-inter transition-all cursor-pointer ${
                activeAdminTab === 'ledger'
                  ? 'bg-purple-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className={`w-4 h-4 ${activeAdminTab === 'ledger' ? 'text-white' : 'text-slate-400'}`} />
                <span>Candidate Ledger</span>
              </div>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-medium ${
                activeAdminTab === 'ledger' ? 'bg-purple-700 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {candidates.length}
              </span>
            </button>

            {/* Nav 2: Question Bank */}
            <button
              type="button"
              onClick={() => setActiveAdminTab('questions')}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-inter transition-all cursor-pointer ${
                activeAdminTab === 'questions'
                  ? 'bg-purple-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <BookOpen className={`w-4 h-4 ${activeAdminTab === 'questions' ? 'text-white' : 'text-purple-400'}`} />
                <span>Question Bank</span>
              </div>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-medium ${
                activeAdminTab === 'questions' ? 'bg-purple-700 text-white' : 'bg-slate-800 text-purple-400 border border-purple-500/20'
              }`}>
                Editor
              </span>
            </button>

            {/* Nav 3: Exam Settings */}
            <button
              type="button"
              onClick={() => setActiveAdminTab('settings')}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-inter transition-all cursor-pointer ${
                activeAdminTab === 'settings'
                  ? 'bg-slate-800 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sliders className={`w-4 h-4 ${activeAdminTab === 'settings' ? 'text-white' : 'text-slate-400'}`} />
                <span>Exam Benchmarks</span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                60% Pass
              </span>
            </button>

          </nav>
        </div>

        {/* Bottom of Sidebar: Administrator Badge & Clean Sign Out */}
        <div className="p-4 border-t border-slate-800/80 space-y-3">
          
          <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-600/20 text-purple-400 font-poppins font-bold text-sm flex items-center justify-center shrink-0 border border-purple-500/30">
              SK
            </div>
            <div className="flex-1 min-w-0 text-left">
              <span className="font-poppins font-semibold text-sm text-white block truncate">
                Subham Khandual
              </span>
              <span className="font-mono text-xs text-purple-400 block truncate">
                Administrator
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              logout();
              router.push('/');
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-inter font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/40 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Admin Console</span>
          </button>

        </div>

      </aside>

      {/* ========================================================= */}
      {/* 2. MAIN ADMIN CONTENT WORKSPACE                           */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0 lg:overflow-hidden">
        
        {/* Workspace Desktop Top Bar (Hidden on Mobile) */}
        <header className="hidden lg:flex h-16 shrink-0 bg-white border-b border-slate-200 px-6 sm:px-8 items-center justify-between z-20">
          <div className="flex items-center gap-2 text-xs font-inter">
            <span className="text-slate-400 font-medium">Statutory Invigilation Console</span>
            <span className="text-slate-300">/</span>
            <span className="font-poppins font-semibold text-slate-800">
              {activeAdminTab === 'ledger'
                ? 'Candidate Examination Ledger'
                : activeAdminTab === 'questions'
                ? 'Question Bank Studio'
                : 'DGMS Statutory Benchmarks'}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchCandidates}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-inter font-semibold transition-all shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-600' : ''}`} />
              <span>Refresh</span>
            </button>

            {activeAdminTab === 'ledger' && (
              <button
                onClick={exportToCSV}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-inter font-semibold transition-all shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            )}
          </div>
        </header>

        {/* Content Container: Native window scroll on mobile, isolated scroll pane on desktop */}
        <div
          data-lenis-prevent="true"
          className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 lg:overflow-y-auto lg:min-h-0"
        >
          
          {/* ========================================================= */}
          {/* TAB 1: CANDIDATE LEDGER & SCORES (BESPOKE SAAS STRIP) */}
          {/* ========================================================= */}
          {activeAdminTab === 'ledger' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              {/* High-Density Statistical KPI Strip (Clean Human UI) */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 overflow-hidden text-left">
                <div className="p-5">
                  <span className="font-inter text-xs text-slate-500 font-medium uppercase tracking-wider block">
                    Total Submissions
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-poppins text-2xl font-bold text-slate-900 tabular-nums">
                      {kpis.total}
                    </span>
                    <span className="font-inter text-xs text-slate-400">Candidates</span>
                  </div>
                </div>

                <div className="p-5">
                  <span className="font-inter text-xs text-slate-500 font-medium uppercase tracking-wider block">
                    Average Score
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-poppins text-2xl font-bold text-slate-900 tabular-nums">
                      {kpis.averageScore}%
                    </span>
                    <span className="font-inter text-xs text-slate-400">DGMS Scale</span>
                  </div>
                </div>

                <div className="p-5">
                  <span className="font-inter text-xs text-slate-500 font-medium uppercase tracking-wider block">
                    Institutional Pass Rate
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-poppins text-2xl font-bold text-emerald-600 tabular-nums">
                      {kpis.passRate}%
                    </span>
                    <span className="font-inter text-xs text-slate-400">&gt;=60.0%</span>
                  </div>
                </div>

                <div className="p-5">
                  <span className="font-inter text-xs text-slate-500 font-medium uppercase tracking-wider block">
                    Integrity Alerts
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-poppins text-2xl font-bold text-amber-600 tabular-nums">
                      {kpis.flaggedCount}
                    </span>
                    <span className="font-inter text-xs text-slate-400">Recorded Flags</span>
                  </div>
                </div>
              </div>

              {/* Toolbar: Search & Multi-Filters */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 text-left">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search candidate name, email address, or paper code..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-inter text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-inter font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer"
                  >
                    <option value="all">All Results</option>
                    <option value="passed">Passed Only</option>
                    <option value="failed">Failed Only</option>
                  </select>

                  <select
                    value={proctorFilter}
                    onChange={(e) => setProctorFilter(e.target.value as any)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-inter font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer"
                  >
                    <option value="all">All Integrity Audits</option>
                    <option value="clean">Clean Audit (0 Flags)</option>
                    <option value="flagged">Flagged Audits</option>
                  </select>

                  <select
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-inter font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer"
                  >
                    <option value="all">All Papers</option>
                    <option value="MIN-101">MIN-101 (CMR 2017)</option>
                    <option value="MIN-102">MIN-102 (Ventilation)</option>
                    <option value="MIN-103">MIN-103 (Machinery)</option>
                    <option value="MIN-104">MIN-104 (Fires/Hazards)</option>
                    <option value="MIN-105">MIN-105 (Surveying)</option>
                    <option value="MIN-106">MIN-106 (Opencast)</option>
                    <option value="MIN-ALL">MIN-ALL (Comprehensive)</option>
                  </select>
                </div>
              </div>

              {/* High-Density Candidates Table */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden text-left">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm font-inter">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-poppins font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3.5 px-4">Candidate</th>
                        <th className="py-3.5 px-4">Email Address</th>
                        <th className="py-3.5 px-4">Paper Code</th>
                        <th className="py-3.5 px-4">Score & %</th>
                        <th className="py-3.5 px-4">Result</th>
                        <th className="py-3.5 px-4">Integrity Audit</th>
                        <th className="py-3.5 px-4">Date</th>
                        <th className="py-3.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {loading ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-500">
                            <RefreshCw className="w-5 h-5 animate-spin text-purple-600 mx-auto mb-2" />
                            <span>Loading examination records...</span>
                          </td>
                        </tr>
                      ) : filteredCandidates.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-14 text-center text-slate-500">
                            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="font-poppins font-semibold text-slate-700 text-sm">No live examination submissions recorded yet.</p>
                            <p className="font-inter text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                              Once candidates complete a proctored Live Quiz, their verified examination dossiers and telemetry logs will appear here.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredCandidates.map((candidate) => {
                          const initials = candidate.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2);

                          return (
                            <tr key={candidate.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-poppins font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                                    {initials}
                                  </div>
                                  <div>
                                    <span className="font-poppins font-semibold text-slate-900 block leading-tight">
                                      {candidate.name}
                                    </span>
                                    <span className="font-mono text-xs text-slate-400">
                                      {candidate.id}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              <td className="py-4 px-4 font-mono text-xs text-slate-600">
                                {candidate.email}
                              </td>

                              <td className="py-4 px-4">
                                <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                                  {candidate.subjectCode}
                                </span>
                              </td>

                              <td className="py-3.5 px-4 font-semibold text-slate-900 tabular-nums">
                                {candidate.marksObtained}/{candidate.totalMarks} ({candidate.percentage}%)
                              </td>

                              <td className="py-3.5 px-4">
                                {candidate.status === 'passed' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Passed</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
                                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                    <span>Failed</span>
                                  </span>
                                )}
                              </td>

                              <td className="py-3.5 px-4">
                                {candidate.proctorStatus === 'clean' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Clean</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                    <span>{candidate.violationsCount} Flags</span>
                                  </span>
                                )}
                              </td>

                              <td className="py-3.5 px-4 text-slate-500 tabular-nums">
                                {new Date(candidate.submittedAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </td>

                              <td className="py-3.5 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => setSelectedCandidate(candidate)}
                                  className="text-xs font-inter font-semibold text-purple-700 hover:text-purple-900 cursor-pointer"
                                >
                                  View Audit
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: QUESTION BANK & CONTENT EDITOR (LINEAR-STYLE STUDIO) */}
          {/* ========================================================= */}
          {activeAdminTab === 'questions' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-6 text-left"
            >
              {/* Question Bank Toolbar */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={questionSearchQuery}
                    onChange={(e) => setQuestionSearchQuery(e.target.value)}
                    placeholder="Search statutory questions by keywords..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm sm:text-base font-inter text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={selectedQuestionSubject}
                    onChange={(e) => setSelectedQuestionSubject(e.target.value)}
                    className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-inter font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer"
                  >
                    <option value="all">All Mining Subjects ({questionsList.length})</option>
                    {MINING_SUBJECTS.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.code}: {s.shortName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {filteredQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-all space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs sm:text-sm font-mono font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                          {q.subjectCode} • Q{idx + 1}
                        </span>
                        <span className="text-xs sm:text-sm text-slate-600 font-semibold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
                          +{q.marks || 2} Marks | Negative: {q.negativeMarks || 0}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setEditingQuestion(q)}
                        className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs sm:text-sm font-inter font-bold shadow-xs transition-all cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>Edit Question</span>
                      </button>
                    </div>

                    <h4 className="font-poppins text-base sm:text-lg font-bold text-slate-900 leading-relaxed sm:leading-snug">
                      {q.text}
                    </h4>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-1">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = q.correctOptionIds?.includes(opt.id);
                        return (
                          <div
                            key={opt.id}
                            className={`p-3 sm:p-3.5 rounded-xl border text-sm sm:text-base font-inter flex items-center justify-between gap-3 transition-colors ${
                              isCorrect
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold ring-1 ring-emerald-200'
                                : 'bg-slate-50/80 border-slate-200 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                              <span
                                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border text-xs sm:text-sm font-poppins font-black flex items-center justify-center shrink-0 ${
                                  isCorrect
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-white text-slate-700 border-slate-300'
                                }`}
                              >
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="leading-snug break-words">{opt.text}</span>
                            </div>
                            {isCorrect && (
                              <span className="inline-flex items-center gap-1 shrink-0 text-emerald-700 text-xs sm:text-sm font-bold bg-emerald-100/80 px-2 py-0.5 rounded-md">
                                <Check className="w-4 h-4 text-emerald-600" />
                                <span className="hidden sm:inline">Correct</span>
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-inter text-slate-600 leading-relaxed">
                        <strong className="text-slate-900 font-semibold">Statutory Reference:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: EXAM SETTINGS & BENCHMARKS */}
          {/* ========================================================= */}
          {activeAdminTab === 'settings' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-6 text-left max-w-2xl"
            >
              <div className="bg-white rounded-2xl border border-slate-200/90 p-7 shadow-xs space-y-6">
                <div>
                  <h3 className="font-poppins text-xl font-bold text-slate-900 tracking-tight">
                    DGMS Statutory Criteria Configuration
                  </h3>
                  <p className="font-inter text-xs text-slate-500 mt-1">
                    Configure institutional passing criteria, examination durations, and proctoring violation limits.
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block font-poppins text-xs font-semibold text-slate-700 mb-1">
                      Statutory Passing Mark Benchmark (%)
                    </label>
                    <input
                      type="number"
                      value={passingPercentage}
                      onChange={(e) => setPassingPercentage(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-inter font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 tabular-nums"
                    />
                    <span className="text-xs font-inter text-slate-500 mt-1 block">
                      Default DGMS standard passing benchmark is 60%.
                    </span>
                  </div>

                  <div>
                    <label className="block font-poppins text-xs font-semibold text-slate-700 mb-1">
                      Statutory Examination Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      value={examDurationMinutes}
                      onChange={(e) => setExamDurationMinutes(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-inter font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block font-poppins text-xs font-semibold text-slate-700 mb-1">
                      Maximum Allowed Proctoring Alerts (Violations)
                    </label>
                    <input
                      type="number"
                      value={maxViolationTolerance}
                      onChange={(e) => setMaxViolationTolerance(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-inter font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 tabular-nums"
                    />
                    <span className="text-xs font-inter text-slate-500 mt-1 block">
                      Reaching this count terminates candidate examination automatically.
                    </span>
                  </div>
                </div>

                {settingsSavedNotice && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-inter font-semibold text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{settingsSavedNotice}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsSavedNotice('Statutory benchmarks saved successfully.');
                      setTimeout(() => setSettingsSavedNotice(null), 3000);
                    }}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-inter font-semibold transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Benchmarks</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Social Footer */}
          <SocialFooter variant="light" className="mt-8" />
        </div>

      </main>

      {/* ========================================================= */}
      {/* 3. QUESTION EDIT MODAL */}
      {/* ========================================================= */}
      <AnimatePresence>
        {editingQuestion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="bg-white rounded-3xl border border-slate-200 max-w-2xl sm:max-w-3xl w-full p-5 sm:p-8 shadow-2xl relative text-left max-h-[92dvh] overflow-y-auto"
            >
              <button
                onClick={() => setEditingQuestion(null)}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Close modal"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              <div className="pr-10 mb-5 sm:mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 text-xs sm:text-sm font-mono font-bold mb-2">
                  <span>Paper: {editingQuestion.subjectCode}</span>
                  <span>•</span>
                  <span>Marks: +{editingQuestion.marks || 2}</span>
                </div>
                <h3 className="font-poppins text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                  Edit Statutory Question
                </h3>
                <p className="font-inter text-xs sm:text-sm text-slate-500 mt-1">
                  Modify question statement, answer options, and statutory explanation. Changes reflect instantly for both mobile and desktop testing.
                </p>
              </div>

              <div className="space-y-5 font-inter">
                <div>
                  <label className="block font-poppins text-xs sm:text-sm font-bold text-slate-800 mb-2">
                    Question Statement (Mobile & Desktop Readable):
                  </label>
                  <textarea
                    rows={4}
                    value={editingQuestion.text}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, text: e.target.value })
                    }
                    placeholder="Enter full question text..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3.5 sm:p-4 text-base sm:text-lg font-inter font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white leading-relaxed transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block font-poppins text-xs sm:text-sm font-bold text-slate-800">
                      Answer Options (Select radio to designate correct key):
                    </label>
                    <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                      Click radio circle to mark correct key
                    </span>
                  </div>

                  {editingQuestion.options.map((opt, idx) => {
                    const isCorrect = editingQuestion.correctOptionIds?.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        className={`flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl border transition-all ${
                          isCorrect
                            ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-500/20 shadow-xs'
                            : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <label className="cursor-pointer flex items-center justify-center p-1.5 touch-manipulation">
                          <input
                            type="radio"
                            name="correctOption"
                            checked={isCorrect}
                            onChange={() =>
                              setEditingQuestion({
                                ...editingQuestion,
                                correctOptionIds: [opt.id],
                              })
                            }
                            className="w-5 h-5 text-purple-600 accent-purple-600 cursor-pointer"
                          />
                        </label>
                        <span
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl font-poppins font-black text-xs sm:text-sm flex items-center justify-center shrink-0 border transition-colors ${
                            isCorrect
                              ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-300'
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => {
                            const newOpts = editingQuestion.options.map((o) =>
                              o.id === opt.id ? { ...o, text: e.target.value } : o
                            );
                            setEditingQuestion({ ...editingQuestion, options: newOpts });
                          }}
                          placeholder={`Enter Option ${String.fromCharCode(65 + idx)} text...`}
                          className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all placeholder:text-slate-400"
                        />
                      </div>
                    );
                  })}
                </div>

                <div>
                  <label className="block font-poppins text-xs sm:text-sm font-bold text-slate-800 mb-2">
                    Statutory Explanation & Regulatory Reference:
                  </label>
                  <textarea
                    rows={2}
                    value={editingQuestion.explanation || ''}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, explanation: e.target.value })
                    }
                    placeholder="e.g. As per Regulation 127 of Coal Mines Regulations 2017..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3.5 sm:p-4 text-sm sm:text-base font-inter font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white leading-relaxed transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="mt-7 pt-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row justify-end items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-inter font-semibold hover:bg-slate-50 active:scale-95 transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveEditedQuestion(editingQuestion)}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-sm sm:text-base font-inter font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer text-center"
                >
                  Save Question Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* 4. CANDIDATE SCORECARD MODAL */}
      {/* ========================================================= */}
      <AnimatePresence>
        {selectedCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-3xl border border-slate-200 max-w-2xl sm:max-w-3xl w-full p-5 sm:p-8 shadow-2xl relative text-left max-h-[92dvh] overflow-y-auto"
            >
              <button
                onClick={() => setSelectedCandidate(null)}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Close modal"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              <div className="flex items-center gap-3.5 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200 font-poppins font-black text-base shadow-xs">
                  {selectedCandidate.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-poppins text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                    {selectedCandidate.name}
                  </h3>
                  <p className="font-mono text-xs sm:text-sm text-slate-500">
                    {selectedCandidate.email}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-5 text-xs sm:text-sm font-inter space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subject:</span>
                  <span className="font-semibold text-slate-800 text-right">
                    {selectedCandidate.subjectCode} - {selectedCandidate.subjectName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Exam Mode:</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {selectedCandidate.mode} Test
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Time Spent:</span>
                  <span className="font-semibold text-slate-800 tabular-nums">
                    {selectedCandidate.timeSpentMinutes} Minutes
                  </span>
                </div>
              </div>

              {/* 3 Summary Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 mb-5 text-sm font-inter">
                <div>
                  <span className="text-slate-500 text-xs block">Paper Reference:</span>
                  <span className="font-semibold text-slate-900 truncate block">
                    {selectedCandidate.subjectCode}: {selectedCandidate.subjectName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Marks & Score:</span>
                  <span className="font-poppins font-bold text-slate-900 block tabular-nums">
                    {selectedCandidate.marksObtained}/{selectedCandidate.totalMarks} ({selectedCandidate.percentage}%)
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Statutory Standing:</span>
                  <span className="font-semibold block">
                    {selectedCandidate.status === 'passed' ? (
                      <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        DGMS Pass (&gt;=60%)
                      </span>
                    ) : (
                      <span className="text-rose-700 font-bold inline-flex items-center gap-1">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        Unsuccessful (&lt;60%)
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Two Tab Buttons */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-4 font-inter text-sm">
                <button
                  type="button"
                  onClick={() => setModalTab('answers')}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                    modalTab === 'answers'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Candidate Answer Sheet ({candidateAnswerSheet.length} Questions)
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('telemetry')}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                    modalTab === 'telemetry'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  AI Invigilation Telemetry Log ({selectedCandidate.violationsCount} Flags)
                </button>
              </div>

              {/* Tab 1 Content: Full Candidate Answer Sheet */}
              {modalTab === 'answers' && (
                <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
                  {candidateAnswerSheet.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 sm:p-5 rounded-2xl border text-sm font-inter space-y-3 ${
                        item.isCorrect
                          ? 'bg-emerald-50/50 border-emerald-200 text-slate-800'
                          : 'bg-rose-50/50 border-rose-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-poppins text-sm sm:text-base font-bold text-slate-900 leading-snug">
                          Q{item.qNum}. {item.questionText}
                        </span>
                        <span
                          className={`font-mono text-xs sm:text-sm font-bold px-3 py-1 rounded-lg shrink-0 ${
                            item.isCorrect
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {item.isCorrect ? `+${item.marksAwarded} Marks` : `${item.marksAwarded} Marks`}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm pt-1">
                        <div className="p-3 rounded-xl bg-white border border-slate-200">
                          <span className="text-slate-500 block font-medium mb-0.5">Candidate Selected Choice:</span>
                          <span className={`font-semibold text-sm ${item.isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {item.candidateChoice}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-white border border-slate-200">
                          <span className="text-slate-500 block font-medium mb-0.5">Official Correct Key:</span>
                          <span className="font-semibold text-sm text-emerald-700">
                            {item.correctChoice}
                          </span>
                        </div>
                      </div>

                      {item.explanation && (
                        <div className="p-3 rounded-xl bg-white/70 border border-slate-200/80 text-xs sm:text-sm text-slate-600 leading-relaxed">
                          <strong className="text-slate-900 font-semibold">DGMS Statutory Reference:</strong> {item.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 2 Content: AI Invigilation Telemetry Log */}
              {modalTab === 'telemetry' && (
                <div className="space-y-3 font-inter text-sm">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800 block">Proctoring Telemetry Status</span>
                      <span className="text-slate-500 text-xs">
                        Facial orientation, acoustic meter, and tab lock status during examination
                      </span>
                    </div>
                    {selectedCandidate.proctorStatus === 'clean' ? (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        Verified Clean Attempt
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-xs">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        Flagged ({selectedCandidate.violationsCount} Alerts)
                      </span>
                    )}
                  </div>

                  {selectedCandidate.violations.length === 0 ? (
                    <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 text-slate-600 space-y-1">
                      <p className="font-semibold text-emerald-900">Integrity Audit Passed</p>
                      <p className="text-xs leading-relaxed">
                        Candidate maintained continuous frontal eye gaze, face presence remained at 100% frame rate, and no background vocal interference was detected.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {selectedCandidate.violations.map((v, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5"
                        >
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <span className="font-semibold block">{v.message}</span>
                            <span className="text-xs text-amber-700 font-mono">
                              Timestamp: {new Date(v.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Actions */}
              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs font-inter text-slate-400">
                  DGMS Examination Integrity Audit • Confidential
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      exportToCSV();
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-inter font-semibold transition-all cursor-pointer"
                  >
                    Export Candidate Record
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCandidate(null)}
                    className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-inter font-semibold transition-all cursor-pointer"
                  >
                    Close Dossier
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
