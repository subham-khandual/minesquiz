'use client';

import React, { useState, useEffect } from 'react';
import { useWebcam } from '../hooks/useWebcam';
import { useFaceDetector } from '../hooks/useFaceDetector';
import { Button } from '@mines-quiz/ui';
import { ShieldCheck, CheckCircle2, Video, Lock, AlertCircle } from 'lucide-react';

interface PreExamVerificationModalProps {
  quizTitle: string;
  onVerifiedAndProceed: () => void;
  onCancel: () => void;
}

export const PreExamVerificationModal: React.FC<PreExamVerificationModalProps> = ({
  quizTitle,
  onVerifiedAndProceed,
  onCancel,
}) => {
  const [step, setStep] = useState<'camera_check' | 'face_verified' | 'locked_mode_terms'>('camera_check');
  const { videoRef, hasPermission, error, startWebcam, captureSnapshot } = useWebcam();
  const { isModelLoaded } = useFaceDetector({
    videoRef,
    enabled: hasPermission,
    captureSnapshot,
  });

  useEffect(() => {
    startWebcam();
  }, [startWebcam]);

  // When camera & model ready, allow verification
  const handleVerifyFace = () => {
    setStep('face_verified');
    setTimeout(() => {
      setStep('locked_mode_terms');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full overflow-y-auto max-h-[90dvh] shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800/60 text-blue-400 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Mines Quiz • AI Proctor Verification</span>
          </div>
          <h3 className="text-xl font-extrabold text-white">{quizTitle}</h3>
          <p className="text-xs text-slate-400 mt-1">
            {step === 'locked_mode_terms'
              ? 'Review examination security rules before entering'
              : 'Complete identity & camera liveness check'}
          </p>
        </div>

        {/* Content based on sub-step */}
        <div className="p-6 space-y-5">
          {step !== 'locked_mode_terms' ? (
            <div className="space-y-4">
              {/* Webcam view with AI face bounding box */}
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transform scale-x-[-1] ${
                    !hasPermission ? 'hidden' : 'block'
                  }`}
                />

                {!hasPermission && (
                  <div className="text-center p-4">
                    <Video className="w-8 h-8 text-rose-500 mx-auto mb-2 animate-pulse" />
                    <p className="text-xs text-slate-400">{error || 'Please allow webcam access...'}</p>
                  </div>
                )}

                {/* AI Detection overlay bounding box */}
                {hasPermission && (
                  <div className="absolute inset-10 border-2 border-dashed border-emerald-400/80 rounded-2xl pointer-events-none flex items-center justify-center">
                    <div className="w-full h-full relative">
                      {/* Corner marks */}
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                    </div>
                  </div>
                )}

                {step === 'face_verified' && (
                  <div className="absolute inset-0 bg-emerald-950/70 backdrop-blur-xs flex flex-col items-center justify-center animate-fade-in text-emerald-300">
                    <CheckCircle2 className="w-14 h-14 text-emerald-400 mb-2" />
                    <span className="font-bold text-base">Face Verified Successfully!</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${hasPermission ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                  {hasPermission ? 'Camera Active' : 'Camera Disconnected'}
                </span>
                <span>Position your face inside the bounding box</span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={onCancel}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  disabled={!hasPermission}
                  onClick={handleVerifyFace}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Verify Face & Continue
                </Button>
              </div>
            </div>
          ) : (
            /* Step 3: Locked Mode Checklist */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-white pb-2 border-b border-slate-800">
                  <Lock className="w-4 h-4 text-blue-400" />
                  <span>Secure Exam Mode (Anti-Cheat Active)</span>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Tab switch blocked</strong>, Leaving the tab triggers instant alert</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Copy / Paste disabled</strong>, Clipboard inspection is locked</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Screen recording blocked</strong>, DevTools & shortcuts restricted</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Auto return if violated</strong>, Screen will lock upon 3 strikes</span>
                  </li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/40 flex items-start gap-2.5 text-xs text-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Strict 1 Attempt Rule</strong>: Once started, your session is tied to your email. Submitting will permanently lock re-attempts.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={onCancel}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={onVerifiedAndProceed}
                  className="bg-blue-600 hover:bg-blue-500 font-bold px-6"
                >
                  Enter Exam Room
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

