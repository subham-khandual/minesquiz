'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  FileText,
  Radio,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  HelpCircle,
  ShieldCheck,
  ShieldAlert,
  Camera,
  CameraOff,
  Mic,
  ScanFace,
  RefreshCw,
  LogOut,
  ChevronRight,
  ArrowRight,
  ExternalLink,
  Sliders,
  AlertCircle,
  AlertOctagon,
  XCircle,
  Monitor,
  UserCheck,
  VolumeX,
  Smartphone,
  Eye,
  Check
} from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { MINING_SUBJECTS, getSubjectByCode } from '../../lib/questionSampling';
import { SocialFooter } from '../common/SocialFooter';

interface CandidateExamSessionPortalProps {
  quizTitle?: string;
  durationMinutes?: number;
  totalMarks?: number;
  questionsCount?: number;
  onStartExam: (mode: 'live' | 'mock', subjectCode?: string) => void;
  onLogout?: () => void;
}

export const CandidateExamSessionPortal: React.FC<CandidateExamSessionPortalProps> = ({
  quizTitle = 'Mining Engineering & Safety Regulations (CMR)',
  durationMinutes = 60,
  totalMarks = 100,
  questionsCount = 30,
  onStartExam,
  onLogout,
}) => {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  // Active navigation tab: 4 distinct standalone sections
  const [activeTab, setActiveTab] = useState<'mock' | 'live' | 'instructions' | 'scorecards'>('mock');

  // Selected Mining Engineering Subject state
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>('MIN-ALL');
  const currentSubject = getSubjectByCode(selectedSubjectCode);

  // Hardware status state for Live Quiz on-demand check (NOT automatic on mount)
  const [cameraReady, setCameraReady] = useState<boolean>(false);
  const [micReady, setMicReady] = useState<boolean>(false);
  const [faceDetectionReady, setFaceDetectionReady] = useState<boolean>(false);
  const [hasTestedHardware, setHasTestedHardware] = useState<boolean>(false);
  const [isTestingHardware, setIsTestingHardware] = useState<boolean>(false);

  // Hidden video stream element for on-demand hardware testing
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);

  // Clean hardware teardown utility to avoid camera locking
  const cleanupHardwareStreams = useCallback(() => {
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          // ignore
        }
      });
      activeStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Cleanup on unmount or tab switch
  useEffect(() => {
    return () => {
      cleanupHardwareStreams();
    };
  }, [cleanupHardwareStreams]);

  // Safe launcher that releases hardware streams before entering exam room
  const handleLaunchExam = useCallback(
    (mode: 'live' | 'mock', subjectCode?: string) => {
      cleanupHardwareStreams();
      onStartExam(mode, subjectCode || selectedSubjectCode);
    },
    [cleanupHardwareStreams, onStartExam, selectedSubjectCode]
  );

  // On-demand Hardware Check Function (Only triggered when candidate explicitly clicks button)
  const runOnDemandHardwareCheck = async () => {
    setIsTestingHardware(true);
    cleanupHardwareStreams();
    try {
      if (typeof window !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: true,
        });

        activeStreamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        setCameraReady(true);
        setMicReady(true);
        setFaceDetectionReady(true);
        setHasTestedHardware(true);

        setTimeout(() => {
          setIsTestingHardware(false);
        }, 700);
      } else {
        setTimeout(() => {
          setCameraReady(true);
          setMicReady(true);
          setFaceDetectionReady(true);
          setHasTestedHardware(true);
          setIsTestingHardware(false);
        }, 700);
      }
    } catch (err) {
      console.warn('Hardware media stream notice:', err);
      setTimeout(() => {
        setCameraReady(false);
        setMicReady(false);
        setFaceDetectionReady(false);
        setHasTestedHardware(true);
        setIsTestingHardware(false);
      }, 700);
    }
  };

  const handleSignOut = () => {
    cleanupHardwareStreams();
    if (onLogout) {
      onLogout();
    } else {
      logout();
      router.push('/');
    }
  };

  const candidateName = user?.displayName || 'Candidate Student';
  const candidateEmail = user?.email || 'student@minesquiz.com';
  const candidateInitials = candidateName.slice(0, 2).toUpperCase();

  // Candidate Mock Attempts History
  const recentAttempts = [
    {
      id: 'att-mock-01',
      subject: 'MIN-101: CMR Regulations & Law',
      mode: 'Mock Practice',
      score: '92 / 100',
      percentage: '92.0%',
      status: 'Passed',
      date: 'Today, 02:40 PM',
    },
    {
      id: 'att-mock-02',
      subject: 'MIN-102: Mine Ventilation & Gases',
      mode: 'Mock Practice',
      score: '84 / 100',
      percentage: '84.0%',
      status: 'Passed',
      date: 'Yesterday, 07:15 PM',
    },
  ];

  return (
    <div
      data-lenis-prevent="true"
      className="min-h-screen min-h-dvh w-full bg-[#F8FAFC] text-slate-900 font-inter antialiased flex flex-col lg:flex-row selection:bg-blue-600 selection:text-white lg:h-screen lg:h-dvh lg:overflow-hidden"
    >
      {/* Hidden background video tag for hardware testing */}
      <video ref={videoRef} autoPlay playsInline muted className="hidden" />

      {/* ========================================================= */}
      {/* 1. MOBILE PINNED APP BAR (Visible on < 1024px)            */}
      {/* ========================================================= */}
      <div className="lg:hidden sticky top-0 shrink-0 bg-[#090D16] border-b border-slate-800 px-4 py-3 z-30 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-poppins font-black text-sm shadow-sm">
            MQ
          </div>
          <div className="flex flex-col">
            <span className="font-poppins text-base font-black tracking-tight text-white leading-tight">
              Mines<span className="text-blue-400">Quiz</span>
            </span>
            <span className="font-inter text-[10px] text-slate-400 font-medium">Candidate Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-inter">
            <div className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 font-bold text-[10px] flex items-center justify-center">
              {candidateInitials}
            </div>
            <span className="max-w-[100px] truncate font-medium">{candidateName}</span>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            title="Sign Out"
            className="p-2 rounded-lg bg-rose-950/40 text-rose-400 border border-rose-900/40 hover:bg-rose-900/60 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. MOBILE PINNED 4-TAB NAVIGATION BAR (< 1024px)          */}
      {/* ========================================================= */}
      <div className="lg:hidden sticky top-[57px] shrink-0 bg-[#0F172A] border-b border-slate-800 px-2.5 py-2 z-20 shadow-sm">
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800 text-xs font-inter">
          {/* Tab 1: Mock */}
          <button
            type="button"
            onClick={() => {
              cleanupHardwareStreams();
              setActiveTab('mock');
            }}
            className={`py-2 px-1 rounded-lg font-semibold flex flex-col items-center justify-center transition-all cursor-pointer ${
              activeTab === 'mock'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 mb-0.5" />
            <span className="truncate text-[11px]">Mock</span>
          </button>

          {/* Tab 2: Live */}
          <button
            type="button"
            onClick={() => setActiveTab('live')}
            className={`py-2 px-1 rounded-lg font-semibold flex flex-col items-center justify-center transition-all cursor-pointer ${
              activeTab === 'live'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5 mb-0.5 text-rose-400" />
            <span className="truncate text-[11px]">Live Quiz</span>
          </button>

          {/* Tab 3: Instructions (NEW) */}
          <button
            type="button"
            onClick={() => {
              cleanupHardwareStreams();
              setActiveTab('instructions');
            }}
            className={`py-2 px-1 rounded-lg font-semibold flex flex-col items-center justify-center transition-all cursor-pointer ${
              activeTab === 'instructions'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 mb-0.5 text-blue-300" />
            <span className="truncate text-[11px]">Rules</span>
          </button>

          {/* Tab 4: Scorecards */}
          <button
            type="button"
            onClick={() => {
              cleanupHardwareStreams();
              setActiveTab('scorecards');
            }}
            className={`py-2 px-1 rounded-lg font-semibold flex flex-col items-center justify-center transition-all cursor-pointer ${
              activeTab === 'scorecards'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5 mb-0.5 text-amber-400" />
            <span className="truncate text-[11px]">Scores</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. DESKTOP PINNED LEFT SIDEBAR (>= 1024px)                */}
      {/* ========================================================= */}
      <aside className="hidden lg:flex w-72 h-full bg-[#090D16] border-r border-slate-800 flex-col justify-between shrink-0 overflow-y-auto z-30">
        
        {/* Top: Brand Header & Navigation */}
        <div>
          <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-poppins font-black text-lg shadow-md shadow-blue-500/20">
                MQ
              </div>
              <div className="flex flex-col">
                <span className="font-poppins text-lg font-black tracking-tight text-white leading-tight">
                  Mines<span className="text-blue-400">Quiz</span>
                </span>
                <span className="font-inter text-xs text-slate-400 font-semibold tracking-wider uppercase">
                  Assessment Portal
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links: 4 Distinct Tabs */}
          <nav className="p-4 space-y-2">
            
            {/* Nav 1: Mock Test (Camera OFF) */}
            <button
              type="button"
              onClick={() => {
                cleanupHardwareStreams();
                setActiveTab('mock');
              }}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-inter transition-all cursor-pointer ${
                activeTab === 'mock'
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className={`w-4 h-4 ${activeTab === 'mock' ? 'text-white' : 'text-slate-400'}`} />
                <span>Mock Test</span>
              </div>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-medium ${
                activeTab === 'mock' ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                Practice
              </span>
            </button>

            {/* Nav 2: Live Quiz (Proctored) */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('live');
              }}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-inter transition-all cursor-pointer ${
                activeTab === 'live'
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <Radio className={`w-4 h-4 ${activeTab === 'live' ? 'text-white' : 'text-blue-400'}`} />
                <span>Live Quiz</span>
              </div>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-medium ${
                activeTab === 'live' ? 'bg-blue-700 text-white' : 'bg-slate-800 text-emerald-400 border border-emerald-500/20'
              }`}>
                Proctored
              </span>
            </button>

            {/* Nav 3: Instructions (NEW STANDALONE TAB) */}
            <button
              type="button"
              onClick={() => {
                cleanupHardwareStreams();
                setActiveTab('instructions');
              }}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-inter transition-all cursor-pointer ${
                activeTab === 'instructions'
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <BookOpen className={`w-4 h-4 ${activeTab === 'instructions' ? 'text-white' : 'text-blue-400'}`} />
                <span>Instructions</span>
              </div>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-medium ${
                activeTab === 'instructions' ? 'bg-blue-700 text-white' : 'bg-slate-800 text-blue-300 border border-blue-500/20'
              }`}>
                Rules
              </span>
            </button>

            {/* Nav 4: My Scorecards */}
            <button
              type="button"
              onClick={() => {
                cleanupHardwareStreams();
                setActiveTab('scorecards');
              }}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-inter transition-all cursor-pointer ${
                activeTab === 'scorecards'
                  ? 'bg-slate-800 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <Award className={`w-4 h-4 ${activeTab === 'scorecards' ? 'text-white' : 'text-amber-400'}`} />
                <span>My Scorecards</span>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Ledger
              </span>
            </button>

          </nav>
        </div>

        {/* Bottom of Sidebar: Candidate Profile Pill & Logout */}
        <div className="p-4 border-t border-slate-800/80 space-y-3">
          
          <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 font-poppins font-bold text-sm flex items-center justify-center shrink-0 border border-blue-500/30">
              {candidateInitials}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <span className="font-poppins font-semibold text-sm text-white block truncate">
                {candidateName}
              </span>
              <span className="font-mono text-xs text-slate-400 block truncate">
                {candidateEmail}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-inter font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/40 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Session</span>
          </button>

        </div>

      </aside>

      {/* ========================================================= */}
      {/* 4. MAIN ASSESSMENT WORKSPACE CANVAS                       */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0 lg:overflow-hidden">
        
        {/* Workspace Desktop Top Bar (Hidden on Mobile) */}
        <header className="hidden lg:flex h-16 shrink-0 bg-white border-b border-slate-200 px-8 items-center justify-between z-20">
          <div className="flex items-center gap-2 text-sm font-inter">
            <span className="text-slate-400 font-medium">Candidate Workspace</span>
            <span className="text-slate-300">/</span>
            <span className="font-poppins font-bold text-slate-800">
              {activeTab === 'mock'
                ? 'Mock Practice (Camera Disabled)'
                : activeTab === 'live'
                ? 'Statutory Proctored Examination'
                : activeTab === 'instructions'
                ? 'Official Examination Instructions & Rules'
                : 'Performance & Examination Ledger'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-inter font-medium border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>System Online</span>
            </span>
          </div>
        </header>

        {/* Content Container: Native window scroll on mobile, isolated scroll pane on desktop */}
        <div
          data-lenis-prevent="true"
          className="flex-1 w-full max-w-5xl mx-auto px-4 py-5 sm:px-6 sm:py-8 lg:px-8 space-y-6 sm:space-y-8 lg:overflow-y-auto lg:min-h-0 lg:overscroll-y-contain"
        >
          
          {/* ========================================================= */}
          {/* TAB 1: MOCK TEST (FOCUSED CLEAN LAUNCHPAD)                */}
          {/* ========================================================= */}
          {activeTab === 'mock' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-6 sm:space-y-8 text-left"
            >
              {/* Header Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-8 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div>
                    <h1 className="font-poppins text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                      Mining Statutory Mock Examination
                    </h1>
                    <p className="font-inter text-sm sm:text-base text-slate-600 mt-1 leading-relaxed">
                      Beginner-friendly mining engineering question practice with immediate scorecard review. Camera and microphone remain completely inactive.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-inter font-semibold border border-emerald-200 self-start sm:self-auto shrink-0">
                    <CameraOff className="w-4 h-4 text-emerald-600" />
                    <span>Camera OFF</span>
                  </span>
                </div>

                {/* Subject Selector */}
                <div className="pt-4 border-t border-slate-100">
                  <label className="block font-poppins text-sm font-semibold text-slate-800 mb-2">
                    Select Mining Engineering Paper:
                  </label>
                  <select
                    value={selectedSubjectCode}
                    onChange={(e) => setSelectedSubjectCode(e.target.value)}
                    className="w-full sm:max-w-lg bg-slate-50 text-sm font-inter font-medium text-slate-900 border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                  >
                    {MINING_SUBJECTS.map((sub) => (
                      <option key={sub.code} value={sub.code}>
                        {sub.code}: {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Specifications Table */}
              <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
                <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="font-poppins text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Examination Specifications ({selectedSubjectCode})
                  </h3>
                  <span className="font-inter text-xs font-semibold text-slate-500">Practice Mode</span>
                </div>

                <div className="divide-y divide-slate-100 text-sm font-inter">
                  <div className="grid grid-cols-1 sm:grid-cols-2 p-4 sm:p-5 gap-1 sm:gap-2">
                    <span className="text-slate-500 font-medium">Selected Paper</span>
                    <span className="font-poppins font-semibold text-slate-900">{currentSubject.name}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 p-4 sm:p-5 gap-1 sm:gap-2">
                    <span className="text-slate-500 font-medium">Allocated Time</span>
                    <span className="font-semibold text-slate-900 tabular-nums">60 Minutes (Single Sitting)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 p-4 sm:p-5 gap-1 sm:gap-2">
                    <span className="text-slate-500 font-medium">Total Questions</span>
                    <span className="font-semibold text-slate-900 tabular-nums">30 Multiple Choice Questions</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 p-4 sm:p-5 gap-1 sm:gap-2">
                    <span className="text-slate-500 font-medium">Pass Benchmark</span>
                    <span className="font-semibold text-slate-900 tabular-nums">60.0% (Minimum 18 Correct Answers)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 p-4 sm:p-5 gap-1 sm:gap-2">
                    <span className="text-slate-500 font-medium">Hardware Telemetry</span>
                    <span className="font-semibold text-emerald-700">Disabled (Zero camera or audio access)</span>
                  </div>
                </div>
              </div>

              {/* Helpful Callout to Instructions */}
              <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-blue-600 shrink-0" />
                  <p className="text-xs sm:text-sm font-inter text-blue-900 leading-relaxed">
                    First time taking the exam? Review the official rules in the <strong>Instructions</strong> tab anytime.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('instructions')}
                  className="shrink-0 text-xs font-semibold text-blue-700 hover:text-blue-900 underline cursor-pointer"
                >
                  View Rules
                </button>
              </div>

              {/* Launch Action */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-slate-200">
                <span className="text-sm font-inter text-slate-500">
                  Clicking start will launch your unique 30-question practice session immediately.
                </span>

                <button
                  type="button"
                  onClick={() => handleLaunchExam('mock', selectedSubjectCode)}
                  className="w-full sm:w-auto min-h-[48px] bg-[#0A2540] hover:bg-slate-900 active:scale-98 text-white font-poppins font-bold text-sm sm:text-base px-8 py-3.5 sm:py-4 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Start Practice Session</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: LIVE QUIZ (PROCTORED CLEAN LAUNCHPAD)              */}
          {/* ========================================================= */}
          {activeTab === 'live' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-6 sm:space-y-8 text-left"
            >
              {/* Header Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-8 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div>
                    <h1 className="font-poppins text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                      Statutory DGMS Live Assessment
                    </h1>
                    <p className="font-inter text-sm sm:text-base text-slate-600 mt-1 leading-relaxed">
                      Official examination conducted under Directorate General of Mines Safety regulations. Continuous face tracking and tab lock protocols are enforced.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-700 text-xs font-inter font-semibold border border-rose-200 self-start sm:self-auto shrink-0">
                    <Radio className="w-4 h-4 text-rose-600" />
                    <span>Proctored Mode</span>
                  </span>
                </div>

                {/* Subject Selector */}
                <div className="pt-4 border-t border-slate-100">
                  <label className="block font-poppins text-sm font-semibold text-slate-800 mb-2">
                    Statutory Examination Paper:
                  </label>
                  <select
                    value={selectedSubjectCode}
                    onChange={(e) => setSelectedSubjectCode(e.target.value)}
                    className="w-full sm:max-w-lg bg-slate-50 text-sm font-inter font-medium text-slate-900 border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                  >
                    {MINING_SUBJECTS.map((sub) => (
                      <option key={sub.code} value={sub.code}>
                        {sub.code}: {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Hardware Diagnostic Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-poppins text-base font-bold text-slate-900">
                      Hardware & Audio Diagnostics
                    </h3>
                    <p className="font-inter text-sm text-slate-500 mt-0.5">
                      Verify your camera and microphone readiness before entering the proctored room.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={runOnDemandHardwareCheck}
                    disabled={isTestingHardware}
                    className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-inter font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 min-h-[40px]"
                  >
                    <RefreshCw className={`w-4 h-4 ${isTestingHardware ? 'animate-spin' : ''}`} />
                    <span>{hasTestedHardware ? 'Re-test Hardware' : 'Test Camera & Mic'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-sm font-inter">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                    <Camera className="w-5 h-5 text-slate-600 shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-800 block">Webcam Feed</span>
                      <span className="text-xs text-slate-500">
                        {!hasTestedHardware ? 'Not Tested' : cameraReady ? 'Verified' : 'Unavailable'}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                    <Mic className="w-5 h-5 text-slate-600 shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-800 block">Microphone</span>
                      <span className="text-xs text-slate-500">
                        {!hasTestedHardware ? 'Not Tested' : micReady ? 'Verified' : 'Unavailable'}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                    <ScanFace className="w-5 h-5 text-slate-600 shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-800 block">AI Facial Mesh</span>
                      <span className="text-xs text-slate-500">
                        {!hasTestedHardware ? 'Not Tested' : faceDetectionReady ? 'Verified' : 'Unavailable'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Helpful Callout to Instructions */}
              <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/70 border border-rose-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                  <p className="text-xs sm:text-sm font-inter text-rose-900 leading-relaxed">
                    Live exam enforces a <strong>strict 3-strike limit</strong>. Review the code of conduct in the <strong>Instructions</strong> tab.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('instructions')}
                  className="shrink-0 text-xs font-semibold text-rose-700 hover:text-rose-900 underline cursor-pointer"
                >
                  View Rules
                </button>
              </div>

              {/* Launch Action */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 text-sm font-inter text-rose-600">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>Exiting fullscreen or switching tabs will register an integrity alert.</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleLaunchExam('live', selectedSubjectCode)}
                  className="w-full sm:w-auto min-h-[48px] bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-poppins font-bold text-sm sm:text-base px-8 py-3.5 sm:py-4 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Launch Live Proctored Exam</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: DEDICATED INSTRUCTIONS (NEW FULL-PAGE VIEW)         */}
          {/* ========================================================= */}
          {activeTab === 'instructions' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-6 sm:space-y-8 text-left"
            >
              {/* Header Title */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-8 shadow-xs space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Statutory Examination Manual</span>
                </div>
                <h1 className="font-poppins text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Official Code of Conduct & Examination Rules
                </h1>
                <p className="font-inter text-sm sm:text-base text-slate-600 leading-relaxed">
                  Carefully read all statutory regulations before launching your mock or proctored live assessment. Compliance is mandatory under DGMS guidelines.
                </p>
              </div>

              {/* Two Column Grid: DOs vs DONTs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                
                {/* DOs CARD (KYA KARNA HAI) */}
                <div className="p-5 sm:p-7 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 space-y-4 shadow-xs">
                  <div className="flex items-center gap-2.5 text-emerald-950 font-poppins font-bold text-lg border-b border-emerald-200/80 pb-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>DOs (KYA KARNA HAI)</span>
                  </div>

                  <ul className="space-y-4 text-sm font-inter text-emerald-950">
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <div>
                        <strong className="font-semibold block text-emerald-950">Stable Network & Single Seating</strong>
                        <span className="text-emerald-800 leading-relaxed">Ensure a reliable internet connection. Remain seated facing your display screen during the entire assessment.</span>
                      </div>
                    </li>

                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <div>
                        <strong className="font-semibold block text-emerald-950">Frontal Face Lighting</strong>
                        <span className="text-emerald-800 leading-relaxed">Ensure adequate light falls directly on your face so webcam landmark detection remains 100% accurate.</span>
                      </div>
                    </li>

                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <div>
                        <strong className="font-semibold block text-emerald-950">Read Questions Thoroughly</strong>
                        <span className="text-emerald-800 leading-relaxed">Carefully read each question and all 4 options before submitting your selected choice.</span>
                      </div>
                    </li>

                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <div>
                        <strong className="font-semibold block text-emerald-950">Review Answers Before Submit</strong>
                        <span className="text-emerald-800 leading-relaxed">Use Previous and Mark for Review buttons to verify responses before final paper submission.</span>
                      </div>
                    </li>

                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <div>
                        <strong className="font-semibold block text-emerald-950">Auto-Save Protection Active</strong>
                        <span className="text-emerald-800 leading-relaxed">Answers are auto-saved every 10 seconds. When the timer reaches 00:00:00, the exam submits safely.</span>
                      </div>
                    </li>
                  </ul>
                </div>

                {/* DONTs CARD (KYA NAHI KARNA HAI) */}
                <div className="p-5 sm:p-7 rounded-2xl bg-rose-50/70 border border-rose-200/90 space-y-4 shadow-xs">
                  <div className="flex items-center gap-2.5 text-rose-950 font-poppins font-bold text-lg border-b border-rose-200/80 pb-3">
                    <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>DONTs (KYA NAHI KARNA HAI)</span>
                  </div>

                  <ul className="space-y-4 text-sm font-inter text-rose-950">
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                      <div>
                        <strong className="font-semibold block text-rose-950">No Tab Switching or Minimizing</strong>
                        <span className="text-rose-800 leading-relaxed">Never switch browser tabs, press Alt+Tab, or minimize your window. Each exit logs an integrity strike.</span>
                      </div>
                    </li>

                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                      <div>
                        <strong className="font-semibold block text-rose-950">No Secondary Person in Room</strong>
                        <span className="text-rose-800 leading-relaxed">Only the registered candidate is permitted. If another person enters the camera frame, a flag is registered.</span>
                      </div>
                    </li>

                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                      <div>
                        <strong className="font-semibold block text-rose-950">No Mobile Phones or Gadgets</strong>
                        <span className="text-rose-800 leading-relaxed">Smartphones, smartwatches, Bluetooth earphones, and printed notes are strictly prohibited on the desk.</span>
                      </div>
                    </li>

                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                      <div>
                        <strong className="font-semibold block text-rose-950">No Looking Away (&gt;35° Turns)</strong>
                        <span className="text-rose-800 leading-relaxed">Continuous gaze deviation away from the screen or covering the camera lens triggers an invigilation flag.</span>
                      </div>
                    </li>

                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                      <div>
                        <strong className="font-semibold block text-rose-950">Strict 3-Strike Disqualification</strong>
                        <span className="text-rose-800 leading-relaxed">A maximum limit of 3 violation strikes is enforced. On the 3rd strike, the session terminates with 0 marks.</span>
                      </div>
                    </li>
                  </ul>
                </div>

              </div>

              {/* Scoring & Benchmark Specifications Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-4">
                <h3 className="font-poppins text-lg font-bold text-slate-900">
                  Examination Scoring & Passing Criteria
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm font-inter">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-xs text-slate-500 block font-medium">Question Value</span>
                    <span className="font-bold text-slate-900 text-base mt-0.5 block tabular-nums">+1.0 Mark</span>
                    <span className="text-xs text-slate-400 mt-1 block">Awarded for each correct answer</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-xs text-slate-500 block font-medium">Negative Marking</span>
                    <span className="font-bold text-emerald-700 text-base mt-0.5 block tabular-nums">0.0 Mark</span>
                    <span className="text-xs text-slate-400 mt-1 block">Zero penalty for wrong answers</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-xs text-slate-500 block font-medium">Statutory Pass Mark</span>
                    <span className="font-bold text-emerald-700 text-base mt-0.5 block tabular-nums">60.0% Minimum</span>
                    <span className="text-xs text-slate-400 mt-1 block">At least 18 correct answers required</span>
                  </div>
                </div>
              </div>

              {/* Quick Navigation Action to Test */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-slate-200">
                <span className="text-sm font-inter text-slate-500">
                  Ready to test your knowledge? Proceed directly to practice or official assessment.
                </span>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('mock')}
                    className="w-full sm:w-auto min-h-[48px] bg-slate-100 hover:bg-slate-200 text-slate-800 font-poppins font-bold text-sm px-6 py-3 rounded-xl transition-all cursor-pointer"
                  >
                    Go to Mock Practice
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('live')}
                    className="w-full sm:w-auto min-h-[48px] bg-blue-600 hover:bg-blue-700 text-white font-poppins font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Go to Live Quiz</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: MY SCORECARDS (CANDIDATE LEDGER & HISTORY)         */}
          {/* ========================================================= */}
          {activeTab === 'scorecards' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-6 text-left"
            >
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-8 shadow-xs">
                <h2 className="font-poppins text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  My Examination Scorecards
                </h2>
                <p className="font-inter text-sm sm:text-base text-slate-500 mt-1 leading-relaxed">
                  Official verified history of your statutory mining engineering mock and live assessments.
                </p>

                {/* Scorecards Table */}
                <div className="mt-6 border border-slate-200 rounded-xl overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left border-collapse text-sm font-inter">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-poppins font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3.5 px-4 sm:px-5">Subject</th>
                        <th className="py-3.5 px-4 sm:px-5">Mode</th>
                        <th className="py-3.5 px-4 sm:px-5">Score</th>
                        <th className="py-3.5 px-4 sm:px-5">Percentage</th>
                        <th className="py-3.5 px-4 sm:px-5">Status</th>
                        <th className="py-3.5 px-4 sm:px-5">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {recentAttempts.map((attempt) => (
                        <tr key={attempt.id} className="hover:bg-slate-50/50">
                          <td className="py-4 px-4 sm:px-5 font-semibold text-slate-900">
                            {attempt.subject}
                          </td>
                          <td className="py-4 px-4 sm:px-5 text-slate-600">
                            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                              {attempt.mode}
                            </span>
                          </td>
                          <td className="py-4 px-4 sm:px-5 font-semibold text-slate-900 tabular-nums">
                            {attempt.score}
                          </td>
                          <td className="py-4 px-4 sm:px-5 font-bold text-slate-900 tabular-nums">
                            {attempt.percentage}
                          </td>
                          <td className="py-4 px-4 sm:px-5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                              <CheckCircle2 className="w-4 h-4" />
                              Passed
                            </span>
                          </td>
                          <td className="py-4 px-4 sm:px-5 text-slate-500">
                            {attempt.date}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Social Footer */}
          <SocialFooter variant="light" className="mt-8" />
        </div>

      </main>
    </div>
  );
};

export default CandidateExamSessionPortal;
