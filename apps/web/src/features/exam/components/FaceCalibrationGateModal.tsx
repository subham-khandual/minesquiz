'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWebcam } from '../../../hooks/useWebcam';
import { useFaceDetector } from '../../../hooks/useFaceDetector';
import { Button } from '@mines-quiz/ui';
import {
  Camera,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  VideoOff,
  UserCheck,
} from 'lucide-react';

interface FaceCalibrationGateModalProps {
  quizTitle: string;
  candidateName?: string;
  onCalibrationComplete: (snapshot: string) => void;
}

export const FaceCalibrationGateModal: React.FC<FaceCalibrationGateModalProps> = ({
  quizTitle,
  candidateName = 'Candidate',
  onCalibrationComplete,
}) => {
  const { videoRef, hasPermission, error, startWebcam, captureSnapshot } = useWebcam();
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const { facesDetected, yaw, pitch, poseStatus, faceBox } = useFaceDetector({
    videoRef,
    enabled: hasPermission,
    captureSnapshot,
  });

  useEffect(() => {
    startWebcam();
  }, [startWebcam]);

  // Determine real-time face alignment state
  const isFacePresent = facesDetected > 0 && poseStatus !== 'no_face';
  const isFaceCentered = isFacePresent && poseStatus === 'center' && facesDetected === 1;

  // Auto-capture reference photo after face remains centered for 1.5 seconds
  const autoCaptureTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isFaceCentered && !capturedPhoto) {
      if (!autoCaptureTimerRef.current) {
        autoCaptureTimerRef.current = setTimeout(() => {
          const snap = captureSnapshot();
          if (snap) {
            setCapturedPhoto(snap);
          }
        }, 1500);
      }
    } else {
      if (autoCaptureTimerRef.current) {
        clearTimeout(autoCaptureTimerRef.current);
        autoCaptureTimerRef.current = null;
      }
    }

    return () => {
      if (autoCaptureTimerRef.current) {
        clearTimeout(autoCaptureTimerRef.current);
        autoCaptureTimerRef.current = null;
      }
    };
  }, [isFaceCentered, capturedPhoto, captureSnapshot]);

  const handleManualCapture = () => {
    setIsCapturing(true);
    const snap = captureSnapshot();
    if (snap) {
      setCapturedPhoto(snap);
    }
    setTimeout(() => setIsCapturing(false), 300);
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  const handleConfirmAndBegin = () => {
    const finalPhoto = capturedPhoto || captureSnapshot() || '';
    onCalibrationComplete(finalPhoto);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden my-auto">
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                Official DGMS Statutory Proctoring
              </div>
              <h2 className="text-base font-bold text-white leading-tight">
                Candidate Face Setup & Calibration
              </h2>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Step 1 of 2
          </span>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Welcome, <span className="text-white font-semibold">{candidateName}</span>. Before starting{' '}
            <span className="text-emerald-400 font-medium">{quizTitle}</span>, align your face inside the green oval reticle to lock your statutory reference image.
          </p>

          {/* Camera Viewfinder with Illuminated Reticle */}
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-300 ${
                !hasPermission ? 'opacity-0' : 'opacity-100'
              }`}
            />

            {!hasPermission && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-950">
                <VideoOff className="w-9 h-9 text-rose-500 mb-2 animate-pulse" />
                <h4 className="text-xs font-bold text-slate-200 mb-1">Camera Permission Required</h4>
                <p className="text-[11px] text-slate-400 max-w-xs">{error || 'Please allow webcam access in your browser to proceed.'}</p>
              </div>
            )}

            {/* Target Oval Reticle Overlay */}
            {hasPermission && (
              <div
                className={`absolute pointer-events-none rounded-[50%] border-2 transition-all duration-300 flex items-center justify-center ${
                  isFaceCentered
                    ? 'border-emerald-400 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.35)]'
                    : isFacePresent
                    ? 'border-amber-400 border-dashed bg-amber-400/5 animate-pulse'
                    : 'border-rose-500/70 border-dashed bg-rose-500/5'
                }`}
                style={{
                  left: '24%',
                  top: '12%',
                  width: '52%',
                  height: '76%',
                }}
              >
                {/* Status Pill on Top of Oval */}
                <div
                  className={`absolute -top-3.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border shadow-md ${
                    isFaceCentered
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                      : isFacePresent
                      ? 'bg-amber-950 text-amber-300 border-amber-600'
                      : 'bg-rose-950 text-rose-300 border-rose-600'
                  }`}
                >
                  {isFaceCentered
                    ? 'Face Centered ✓'
                    : isFacePresent
                    ? 'Align in Oval'
                    : 'No Face Detected'}
                </div>

                {/* Reticle Corner Guides */}
                <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-inherit" />
                <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-inherit" />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-inherit" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-inherit" />
              </div>
            )}

            {/* Dynamic Tracking Box */}
            {hasPermission && faceBox && (
              <div
                className="absolute border border-emerald-400/60 rounded pointer-events-none transition-all duration-150"
                style={{
                  left: `${faceBox.x * 100}%`,
                  top: `${faceBox.y * 100}%`,
                  width: `${faceBox.width * 100}%`,
                  height: `${faceBox.height * 100}%`,
                }}
              />
            )}
          </div>

          {/* Reference Photo Preview Strip */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 rounded-full bg-slate-800 border-2 border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                {capturedPhoto ? (
                  <img
                    src={capturedPhoto}
                    alt="Candidate Reference"
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                ) : (
                  <Camera className="w-5 h-5 text-slate-500" />
                )}
                {capturedPhoto && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border border-slate-900 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <span>Reference ID Image</span>
                  {capturedPhoto ? (
                    <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800">
                      Locked ✓
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-400 font-mono bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-800">
                      Pending
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-inter">
                  {capturedPhoto
                    ? 'Your face profile is calibrated and locked for this exam session.'
                    : 'Position your face in the oval to capture reference photo.'}
                </p>
              </div>
            </div>

            {hasPermission && (
              <div className="shrink-0 flex items-center gap-1.5">
                {capturedPhoto ? (
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded border border-slate-700 hover:bg-slate-800 flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retake</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleManualCapture}
                    disabled={!isFacePresent || isCapturing}
                    className="text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{isCapturing ? 'Capturing...' : 'Capture Photo'}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Statutory Enforcement Warning Alert */}
          <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-3 flex items-start gap-2.5 text-left">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-200/90 leading-relaxed font-inter">
              <span className="font-bold text-amber-300">Statutory 2-Strikes Policy:</span> During the examination, your face must remain inside this calibrated reticle. If your face moves out or is cut off:
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-300/80">
                <li><span className="text-amber-200 font-semibold">Strike 1:</span> Warning banner and audio alert with 5s re-centering window.</li>
                <li><span className="text-rose-400 font-semibold">Strike 2:</span> Immediate exam termination and disqualification.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-3">
          <Button
            variant="primary"
            disabled={!hasPermission || !capturedPhoto}
            onClick={handleConfirmAndBegin}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs py-2.5 px-6 rounded-xl shadow-lg transition-all"
          >
            <UserCheck className="w-4 h-4 mr-2" />
            Confirm Face Frame & Begin Examination
          </Button>
        </div>
      </div>
    </div>
  );
};
