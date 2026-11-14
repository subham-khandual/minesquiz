import { useEffect, useState, useCallback } from 'react';

export function useFullscreen(onExitFullscreen?: () => void) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const detectedMobile = mobileRegex.test(navigator.userAgent) || (window.innerWidth <= 768);
      setIsMobile(detectedMobile);

      // On mobile devices where Fullscreen API is not supported (e.g. iOS Safari),
      // auto-grant initial readiness so candidate is not trapped in fullscreen loop
      if (detectedMobile && !document.documentElement.requestFullscreen) {
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
