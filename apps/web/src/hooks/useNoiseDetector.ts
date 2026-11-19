import { useEffect, useRef, useState, useCallback } from 'react';

interface UseNoiseDetectorOptions {
  enabled?: boolean;
  stream?: MediaStream | null;
  noiseThresholdDb?: number; // e.g. 35-45 dB
  onNoiseViolation?: (volumeDb: number) => void;
}

export function useNoiseDetector({
  enabled = true,
  stream,
  noiseThresholdDb = 38,
  onNoiseViolation,
}: UseNoiseDetectorOptions = {}) {
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const [currentVolume, setCurrentVolume] = useState<number>(0);
  const [isNoiseHigh, setIsNoiseHigh] = useState<boolean>(false);
  const [hasAudioPermission, setHasAudioPermission] = useState<boolean>(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const violationCooldownRef = useRef<boolean>(false);
  const onViolationRef = useRef(onNoiseViolation);

  useEffect(() => {
    onViolationRef.current = onNoiseViolation;
  }, [onNoiseViolation]);

  const stopAudio = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch {}
      sourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
          t.enabled = false;
        } catch {}
      });
      audioStreamRef.current = null;
    }
    setAudioStream(null);
    setHasAudioPermission(false);
  }, []);

  const startAudio = useCallback(async () => {
    try {
      let activeStream: MediaStream;

      if (stream && stream.getAudioTracks().length > 0) {
        activeStream = stream;
      } else {
        activeStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      audioStreamRef.current = activeStream;
      setAudioStream(activeStream);
      setHasAudioPermission(true);

      if (typeof window !== 'undefined') {
        (window as any).__stopAllAudioHardware = stopAudio;
      }

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.4;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(activeStream);
      source.connect(analyser);
      sourceRef.current = source;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate Root Mean Square (RMS) volume
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / bufferLength);

        // Convert normalized RMS (0-255) to approximate dB scale (0-100)
        const decibels = Math.min(100, Math.round((rms / 255) * 100));
        setCurrentVolume(decibels);

        const high = decibels > noiseThresholdDb;
        setIsNoiseHigh(high);

        if (high && !violationCooldownRef.current) {
          violationCooldownRef.current = true;
          if (onViolationRef.current) {
            onViolationRef.current(decibels);
          }
          // Cooldown for 4 seconds to prevent alert flood
          setTimeout(() => {
            violationCooldownRef.current = false;
          }, 4000);
        }

        animationFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (err) {
      console.warn('Audio/Mic access denied or unavailable:', err);
      setHasAudioPermission(false);
    }
  }, [stream, noiseThresholdDb, stopAudio]);

  useEffect(() => {
    if (enabled) {
      startAudio();
    }
    return () => {
      stopAudio();
    };
  }, [enabled, stream, startAudio, stopAudio]);

  return {
    hasAudioPermission,
    currentVolume,
    isNoiseHigh,
    startAudio,
    stopAudio,
  };
}

