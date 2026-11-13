'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

declare global {
  interface Window {
    __activeLenis?: any;
    __lenisTicker?: any;
  }
}

export const SmoothScrollProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const lenisRef = useRef<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    let isCancelled = false;

    // Do not initialize Lenis on application portals, admin dashboards, or exam rooms
    // Native mobile/desktop scrolling is essential for interactive form/table workflows
    const isAppWorkspace =
      pathname?.startsWith('/candidate') ||
      pathname?.startsWith('/admin') ||
      pathname?.startsWith('/exam') ||
      pathname?.startsWith('/results');

    if (isAppWorkspace) {
      if (window.__activeLenis) {
        try {
          window.__activeLenis.destroy();
        } catch (_) {}
        window.__activeLenis = undefined;
      }
      return;
    }

    async function initSmoothScroll() {
      try {
        if (typeof window === 'undefined') return;

        // Clean up any stale Lenis instances from previous hot-reloads
        if (window.__activeLenis) {
          try {
            window.__activeLenis.destroy();
          } catch (_) {}
          window.__activeLenis = undefined;
        }

        const lenisModule = await import('lenis');
        const Lenis = lenisModule.default || lenisModule;
        const gsapModule = await import('gsap');
        const gsap = gsapModule.default || gsapModule;
        const stModule = await import('gsap/ScrollTrigger');
        const ScrollTrigger = stModule.ScrollTrigger || stModule.default || stModule;

        if (isCancelled) return;

        if (gsap && typeof gsap.registerPlugin === 'function' && ScrollTrigger) {
          gsap.registerPlugin(ScrollTrigger);
        }

        // Remove old ticker if any
        if (window.__lenisTicker) {
          try {
            if (gsap?.ticker?.remove) {
              gsap.ticker.remove(window.__lenisTicker);
            }
          } catch (_) {}
          window.__lenisTicker = undefined;
        }

        if (typeof Lenis !== 'function') {
          return;
        }

        const lenis = new Lenis({
          duration: 1.2,
          smoothWheel: true,
        });

        if (isCancelled) {
          lenis.destroy();
          return;
        }

        lenisRef.current = lenis;
        window.__activeLenis = lenis;

        lenis.on('scroll', ScrollTrigger.update);

        const updateTicker = (time: number) => {
          if (lenis) {
            lenis.raf(time * 1000);
          }
        };

        window.__lenisTicker = updateTicker;
        gsap.ticker.add(updateTicker);
        gsap.ticker.lagSmoothing(0);
      } catch (err) {
        // Silently fallback to native browser smooth scroll if library fails
        console.warn('[SmoothScroll] Falling back to native scrolling');
      }
    }

    initSmoothScroll();

    return () => {
      isCancelled = true;
      if (lenisRef.current) {
        try {
          lenisRef.current.destroy();
        } catch (_) {}
        lenisRef.current = null;
      }
      if (typeof window !== 'undefined') {
        if (window.__activeLenis) {
          try {
            window.__activeLenis.destroy();
          } catch (_) {}
          window.__activeLenis = undefined;
        }
        if (window.__lenisTicker) {
          import('gsap').then((m) => {
            const g = m.default || m;
            try {
              if (g?.ticker?.remove) {
                g.ticker.remove(window.__lenisTicker);
              }
            } catch (_) {}
            window.__lenisTicker = undefined;
          }).catch(() => {});
        }
      }
    };
  }, [pathname]);

  return <>{children}</>;
};
