import { create } from 'zustand';
import { ProctorViolationType } from '@mines-quiz/types';

interface ProctorState {
  isCameraActive: boolean;
  violationsCount: number;
  maxAllowedViolations: number;
  faceAbsenceCount: number;
  maxAllowedFaceAbsences: number;
  lipMovementCount: number;
  maxAllowedLipMovements: number;
  activeAlert: string | null;
  activeAlertSeverity?: 'critical' | 'warning' | 'info';
  recentViolations: { type: ProctorViolationType; message: string; timestamp: string }[];
  isTerminated: boolean;

  setCameraActive: (active: boolean) => void;
  setMaxAllowedViolations: (max: number) => void;
  reportViolation: (type: ProctorViolationType, message: string) => void;
  reportWarning: (type: ProctorViolationType, message: string) => void;
  reportFaceAbsence: (message?: string) => void;
  reportLipMovement: (message?: string) => void;
  terminateImmediately: (reason: string, type?: ProctorViolationType) => void;
  clearActiveAlert: () => void;
  resetProctor: () => void;
}

export const useProctorStore = create<ProctorState>((set, get) => ({
  isCameraActive: false,
  violationsCount: 0,
  maxAllowedViolations: 10,
  faceAbsenceCount: 0,
  maxAllowedFaceAbsences: 1,
  lipMovementCount: 0,
  maxAllowedLipMovements: 1,
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
    const { faceAbsenceCount, recentViolations } = get();
    const newAbsenceCount = faceAbsenceCount + 1;
    const isTerminated = newAbsenceCount > 1;

    const alertMessage = isTerminated
      ? 'Disqualification: Face missing from camera (Strike 2 of 2). Examination terminated.'
      : (message || 'Warning: Face missing from camera (Strike 1 of 2). Please keep your face centered towards the camera.');

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

  reportLipMovement: (message) => {
    const { lipMovementCount, recentViolations } = get();
    const newCount = lipMovementCount + 1;
    const isTerminated = newCount > 1;

    const alertMessage = isTerminated
      ? 'Disqualification: Second instance of mouth / lip movement or whispering detected (Strike 2 of 2). Examination terminated.'
      : (message || 'Warning: Continuous mouth / lip movement or whispering detected (Strike 1 of 2). Speaking or whispering is strictly prohibited.');

    set({
      lipMovementCount: newCount,
      activeAlert: alertMessage,
      activeAlertSeverity: isTerminated ? 'critical' : 'warning',
      isTerminated,
      recentViolations: [
        { type: 'lip_movement', message: alertMessage, timestamp: new Date().toLocaleTimeString() },
        ...recentViolations.slice(0, 9),
      ],
    });
  },

  terminateImmediately: (reason, type = 'multiple_faces') => {
    const { recentViolations, lipMovementCount } = get();
    set({
      isTerminated: true,
      activeAlert: reason,
      activeAlertSeverity: 'critical',
      lipMovementCount: type === 'lip_movement' ? Math.max(lipMovementCount, 2) : lipMovementCount,
      recentViolations: [
        { type, message: reason, timestamp: new Date().toLocaleTimeString() },
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
      lipMovementCount: 0,
      activeAlert: null,
      activeAlertSeverity: undefined,
      recentViolations: [],
      isTerminated: false,
    }),
}));
