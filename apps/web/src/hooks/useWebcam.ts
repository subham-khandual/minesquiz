import { useEffect, useRef, useState, useCallback } from 'react';

export function useWebcam() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);

  const stopWebcam = useCallback(() => {
    // 1. Immediately stop and disable all hardware tracks from streamRef
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
          track.enabled = false;
        } catch {}
      });
      streamRef.current = null;
    }

    // 2. Sever video element hardware binding
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setStream(null);
    setHasPermission(false);
  }, []);

  const startWebcam = useCallback(async () => {
    try {
      setError(null);
      let mediaStream: MediaStream;

      // Attempt unified camera and microphone capture in a single permission prompt
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
          audio: true,
        });
      } catch (unifiedErr) {
        // Fallback to video-only if microphone hardware is unavailable
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
          audio: false,
        });
      }

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        try {
          await videoRef.current.play();
        } catch {}
      }

      // Expose global shutdown hook for immediate exam completion cleanup
      if (typeof window !== 'undefined') {
        (window as any).__stopAllWebcamHardware = stopWebcam;
      }
    } catch (err: any) {
      setError(err.message || 'Unable to access webcam');
      setHasPermission(false);
    }
  }, [stopWebcam]);

  const captureSnapshot = useCallback((): string | null => {
    if (!videoRef.current) return null;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.6);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, [stopWebcam]);

  return {
    videoRef,
    stream,
    hasPermission,
    error,
    startWebcam,
    stopWebcam,
    captureSnapshot,
  };
}
