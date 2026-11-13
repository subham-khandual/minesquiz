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
      // Window lost focus (user clicked outside or switched apps)
      switchCountRef.current += 1;
      onTabSwitch();
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

