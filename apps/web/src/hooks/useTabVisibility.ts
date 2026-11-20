import { useEffect, useRef } from 'react';

export function useTabVisibility(onTabSwitch: () => void) {
  const switchCountRef = useRef(0);
  const initialGraceUntilRef = useRef(0);
  const lastSwitchTimeRef = useRef(0);

  useEffect(() => {
    // 10-second initial warmup grace buffer for camera permissions and fullscreen setup
    initialGraceUntilRef.current = Date.now() + 10000;

    const triggerSwitch = () => {
      const now = Date.now();
      // Ignore all focus and visibility events during initial 10s startup grace window
      if (now < initialGraceUntilRef.current) {
        return;
      }
      // Debounce rapid events within 2 seconds
      if (now - lastSwitchTimeRef.current < 2000) {
        return;
      }
      lastSwitchTimeRef.current = now;
      switchCountRef.current += 1;
      onTabSwitch();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerSwitch();
      }
    };

    const handleWindowBlur = () => {
      // Require document.hidden so permission popups or momentary focus shifts do not false-trigger
      if (document.hidden) {
        triggerSwitch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [onTabSwitch]);

  return { switchCount: switchCountRef.current };
}
