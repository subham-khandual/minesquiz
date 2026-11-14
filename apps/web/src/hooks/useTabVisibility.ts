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
      // Only count blur if the page is actually hidden/backgrounded
      // On mobile devices, window.blur fires during touch gestures, virtual keyboards, and permission prompts
      if (document.hidden) {
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
