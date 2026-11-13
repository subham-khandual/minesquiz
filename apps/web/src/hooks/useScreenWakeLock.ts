'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseScreenWakeLockOptions {
  enabled?: boolean;
  onRequest?: () => void;
  onRelease?: () => void;
  onError?: (err: Error) => void;
}

interface UseScreenWakeLockReturn {
  isSupported: boolean;
  isLocked: boolean;
  requestWakeLock: () => Promise<boolean>;
  releaseWakeLock: () => Promise<void>;
}

/**
 * Screen Wake Lock Hook adhering to Google Chrome Modern Web Guidance.
 * Keeps candidate display active during statutory DGMS mining exams,
 * preventing screen dimming and auto-sleep while reading questions.
 * Handles automatic re-acquisition on tab visibility changes.
 */
export function useScreenWakeLock({
  enabled = true,
  onRequest,
  onRelease,
  onError,
}: UseScreenWakeLockOptions = {}): UseScreenWakeLockReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const wakeLockRef = useRef<any>(null);

  // Check browser API support on client mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'wakeLock' in navigator) {
      setIsSupported(true);
    }
  }, []);

  const requestWakeLock = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('wakeLock' in navigator)) {
      return false;
    }

    try {
      // Release existing sentinel if already held
      if (wakeLockRef.current && !wakeLockRef.current.released) {
        await wakeLockRef.current.release();
      }

      const sentinel = await (navigator as any).wakeLock.request('screen');
      wakeLockRef.current = sentinel;
      setIsLocked(true);

      sentinel.addEventListener('release', () => {
        setIsLocked(false);
        onRelease?.();
      });

      onRequest?.();
      return true;
    } catch (err: any) {
      // Common reasons: low battery mode, device policy, or window hidden
      console.warn('[ScreenWakeLock] Request failed:', err?.message || err);
      setIsLocked(false);
      onError?.(err instanceof Error ? err : new Error(String(err)));
      return false;
    }
  }, [onRequest, onRelease, onError]);

  const releaseWakeLock = useCallback(async (): Promise<void> => {
    try {
      if (wakeLockRef.current && !wakeLockRef.current.released) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
      setIsLocked(false);
    } catch (err: any) {
      console.warn('[ScreenWakeLock] Release error:', err?.message || err);
    }
  }, []);

  // Primary lifecycle: Request when enabled, re-acquire when returning to visible
  useEffect(() => {
    if (!enabled || !isSupported) return;

    let mounted = true;

    const acquire = async () => {
      if (document.visibilityState === 'visible' && mounted) {
        await requestWakeLock();
      }
    };

    acquire();

    // Re-acquire lock when candidate returns to the exam tab
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && mounted) {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock();
    };
  }, [enabled, isSupported, requestWakeLock, releaseWakeLock]);

  return {
    isSupported,
    isLocked,
    requestWakeLock,
    releaseWakeLock,
  };
}
