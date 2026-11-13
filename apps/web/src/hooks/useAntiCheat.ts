'use client';

import { useEffect, useCallback } from 'react';
import { useProctorStore } from '../stores/useProctorStore';

interface AntiCheatOptions {
  enabled: boolean;
  onViolation?: (type: string, details: string) => void;
}

export function useAntiCheat({ enabled, onViolation }: AntiCheatOptions) {
  const { reportViolation } = useProctorStore();

  const handleViolation = useCallback(
    (type: string, details: string) => {
      reportViolation('suspicious_movement', `${type}: ${details}`);
      if (onViolation) {
        onViolation(type, details);
      }
    },
    [reportViolation, onViolation]
  );

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // 1. Block right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      handleViolation('Context Menu Blocked', 'Right-click action was blocked.');
      return false;
    };

    // 2. Block clipboard copy, cut, and paste
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      handleViolation('Clipboard Action Blocked', 'Copying exam content is forbidden.');
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      handleViolation('Clipboard Action Blocked', 'Cut action is forbidden.');
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      handleViolation('Clipboard Action Blocked', 'Pasting into the exam is forbidden.');
    };

    // 3. Block devtools, inspect element, print, and view source shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 key (DevTools)
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        handleViolation('DevTools Attempt', 'Opening browser DevTools is strictly prohibited.');
        return false;
      }

      // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C (Inspect Element)
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        handleViolation('Inspect Element Attempt', 'Inspecting page source is blocked.');
        return false;
      }

      // Ctrl+U (View Source)
      if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
        handleViolation('View Source Attempt', 'Viewing source code is blocked.');
        return false;
      }

      // Ctrl+P (Print Page / Screen Capture)
      if (e.ctrlKey && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault();
        handleViolation('Print Attempt', 'Printing or screen saving is blocked.');
        return false;
      }

      // Ctrl+S (Save Page)
      if (e.ctrlKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        return false;
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('copy', handleCopy);
    window.addEventListener('cut', handleCut);
    window.addEventListener('paste', handlePaste);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('copy', handleCopy);
      window.removeEventListener('cut', handleCut);
      window.removeEventListener('paste', handlePaste);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleViolation]);
}
