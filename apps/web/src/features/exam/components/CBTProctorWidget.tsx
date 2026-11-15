'use client';

import React, { useEffect } from 'react';
import { useWebcam } from '../../../hooks/useWebcam';
import { useFaceDetector } from '../../../hooks/useFaceDetector';
import { useNoiseDetector } from '../../../hooks/useNoiseDetector';
import { useProctorStore } from '../../../stores/useProctorStore';
import {
  VideoOff,
  CheckCircle2,
  AlertTriangle,
  Maximize2,
  Wifi,
} from 'lucide-react';

interface CBTProctorWidgetProps {
  attemptId?: string;
  isLiveProctored?: boolean;
  isActive?: boolean;
  layout?: 'desktop' | 'mobile';
}

export const CBTProctorWidget: React.FC<CBTProctorWidgetProps> = ({
  attemptId,
  isLiveProctored = true,
  isActive = true,
  layout = 'desktop',
}) => {
  const {
    reportViolation,
    reportWarning,
    violationsCount,
    maxAllowedViolations,
    faceAbsenceCount,
    maxAllowedFaceAbsences,
    setCameraActive,
  } = useProctorStore();

  const { videoRef, stream, hasPermission, error, startWebcam, stopWebcam, captureSnapshot } = useWebcam();

  const {
    facesDetected,
    yaw,
    pitch,
    poseStatus,
    faceBox,
  } = useFaceDetector({
    videoRef,
    attemptId,
    enabled: hasPermission && isLiveProctored && isActive,
    captureSnapshot,
  });

  const { isNoiseHigh, currentVolume } = useNoiseDetector({
    enabled: hasPermission && isLiveProctored && isActive,
    noiseThresholdDb: 70,
    onNoiseViolation: (vol) => {
      reportWarning('audio_detected', `Background sound detected (${vol} dB). Please keep your surroundings quiet.`);
    },
  });

  // Auto-Shutdown Hardware: If isActive becomes false (submission or exam timeout), kill camera hardware immediately
  useEffect(() => {
    if (!isActive) {
      stopWebcam();
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setCameraActive(false);
    }
  }, [isActive, stopWebcam, setCameraActive, videoRef]);

  // Synchronize webcam stream to the single active video element
  useEffect(() => {
    if (stream && isActive && videoRef.current) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
      videoRef.current.play().catch(() => {});
    }
  }, [stream, isActive, videoRef]);

  useEffect(() => {
    if (isLiveProctored && isActive) {
      startWebcam();
    }
  }, [isLiveProctored, isActive, startWebcam]);

  useEffect(() => {
    setCameraActive(hasPermission && isLiveProctored && isActive);
  }, [hasPermission, isLiveProctored, isActive, setCameraActive]);

  // If exam has ended or submitted, show offline completion state
  if (!isActive) {
    return (
      <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 text-center select-none space-y-1.5">
        <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 mb-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        </div>
        <h4 className="font-poppins font-bold text-xs text-slate-800">
          Examination Finished
        </h4>
        <p className="text-[11px] text-slate-500 font-inter">
          Camera and audio monitoring are completely offline.
        </p>
      </div>
    );
  }

  // If mock/practice mode, show practice badge
  if (!isLiveProctored) {
    return (
      <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 text-left space-y-2 select-none">
        <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Practice Session Active</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed font-inter">
          Mock mode: Webcam proctoring and violation penalties are disabled.
        </p>
      </div>
    );
  }

  // =========================================================================
  // MOBILE LAYOUT
  // Compact horizontal inline card
  // =========================================================================
  if (layout === 'mobile') {
    return (
      <div className="w-full bg-white rounded-xl border border-slate-200/90 shadow-xs p-2.5 flex items-center gap-3 select-none">
        {/* Small Video Thumbnail with face box */}
        <div className="relative w-20 h-16 rounded-lg bg-slate-950 overflow-hidden border border-slate-300 shrink-0 flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-200 ${
              !hasPermission ? 'opacity-0' : 'opacity-100'
            }`}
          />
          {!hasPermission && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
              {error ? (
                <VideoOff className="w-5 h-5 text-rose-500 opacity-80" />
              ) : (
                <span className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          )}
          {hasPermission && faceBox && (
            <div
              className="absolute border border-emerald-400 rounded pointer-events-none"
              style={{
                left: `${faceBox.x * 100}%`,
                top: `${faceBox.y * 100}%`,
                width: `${faceBox.width * 100}%`,
                height: `${faceBox.height * 100}%`,
              }}
            />
          )}
        </div>

        {/* Status Indicators on Right */}
        <div className="flex-1 space-y-1 text-[11px] font-inter">
          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Camera Active</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Mic Active</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <Wifi className="w-3 h-3 text-emerald-600" />
            <span>Connection: Stable</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // DESKTOP LAYOUT (Default)
  // Full sidebar card with live video feed and telemetry checklist
  // =========================================================================
  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 select-none">
      {/* Header: Camera Active & Expand */}
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-poppins font-bold text-xs text-slate-800">
            Camera Active
          </span>
        </div>
        <button
          type="button"
          className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          title="Proctoring feed is locked by exam policy"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Live Video Feed Box */}
      <div className="relative aspect-[4/3] bg-slate-950 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center shadow-inner">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-200 ${
            !hasPermission ? 'opacity-0' : 'opacity-100'
          }`}
        />

        {!hasPermission && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 p-3 text-center">
            {error ? (
              <>
                <VideoOff className="w-7 h-7 text-rose-500 mx-auto mb-1.5 opacity-80" />
                <p className="text-[11px] text-rose-400 font-inter">{error}</p>
              </>
            ) : (
              <>
                <span className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-[11px] text-slate-400 font-inter">Initializing camera feed...</p>
              </>
            )}
          </div>
        )}

        {/* Green Face Tracking Bounding Box */}
        {hasPermission && faceBox && (
          <div
            className={`absolute border-2 rounded-lg pointer-events-none transition-all duration-150 ${
              poseStatus === 'center'
                ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                : poseStatus === 'no_face' || poseStatus === 'multiple'
                ? 'border-rose-500 bg-rose-500/15 animate-pulse'
                : 'border-amber-400 bg-amber-400/10'
            }`}
            style={{
              left: `${faceBox.x * 100}%`,
              top: `${faceBox.y * 100}%`,
              width: `${faceBox.width * 100}%`,
              height: `${faceBox.height * 100}%`,
            }}
          >
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-inherit" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-inherit" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-inherit" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-inherit" />
          </div>
        )}
      </div>

      {/* Telemetry Status Checklist below video */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2 text-xs font-inter">
        {/* Microphone Active */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Microphone Active</span>
          </div>
          <div className="flex items-center gap-0.5">
            <span className={`w-1 h-2 rounded-full ${currentVolume > 20 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            <span className={`w-1 h-3 rounded-full ${currentVolume > 40 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            <span className={`w-1 h-4 rounded-full ${currentVolume > 60 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          </div>
        </div>

        {/* Connection: Stable */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Connection: Stable</span>
          </div>
          <Wifi className="w-3.5 h-3.5 text-emerald-600" />
        </div>

        {/* Violations Count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <AlertTriangle className={`w-3.5 h-3.5 ${violationsCount > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
            <span>Violations: {violationsCount}</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">
            Max: {maxAllowedViolations}
          </span>
        </div>
      </div>
    </div>
  );
};
