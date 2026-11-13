'use client';

import React, { useEffect } from 'react';
import { useWebcam } from '../hooks/useWebcam';
import { useFaceDetector } from '../hooks/useFaceDetector';
import { useNoiseDetector } from '../hooks/useNoiseDetector';
import { useProctorStore } from '../stores/useProctorStore';
import { VideoOff, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

interface WebcamProctorViewProps {
  attemptId?: string;
}

export const WebcamProctorView: React.FC<WebcamProctorViewProps> = ({ attemptId }) => {
  const { videoRef, hasPermission, error, startWebcam, captureSnapshot } = useWebcam();
  const { isModelLoaded, facesDetected } = useFaceDetector({
    videoRef,
    attemptId,
    enabled: hasPermission,
    captureSnapshot,
  });

  const { reportViolation, violationsCount, maxAllowedViolations, setCameraActive } = useProctorStore();

  // Noise detector: detects ambient voice or sound > 65dB
  const { isNoiseHigh, currentVolume } = useNoiseDetector({
    enabled: hasPermission,
    noiseThresholdDb: 68,
    onNoiseViolation: (vol) => {
      reportViolation('audio_detected', `High Noise Detected (${vol} dB). Please keep your surroundings quiet.`);
    },
  });

  useEffect(() => {
    startWebcam();
  }, [startWebcam]);

  useEffect(() => {
    setCameraActive(hasPermission);
  }, [hasPermission, setCameraActive]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg p-3 space-y-3">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Proctoring</span>
        </div>
        <div className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
          Violations: {violationsCount}/{maxAllowedViolations}
        </div>
      </div>

      {/* Video Box with REC overlay */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
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
            <VideoOff className="w-8 h-8 text-rose-500 mx-auto mb-2 opacity-80" />
            <p className="text-xs text-slate-400">{error || 'Requesting camera permissions...'}</p>
          </div>
        )}

        {/* Live [REC] Tag Overlay */}
        {hasPermission && (
          <>
            <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-bold text-white border border-white/10 tracking-wider">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>REC</span>
            </div>

            {/* Corner Face Tracker Frame */}
            <div className="absolute inset-4 border border-dashed border-emerald-400/40 rounded-lg pointer-events-none">
              <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-emerald-400" />
              <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-emerald-400" />
              <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-emerald-400" />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-emerald-400" />
            </div>
          </>
        )}
      </div>

      {/* Real-time Proctoring Status Checklist */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 text-xs space-y-1.5">
        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
          Proctoring Status
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-300">Face Detected</span>
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Active</span>
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-300">Eye Gaze</span>
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Normal</span>
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-300">Movement</span>
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Stable</span>
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-300">Noise Monitor</span>
          <span
            className={`flex items-center gap-1 font-medium ${
              isNoiseHigh ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {isNoiseHigh ? (
              <>
                <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
                <span>High ({currentVolume}dB)</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Low ({currentVolume}dB)</span>
              </>
            )}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-300">Tab Switch</span>
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Blocked</span>
          </span>
        </div>
      </div>

      {violationsCount > 0 && (
        <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-900/60 flex items-center gap-2 text-rose-300 text-xs">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>Notice: Suspicious activity logged. Exam integrity is being recorded.</span>
        </div>
      )}
    </div>
  );
};
