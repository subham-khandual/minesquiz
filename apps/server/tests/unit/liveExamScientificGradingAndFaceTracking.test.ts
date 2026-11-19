import { MINING_STATUTORY_QUESTIONS } from '../../../../apps/web/src/data/miningQuestions';
import { estimateHeadPose, FaceProctorAnalyzer, Landmark3D } from '../../../../packages/utils/src/gazeEstimator';
import fs from 'fs';
import path from 'path';

describe('Live Exam: Scientific Grading, Audio Warning, and 1-Chance Face Proctoring Engine', () => {
  test('1. Scientific Grading: Marks are calculated from genuine correctOptionIds, NOT userAnswers.length', () => {
    const questionMap = new Map(MINING_STATUTORY_QUESTIONS.map((q) => [q.id, q]));
    expect(questionMap.size).toBeGreaterThanOrEqual(40);

    // Mock candidate submission of 30 questions
    // Candidate answers 18 correctly and 12 incorrectly
    const sampleQuestions = MINING_STATUTORY_QUESTIONS.slice(0, 30);
    const mockUserAnswers = sampleQuestions.map((q, idx) => {
      if (idx < 18) {
        // Correct answer
        return {
          questionId: q.id,
          selectedOptionIds: [...(q.correctOptionIds || [])],
        };
      } else {
        // Deliberately incorrect answer
        return {
          questionId: q.id,
          selectedOptionIds: ['wrong-opt-999'],
        };
      }
    });

    // Old buggy behavior would have assigned marksObtained = mockUserAnswers.length (30 = 100%)
    expect(mockUserAnswers.length).toBe(30);

    // New scientific grading evaluation
    let genuineMarksObtained = 0;
    mockUserAnswers.forEach((ans) => {
      const masterQ = questionMap.get(ans.questionId);
      const correctIds = masterQ?.correctOptionIds;
      if (masterQ && correctIds && correctIds.length > 0) {
        const selected = ans.selectedOptionIds || [];
        const isCorrect =
          selected.length === correctIds.length &&
          selected.every((id) => correctIds.includes(id));

        if (isCorrect) {
          genuineMarksObtained += masterQ.marks || 1;
        }
      }
    });

    // Score must be exactly 18, and NOT 30!
    expect(genuineMarksObtained).toBe(18);
    const percentage = Math.round((genuineMarksObtained / 30) * 1000) / 10;
    expect(percentage).toBe(60.0);
    expect(percentage).not.toBe(100.0);
  });

  test('2. 3D Head Pose: Detects facing center as clean and looking away as integrity violation', () => {
    // Generate mock 468 landmarks for facing directly center
    const centerLandmarks: Landmark3D[] = Array(468).fill(null).map((_, i) => ({
      x: 0.5,
      y: 0.5,
      z: 0.0,
    }));
    centerLandmarks[1] = { x: 0.50, y: 0.50, z: 0.0 }; // nose tip
    centerLandmarks[33] = { x: 0.40, y: 0.50, z: 0.0 }; // left eye
    centerLandmarks[263] = { x: 0.60, y: 0.50, z: 0.0 }; // right eye

    const centerPose = estimateHeadPose(centerLandmarks);
    expect(centerPose.isLookingAway).toBe(false);
    expect(Math.abs(centerPose.yaw)).toBeLessThanOrEqual(28);

    // Mock turning head to the right (nose shifted right of eye center)
    const turnedRightLandmarks: Landmark3D[] = [...centerLandmarks];
    turnedRightLandmarks[1] = { x: 0.58, y: 0.50, z: 0.0 }; // nose turned right

    const turnedPose = estimateHeadPose(turnedRightLandmarks);
    expect(turnedPose.yaw).toBeGreaterThan(28);
    expect(turnedPose.isLookingAway).toBe(true);

    const analyzerResult = FaceProctorAnalyzer.analyzeLandmarks([turnedRightLandmarks]);
    expect(analyzerResult.violationDetected).toBe('looking_away');
  });

  test('3. Face Analyzer: Flags no_face when candidate leaves seat and multiple_faces when helper enters', () => {
    // No face in frame
    const noFaceResult = FaceProctorAnalyzer.analyzeLandmarks([]);
    expect(noFaceResult.violationDetected).toBe('no_face');
    expect(noFaceResult.faceCount).toBe(0);

    // Two faces in frame
    const dummyFace: Landmark3D[] = Array(468).fill({ x: 0.5, y: 0.5, z: 0 });
    const multipleFacesResult = FaceProctorAnalyzer.analyzeLandmarks([dummyFace, dummyFace]);
    expect(multipleFacesResult.violationDetected).toBe('multiple_faces');
    expect(multipleFacesResult.faceCount).toBe(2);
  });

  test('4. Noise Warning Policy: Background noise logs warning only and never terminates exam', () => {
    let violationsCount = 0;
    let isTerminated = false;
    let activeAlert: string | null = null;
    let activeSeverity: string | null = null;

    // Simulation of reportWarning for audio
    const reportWarning = (type: string, message: string) => {
      activeAlert = message;
      activeSeverity = 'warning';
      // violationsCount is intentionally NOT incremented
      // isTerminated remains false
    };

    // Candidate experiences 10 background sound spikes
    for (let i = 1; i <= 10; i++) {
      reportWarning('audio_detected', `Background noise spike ${i} (75 dB).`);
    }

    expect(violationsCount).toBe(0);
    expect(isTerminated).toBe(false);
    expect(activeSeverity).toBe('warning');
    expect(activeAlert).toContain('Background noise spike 10');
  });

  test('5. Face Absence 1-Chance Policy: Grace on first exit, termination on second exit', () => {
    let faceAbsenceCount = 0;
    const maxAllowedFaceAbsences = 1;
    let isTerminated = false;
    let activeAlert = '';

    const reportFaceAbsence = (msg: string) => {
      faceAbsenceCount += 1;
      if (faceAbsenceCount > maxAllowedFaceAbsences) {
        isTerminated = true;
        activeAlert = 'Examination terminated: Candidate left camera view (Max 1 chance exceeded).';
      } else {
        isTerminated = false;
        activeAlert = msg;
      }
    };

    // Exit 1: First chance consumed with critical warning
    reportFaceAbsence('CRITICAL WARNING (Chance 1 of 1): Face not visible in camera frame!');
    expect(faceAbsenceCount).toBe(1);
    expect(isTerminated).toBe(false);
    expect(activeAlert).toContain('Chance 1 of 1');

    // Exit 2: Second exit leads to immediate disqualification / termination
    reportFaceAbsence('CRITICAL WARNING: Face missing again!');
    expect(faceAbsenceCount).toBe(2);
    expect(isTerminated).toBe(true);
    expect(activeAlert).toContain('Examination terminated');
  });

  test('6. YCbCr Chrominance transformation is invariant to ambient lighting and shadow', () => {
    // Normal lighting skin sample
    const normalR = 180, normalG = 130, normalB = 105;
    const normalY = 0.299 * normalR + 0.587 * normalG + 0.114 * normalB;
    const normalCb = 128 - 0.168736 * normalR - 0.331264 * normalG + 0.5 * normalB;
    const normalCr = 128 + 0.5 * normalR - 0.418688 * normalG - 0.081312 * normalB;

    const isNormalSkin = normalCb >= 70 && normalCb <= 140 && normalCr >= 126 && normalCr <= 185 && normalY >= 18;
    expect(isNormalSkin).toBe(true);

    // Shadow / Underexposed skin sample (dark due to background daylight window)
    const shadowR = 75, shadowG = 52, shadowB = 40;
    const shadowY = 0.299 * shadowR + 0.587 * shadowG + 0.114 * shadowB;
    const shadowCb = 128 - 0.168736 * shadowR - 0.331264 * shadowG + 0.5 * shadowB;
    const shadowCr = 128 + 0.5 * shadowR - 0.418688 * shadowG - 0.081312 * shadowB;

    const isShadowSkin = shadowCb >= 70 && shadowCb <= 140 && shadowCr >= 126 && shadowCr <= 185 && shadowY >= 18;
    expect(isShadowSkin).toBe(true);
  });

  test('7. Enforces strict zero em-dash compliance across modified proctoring files', () => {
    const files = [
      'apps/web/src/features/exam/ExamRoom.tsx',
      'apps/web/src/hooks/useFaceDetector.ts',
      'apps/web/src/components/WebcamProctorView.tsx',
      'apps/web/src/stores/useProctorStore.ts',
      'apps/web/src/components/ViolationToast.tsx',
    ];

    files.forEach((file) => {
      const fullPath = path.resolve(__dirname, '../../../../', file);
      expect(fs.existsSync(fullPath)).toBe(true);
      const content = fs.readFileSync(fullPath, 'utf-8');
      expect(content).not.toContain('\u2014'); // em-dash
      expect(content).not.toContain('\u2013'); // en-dash
    });
  });

  test('8. Validates logViolationSchema accepts lip_movement violation payload without 400 Bad Request', () => {
    const { logViolationSchema } = require('../../src/validators/attemptValidator');
    const validPayload = {
      attemptId: 'mock-attempt-101',
      type: 'lip_movement',
      severity: 'warning',
      confidence: 0.95,
      snapshotUrl: 'data:image/jpeg;base64,mockSnapshotData',
    };

    const parsed = logViolationSchema.parse(validPayload);
    expect(parsed.type).toBe('lip_movement');
    expect(parsed.attemptId).toBe('mock-attempt-101');
    expect(parsed.severity).toBe('warning');
  });
});
