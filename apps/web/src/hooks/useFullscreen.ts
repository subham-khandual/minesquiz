import { useEffect, useState, useCallback, useRef } from 'react';

export function useFullscreen(onExitFullscreen?: () => void) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const isMobileRef = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const detectedMobile = mobileRegex.test(navigator.userAgent) || (window.innerWidth <= 768);
      setIsMobile(detectedMobile);
      isMobileRef.current = detectedMobile;

      // On mobile devices, smartphone displays are already fullscreen hardware
      if (detectedMobile) {
        setIsFullscreen(true);
      }
    }
  }, []);

  const requestFullscreen = useCallback(async () => {
    try {
      if (typeof document !== 'undefined' && document.documentElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        // Fallback for mobile / browsers without Fullscreen API (e.g. iOS Safari)
        setIsFullscreen(true);
      }
    } catch (err) {
      console.warn('Fullscreen request bypassed or denied:', err);
      // Ensure candidate can always continue on mobile or restricted browser
      setIsFullscreen(true);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (typeof document !== 'undefined' && document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
      setIsFullscreen(false);
    } catch (err) {
      console.warn('Exit fullscreen error:', err);
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      // On mobile devices, address bar and keyboard shifts trigger fullscreenchange; ignore on mobile
      if (isMobileRef.current) {
        setIsFullscreen(true);
        return;
      }

      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      if (!active && onExitFullscreen) {
        onExitFullscreen();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [onExitFullscreen]);

  return { isFullscreen, requestFullscreen, exitFullscreen, isMobile, setIsFullscreen };
}
