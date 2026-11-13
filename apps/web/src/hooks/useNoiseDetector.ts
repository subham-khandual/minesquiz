import { useEffect, useRef, useState, useCallback } from 'react';

interface UseNoiseDetectorOptions {
  enabled?: boolean;
  noiseThresholdDb?: number; // e.g. 60-70 dB
  onNoiseViolation?: (volumeDb: number) => void;
}

export function useNoiseDetector({
  enabled = true,
  noiseThresholdDb = 65,
  onNoiseViolation,
}: UseNoiseDetectorOptions = {}) {
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [currentVolume, setCurrentVolume] = useState<number>(0);
  const [isNoiseHigh, setIsNoiseHigh] = useState<boolean>(false);
  const [hasAudioPermission, setHasAudioPermission] = useState<boolean>(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const violationCooldownRef = useRef<boolean>(false);

  const startAudio = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);
      setHasAudioPermission(true);

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.4;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
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
          if (onNoiseViolation) {
            onNoiseViolation(decibels);
          }
          // Cooldown for 5 seconds to prevent alert flood
          setTimeout(() => {
            violationCooldownRef.current = false;
          }, 5000);
        }

        animationFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (err) {
      console.warn('Audio/Mic access denied or unavailable:', err);
      setHasAudioPermission(false);
    }
  }, [noiseThresholdDb, onNoiseViolation]);

  const stopAudio = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
    if (audioStream) {
      audioStream.getTracks().forEach((t) => t.stop());
      setAudioStream(null);
    }
    setHasAudioPermission(false);
  }, [audioStream]);

  useEffect(() => {
    if (enabled) {
      startAudio();
    }
    return () => {
      stopAudio();
    };
  }, [enabled, startAudio, stopAudio]);

  return {
    hasAudioPermission,
    currentVolume,
    isNoiseHigh,
    startAudio,
    stopAudio,
  };
}

