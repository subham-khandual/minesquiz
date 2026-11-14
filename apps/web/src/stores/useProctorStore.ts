import { create } from 'zustand';
import { ProctorViolationType } from '@mines-quiz/types';

interface ProctorState {
  isCameraActive: boolean;
  violationsCount: number;
  maxAllowedViolations: number;
  faceAbsenceCount: number;
  maxAllowedFaceAbsences: number;
  activeAlert: string | null;
  activeAlertSeverity?: 'critical' | 'warning' | 'info';
  recentViolations: { type: ProctorViolationType; message: string; timestamp: string }[];
  isTerminated: boolean;

  setCameraActive: (active: boolean) => void;
  setMaxAllowedViolations: (max: number) => void;
  reportViolation: (type: ProctorViolationType, message: string) => void;
  reportWarning: (type: ProctorViolationType, message: string) => void;
  reportFaceAbsence: (message?: string) => void;
  clearActiveAlert: () => void;
  resetProctor: () => void;
}

export const useProctorStore = create<ProctorState>((set, get) => ({
  isCameraActive: false,
  violationsCount: 0,
  maxAllowedViolations: 10,
  faceAbsenceCount: 0,
  maxAllowedFaceAbsences: 5,
  activeAlert: null,
  activeAlertSeverity: undefined,
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
      activeAlertSeverity: 'critical',
      isTerminated,
      recentViolations: [
        { type, message, timestamp: new Date().toLocaleTimeString() },
        ...recentViolations.slice(0, 9),
      ],
    });
  },

  reportWarning: (type, message) => {
    const { recentViolations } = get();
    set({
      activeAlert: message,
      activeAlertSeverity: 'warning',
      recentViolations: [
        { type, message, timestamp: new Date().toLocaleTimeString() },
        ...recentViolations.slice(0, 9),
      ],
    });
  },

  reportFaceAbsence: (message) => {
    const { faceAbsenceCount, maxAllowedFaceAbsences, recentViolations } = get();
    const newAbsenceCount = faceAbsenceCount + 1;
    const isTerminated = newAbsenceCount > maxAllowedFaceAbsences;

    const alertMessage = isTerminated
      ? `Examination terminated: Face not visible in camera feed (${maxAllowedFaceAbsences} chances exceeded).`
      : (message || `Notice: Face not clearly centered. Please face your camera (${newAbsenceCount} of ${maxAllowedFaceAbsences}).`);

    set({
      faceAbsenceCount: newAbsenceCount,
      activeAlert: alertMessage,
      activeAlertSeverity: isTerminated ? 'critical' : 'warning',
      isTerminated,
      recentViolations: [
        { type: 'no_face', message: alertMessage, timestamp: new Date().toLocaleTimeString() },
        ...recentViolations.slice(0, 9),
      ],
    });
  },

  clearActiveAlert: () => set({ activeAlert: null, activeAlertSeverity: undefined }),

  resetProctor: () =>
    set({
      isCameraActive: false,
      violationsCount: 0,
      faceAbsenceCount: 0,
      activeAlert: null,
      activeAlertSeverity: undefined,
      recentViolations: [],
      isTerminated: false,
    }),
}));
