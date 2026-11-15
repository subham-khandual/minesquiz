import { useEffect, useRef } from 'react';

export function useTabVisibility(onTabSwitch: () => void) {
  const switchCountRef = useRef(0);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        switchCountRef.current += 1;
        onTabSwitch();
      }
    };

    const handleWindowBlur = () => {
      const isMobile =
        typeof window !== 'undefined' &&
        (window.innerWidth <= 768 ||
          'ontouchstart' in window ||
          (navigator.maxTouchPoints && navigator.maxTouchPoints > 0));

      if (isMobile) {
        // On mobile devices, only count blur if the page is actually hidden or backgrounded
        if (document.hidden) {
          switchCountRef.current += 1;
          onTabSwitch();
        }
      } else {
        // On desktop, window blur indicates candidate switched focus outside the active exam window
        switchCountRef.current += 1;
        onTabSwitch();
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
