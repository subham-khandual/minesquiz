import { create } from 'zustand';
import { ProctorViolationType } from '@mines-quiz/types';

interface ProctorState {
  isCameraActive: boolean;
  violationsCount: number;
  maxAllowedViolations: number;
  activeAlert: string | null;
  recentViolations: { type: ProctorViolationType; message: string; timestamp: string }[];
  isTerminated: boolean;

  setCameraActive: (active: boolean) => void;
  setMaxAllowedViolations: (max: number) => void;
  reportViolation: (type: ProctorViolationType, message: string) => void;
  clearActiveAlert: () => void;
  resetProctor: () => void;
}

export const useProctorStore = create<ProctorState>((set, get) => ({
  isCameraActive: false,
  violationsCount: 0,
  maxAllowedViolations: 5,
  activeAlert: null,
  recentViolations: [],
  isTerminated: false,

  setCameraActive: (active) => set({ isCameraActive: active }),
  setMaxAllowedViolations: (max) => set({ maxAllowedViolations: max }),

  reportViolation: (type, message) => {
    const { violationsCount, maxAllowedViolations, recentViolations } = get();
    const newCount = violationsCount + 1;
    const isTerminated = newCount >= maxAllowedViolations;

    set({
      violationsCount: newCount,
      activeAlert: message,
      isTerminated,
      recentViolations: [
        { type, message, timestamp: new Date().toLocaleTimeString() },
        ...recentViolations.slice(0, 9),
      ],
    });
  },

  clearActiveAlert: () => set({ activeAlert: null }),

  resetProctor: () =>
    set({
      isCameraActive: false,
      violationsCount: 0,
      activeAlert: null,
      recentViolations: [],
      isTerminated: false,
    }),
}));

