import { useEffect, useRef, useState, useCallback } from 'react';
import { ProctorViolationType } from '@mines-quiz/types';
import { apiClient } from '../lib/apiClient';
import { useProctorStore } from '../stores/useProctorStore';

interface UseFaceDetectorOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  attemptId?: string;
  enabled?: boolean;
  captureSnapshot: () => string | null;
}

export type PoseStatus = 'center' | 'left' | 'right' | 'down' | 'up' | 'no_face' | 'multiple';

export interface FaceBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function useFaceDetector({
  videoRef,
  attemptId,
  enabled = true,
  captureSnapshot,
}: UseFaceDetectorOptions) {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [facesDetected, setFacesDetected] = useState<number>(1);
  const [yaw, setYaw] = useState<number>(0);
  const [pitch, setPitch] = useState<number>(0);
  const [isLookingAway, setIsLookingAway] = useState<boolean>(false);
  const [poseStatus, setPoseStatus] = useState<PoseStatus>('center');
  const [isBaselineCalibrated, setIsBaselineCalibrated] = useState<boolean>(false);
  const [calibrationProgress, setCalibrationProgress] = useState<number>(0);
  const [faceBox, setFaceBox] = useState<FaceBoundingBox | null>({
    x: 0.2,
    y: 0.15,
    width: 0.6,
    height: 0.7,
  });

  const reportViolation = useProctorStore((s) => s.reportViolation);
  const reportWarning = useProctorStore((s) => s.reportWarning);
  const reportFaceAbsence = useProctorStore((s) => s.reportFaceAbsence);
  const reportLipMovement = useProctorStore((s) => s.reportLipMovement);
  const terminateImmediately = useProctorStore((s) => s.terminateImmediately);
  const clearActiveAlert = useProctorStore((s) => s.clearActiveAlert);

  // Temporal debounce tracking to avoid false positives from natural eye blinks or camera blur
  const consecutiveLookingAwayRef = useRef(0);
  const consecutiveNoFaceRef = useRef(0);
  const consecutiveMultipleFacesRef = useRef(0);
  const lastViolationTimeRef = useRef(0);
  const lastFaceMovementViolationTimeRef = useRef(0);

  // Lip movement (lipsing) and whispering tracking
  const prevMouthDataRef = useRef<Uint8Array | null>(null);
  const lipMovementStrikeRef = useRef(0);
  const lipMovementScoreRef = useRef(0);
  const lastLipViolationTimeRef = useRef(0);

  // Candidate biometric baseline calibration for proxy / friend impersonation detection
  const baselineDescriptorRef = useRef<{
    aspectRatio: number;
    relativeArea: number;
    rRatio: number;
    bRatio: number;
    samplesCount: number;
    isCalibrated: boolean;
  }>({
    aspectRatio: 0,
    relativeArea: 0,
    rRatio: 0,
    bRatio: 0,
    samplesCount: 0,
    isCalibrated: false,
  });
  const consecutiveMismatchRef = useRef(0);
  const faceMismatchCountRef = useRef(0);
  const lookingAwayStrikeRef = useRef(0);
  const lookingAwayScoreRef = useRef(0);

  const handleImmediateDisqualification = useCallback(
    async (type: ProctorViolationType, reason: string) => {
      terminateImmediately(reason, type);
      if (attemptId) {
        try {
          const snapshotUrl = captureSnapshot() || undefined;
          await apiClient.post('/proctor/violation', {
            attemptId,
            type,
            severity: 'critical',
            confidence: 0.99,
            snapshotUrl,
          });
        } catch (err) {
          console.warn('[FaceDetector] Failed to log immediate disqualification:', err);
        }
      }
    },
    [attemptId, captureSnapshot, terminateImmediately]
  );

  const handleViolation = useCallback(
    async (type: ProctorViolationType, message: string, confidence = 0.95) => {
      // Enforce 5-second cooldown between consecutive strikes to allow candidate to recover pose
      const now = Date.now();
      if (now - lastViolationTimeRef.current < 5000) {
        return;
      }
      lastViolationTimeRef.current = now;

      reportViolation(type, message);

      if (attemptId) {
        try {
          const snapshotUrl = captureSnapshot() || undefined;
          await apiClient.post('/proctor/violation', {
            attemptId,
            type,
            severity: type === 'multiple_faces' ? 'critical' : 'warning',
            confidence,
            snapshotUrl,
          });
        } catch (err) {
          console.warn('[FaceDetector] Failed to log violation to server:', err);
        }
      }
    },
    [attemptId, captureSnapshot, reportViolation]
  );

  const handleFaceAbsence = useCallback(
    async (message: string) => {
      const now = Date.now();
      if (now - lastViolationTimeRef.current < 2000) {
        return;
      }
      lastViolationTimeRef.current = now;

      reportFaceAbsence(message);

      if (attemptId) {
        try {
          const snapshotUrl = captureSnapshot() || undefined;
          await apiClient.post('/proctor/violation', {
            attemptId,
            type: 'no_face',
            severity: 'critical',
            confidence: 0.99,
            snapshotUrl,
          });
        } catch (err) {
          console.warn('[FaceDetector] Failed to log face absence to server:', err);
        }
      }
    },
    [attemptId, captureSnapshot, reportFaceAbsence]
  );

  const handleLipMovement = useCallback(
    async (message: string) => {
      reportLipMovement(message);

      if (attemptId) {
        try {
          const snapshotUrl = captureSnapshot() || undefined;
          await apiClient.post('/proctor/violation', {
            attemptId,
            type: 'lip_movement',
            severity: 'warning',
            confidence: 0.95,
            snapshotUrl,
          });
        } catch (err) {
          console.warn('[FaceDetector] Failed to log lip movement violation:', err);
        }
      }
    },
    [attemptId, captureSnapshot, reportLipMovement]
  );

  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;
    setIsModelLoaded(true);

    // Initialize/reset strikes and scores on activation
    lipMovementStrikeRef.current = 0;
    lipMovementScoreRef.current = 0;
    lastLipViolationTimeRef.current = 0;
    prevMouthDataRef.current = null;
    lookingAwayStrikeRef.current = 0;

    // Off-screen canvas for high-speed frame processing (160x120 = 19,200 pixels)
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 120;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // Active inspection loop running every 400ms
    const interval = setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || !isMounted || !ctx) {
        return;
      }

      // ========================================================
      // LIP MOVEMENT (LIPSING) & WHISPERING MOTION FLUX ANALYZER
      // Option A: 2 Strikes Total (Strike 1 = Warning Toast, 6s Grace Cooldown, Strike 2 = Exam Disqualification)
      // ========================================================
      const checkLipMovement = (
        pixelData: Uint8ClampedArray,
        cWidth: number,
        cHeight: number,
        mX1: number,
        mY1: number,
        mX2: number,
        mY2: number
      ) => {
        const mouthW = mX2 - mX1;
        const mouthH = mY2 - mY1;

        if (mouthW < 8 || mouthH < 6) return;

        const currentMouthSnapshot = new Uint8Array(mouthW * mouthH * 2);
        let snapIdx = 0;
        let pixelCount = 0;

        for (let my = mY1; my < mY2; my++) {
          for (let mx = mX1; mx < mX2; mx++) {
            const pIdx = (my * cWidth + mx) * 4;
            const pr = pixelData[pIdx];
            const pg = pixelData[pIdx + 1];
            const pb = pixelData[pIdx + 2];
            const pY = Math.round(0.299 * pr + 0.587 * pg + 0.114 * pb);
            const pCr = Math.round(128 + 0.5 * pr - 0.418688 * pg - 0.081312 * pb);

            currentMouthSnapshot[snapIdx] = pY;
            currentMouthSnapshot[snapIdx + 1] = pCr;
            snapIdx += 2;
            pixelCount++;
          }
        }

        const prevMouthSnapshot = prevMouthDataRef.current;
        if (prevMouthSnapshot && prevMouthSnapshot.length === currentMouthSnapshot.length) {
          let mouthFluxSum = 0;
          for (let i = 0; i < currentMouthSnapshot.length; i += 2) {
            const deltaY = Math.abs(currentMouthSnapshot[i] - prevMouthSnapshot[i]);
            const deltaCr = Math.abs(currentMouthSnapshot[i + 1] - prevMouthSnapshot[i + 1]);
            mouthFluxSum += (deltaY + deltaCr);
          }

          const avgFlux = mouthFluxSum / (pixelCount || 1);

          // Resting mouth flux is < 3.8. Active lip movement or whispering produces flux >= 4.8
          if (avgFlux >= 4.8) {
            lipMovementScoreRef.current = Math.min(100, lipMovementScoreRef.current + 20);
            // Require at least 3 consecutive frames (~1.2s sustained movement) before strike
            if (lipMovementScoreRef.current >= 60) {
              lipMovementScoreRef.current = 0;
              const now = Date.now();

              if (lipMovementStrikeRef.current === 0) {
                // Strike 1: Warning Toast
                lipMovementStrikeRef.current = 1;
                lastLipViolationTimeRef.current = now;
                handleLipMovement(
                  'Warning: Continuous mouth / lip movement or whispering detected (Strike 1 of 2). Speaking or whispering is strictly prohibited.'
                );
              } else if (now - lastLipViolationTimeRef.current >= 6000) {
                // Strike 2: Disqualification and Exam Quit after mandatory 6s recovery cooldown
                lipMovementStrikeRef.current = 2;
                handleImmediateDisqualification(
                  'lip_movement',
                  'Disqualification: Repeated mouth / lip movement or whispering detected (Strike 2 of 2). Examination terminated.'
                );
              }
            }
          } else {
            lipMovementScoreRef.current = Math.max(0, lipMovementScoreRef.current - 10);
            // If candidate has stabilized mouth and stopped whispering after Strike 1 warning, auto-dismiss alert
            if (
              lipMovementStrikeRef.current === 1 &&
              Date.now() - lastLipViolationTimeRef.current > 4000
            ) {
              clearActiveAlert();
            }
          }
        }
        prevMouthDataRef.current = currentMouthSnapshot;
      };

      try {
        // ========================================================
        // TIER 1: Native Chromium FaceDetector (Hardware Accelerated)
        // ========================================================
        if (typeof window !== 'undefined' && 'FaceDetector' in window) {
          try {
            const detector = new (window as any).FaceDetector({
              maxDetectedFaces: 4,
              fastMode: true,
            });
            const faces = await detector.detect(video);

            if (faces && Array.isArray(faces)) {
              const detectedCount = faces.length;
              setFacesDetected(detectedCount);

              if (detectedCount === 0) {
                consecutiveNoFaceRef.current += 1;
                consecutiveLookingAwayRef.current = 0;
                consecutiveMultipleFacesRef.current = 0;
                consecutiveMismatchRef.current = 0;
                setPoseStatus('no_face');
                setIsLookingAway(true);
                setFaceBox(null);

                // 5 consecutive frames = ~2.0 seconds without face triggers strike
                if (consecutiveNoFaceRef.current >= 5) {
                  consecutiveNoFaceRef.current = 0;
                  handleFaceAbsence(
                    'Warning: Face missing from camera (Strike 1 of 2). Face must be visible at all times.'
                  );
                }
                return;
              }

              // Multiple faces detected: Immediate Disqualification (Zero Tolerance, One-Time Quit)
              if (detectedCount > 1) {
                consecutiveMultipleFacesRef.current += 1;
                consecutiveNoFaceRef.current = 0;
                consecutiveLookingAwayRef.current = 0;
                consecutiveMismatchRef.current = 0;
                setPoseStatus('multiple');
                setIsLookingAway(true);

                if (consecutiveMultipleFacesRef.current >= 2) {
                  handleImmediateDisqualification(
                    'multiple_faces',
                    'Disqualification: Multiple faces detected in camera frame (One-Time Disqualification). Examination terminated.'
                  );
                }
                return;
              }

              // Single Face: Calculate 3D Head Pose
              const primaryFace = faces[0];
              const box = primaryFace.boundingBox;
              const videoW = video.videoWidth || 640;
              const videoH = video.videoHeight || 480;

              // Normalized coordinates
              const normX = Math.max(0, Math.min(1, box.x / videoW));
              const normY = Math.max(0, Math.min(1, box.y / videoH));
              const normW = Math.max(0.1, Math.min(1, box.width / videoW));
              const normH = Math.max(0.1, Math.min(1, box.height / videoH));

              setFaceBox({
                x: normX,
                y: normY,
                width: normW,
                height: normH,
              });

              // Calculate horizontal and vertical deflection from center (0.50, 0.45)
              const centerX = normX + normW / 2;
              const centerY = normY + normH / 2;

              let calcYaw = Math.round((centerX - 0.5) * 110);
              let calcPitch = Math.round((centerY - 0.45) * 90);

              // Refine with eye and nose landmarks if provided by hardware
              if (primaryFace.landmarks && Array.isArray(primaryFace.landmarks)) {
                const eyeLandmark = primaryFace.landmarks.find((l: any) => l.type === 'eye');
                const noseLandmark = primaryFace.landmarks.find((l: any) => l.type === 'nose');
                if (eyeLandmark && noseLandmark) {
                  const eyeX = eyeLandmark.locations?.[0]?.x || box.x + box.width / 2;
                  const noseX = noseLandmark.locations?.[0]?.x || box.x + box.width / 2;
                  calcYaw = Math.round(((noseX - eyeX) / (box.width * 0.4 || 1)) * 45);
                }
              }

              setYaw(calcYaw);
              setPitch(calcPitch);

              // Spatial Face Movement Tracking: Checks if face centroid is significantly displacing away from safe screen zone
              // Wide generous safe zone (X: 0.22 to 0.78, Y: 0.14 to 0.86) permits natural reading without false triggers
              let currentStatus: PoseStatus = 'center';
              if (centerX < 0.22) currentStatus = 'left';
              else if (centerX > 0.78) currentStatus = 'right';
              else if (centerY > 0.86) currentStatus = 'down';
              else if (centerY < 0.14) currentStatus = 'up';

              setPoseStatus(currentStatus);

              const isFaceMovingAway = currentStatus !== 'center';
              setIsLookingAway(isFaceMovingAway);

              // ========================================================
              // Candidate Biometric Baseline Calibration & Impersonation Prevention
              // Prevents a friend or proxy test-taker from substituting during exam
              // ========================================================
              const activeAspect = normW / (normH || 0.01);
              const baseline = baselineDescriptorRef.current;

              const isValidFraming = normW >= 0.15 && normH >= 0.18 && normW <= 0.85 && normH <= 0.85;

              if (!baseline.isCalibrated) {
                // Calibrate during first 8 centered samples (~3.2 seconds) with verified high-quality framing
                if (currentStatus === 'center' && isValidFraming) {
                  baseline.aspectRatio =
                    (baseline.aspectRatio * baseline.samplesCount + activeAspect) /
                    (baseline.samplesCount + 1);
                  baseline.samplesCount += 1;
                  setCalibrationProgress(baseline.samplesCount);
                  if (baseline.samplesCount >= 8) {
                    baseline.isCalibrated = true;
                    setIsBaselineCalibrated(true);
                  }
                }
              } else if (currentStatus === 'center') {
                // Continuous comparison against candidate baseline
                const aspectDeviation =
                  Math.abs(activeAspect - baseline.aspectRatio) /
                  (baseline.aspectRatio || 1);

                // Sustained 35%+ deviation indicates different facial geometry (different person)
                if (aspectDeviation > 0.35) {
                  consecutiveMismatchRef.current += 1;
                  if (consecutiveMismatchRef.current >= 8) {
                    consecutiveMismatchRef.current = 0;
                    faceMismatchCountRef.current += 1;

                    if (faceMismatchCountRef.current === 1) {
                      reportWarning(
                        'looking_away',
                        'Warning: Candidate face mismatch detected (Strike 1 of 2). Only the registered candidate can sit for this exam.'
                      );
                    } else {
                      handleImmediateDisqualification(
                        'multiple_faces',
                        'Disqualification: Unrecognized face / candidate impersonation detected (Strike 2 of 2). Examination terminated.'
                      );
                    }
                  }
                } else {
                  consecutiveMismatchRef.current = 0;
                }
              }

              if (isFaceMovingAway) {
                consecutiveLookingAwayRef.current += 1;
                consecutiveNoFaceRef.current = 0;
                consecutiveMultipleFacesRef.current = 0;
                prevMouthDataRef.current = null;
                lipMovementScoreRef.current = 0;

                // Require at least 4 consecutive frames (~1.6s sustained face displacement) before strike
                if (consecutiveLookingAwayRef.current >= 4) {
                  consecutiveLookingAwayRef.current = 0;
                  const now = Date.now();

                  if (lookingAwayStrikeRef.current === 0) {
                    // Strike 1: First Warning
                    lookingAwayStrikeRef.current = 1;
                    lastFaceMovementViolationTimeRef.current = now;
                    reportWarning(
                      'looking_away',
                      'Warning: Face movement detected (Strike 1 of 2). Please keep your face still and focused on the screen. Next violation will terminate your exam!'
                    );
                  } else if (now - lastFaceMovementViolationTimeRef.current >= 6000) {
                    // Strike 2: Next time Exam Quit (Disqualification after 6s recovery cooldown)
                    handleImmediateDisqualification(
                      'looking_away',
                      'Disqualification: Repeated face movement detected (Strike 2 of 2). Examination terminated.'
                    );
                  }
                }
              } else {
                consecutiveLookingAwayRef.current = 0;
                consecutiveNoFaceRef.current = 0;
                consecutiveMultipleFacesRef.current = 0;

                // If candidate has stabilized face at center after Strike 1 warning, clear active alert
                if (
                  lookingAwayStrikeRef.current === 1 &&
                  Date.now() - lastFaceMovementViolationTimeRef.current > 4000
                ) {
                  clearActiveAlert();
                }

                // Lip movement (lipsing) & whispering detection in Tier 1
                if (currentStatus === 'center' && normW >= 0.15 && normH >= 0.18) {
                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                  const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                  const mY1 = Math.max(0, Math.floor((normY + normH * 0.62) * canvas.height));
                  const mY2 = Math.min(canvas.height, Math.floor((normY + normH * 0.88) * canvas.height));
                  const mX1 = Math.max(0, Math.floor((normX + normW * 0.28) * canvas.width));
                  const mX2 = Math.min(canvas.width, Math.floor((normX + normW * 0.72) * canvas.width));
                  checkLipMovement(frameData.data, canvas.width, canvas.height, mX1, mY1, mX2, mY2);
                }
              }

              return;
            }
          } catch (nativeErr) {
            // Native failed, fallback to computer vision
          }
        }

        // ========================================================
        // TIER 2: Luminance-Invariant YCbCr Chrominance Computer Vision
        // Robust against strong background light, glare, low-light and webcam blur
        // ========================================================
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = frameData.data;

        let totalSkinPixels = 0;
        let sumX = 0;
        let sumY = 0;
        let minX = canvas.width;
        let maxX = 0;
        let minY = canvas.height;
        let maxY = 0;
        let leftSkinCount = 0;
        let rightSkinCount = 0;

        const midWidth = canvas.width / 2;
        const colSkin = new Int16Array(canvas.width);

        for (let y = 0; y < canvas.height; y += 2) {
          for (let x = 0; x < canvas.width; x += 2) {
            const index = (y * canvas.width + x) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];

            // Fast YCbCr Chrominance calculation (independent of ambient luminance)
            const yVal = 0.299 * r + 0.587 * g + 0.114 * b;
            const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
            const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

            // Skin locus in chrominance space (tolerant to backlighting, shadow, and glare)
            const isSkin =
              (cb >= 70 && cb <= 140 && cr >= 126 && cr <= 185 && yVal >= 18) ||
              (r > 70 && g > 35 && b > 20 && r > b && (r - g) > 8);

            if (isSkin) {
              totalSkinPixels += 1;
              colSkin[x] += 1;
              sumX += x;
              sumY += y;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;

              if (x < midWidth) {
                leftSkinCount += 1;
              } else {
                rightSkinCount += 1;
              }
            }
          }
        }

        const rawHeadW = maxX > minX ? maxX - minX : 0;
        const rawHeadH = maxY > minY ? maxY - minY : 0;

        // Check if genuine candidate face is present:
        // In 160x120 canvas, an adult face in front of a laptop webcam occupies at least 220 skin pixels
        // Stray neck, hand, or warm background objects (< 220 pixels or < 18px width) flag face absence
        if (totalSkinPixels < 220 || rawHeadW < 18 || rawHeadH < 22) {
          consecutiveNoFaceRef.current += 1;
          consecutiveLookingAwayRef.current = 0;
          consecutiveMultipleFacesRef.current = 0;
          consecutiveMismatchRef.current = 0;
          prevMouthDataRef.current = null;
          lipMovementScoreRef.current = 0;
          setFacesDetected(0);
          setPoseStatus('no_face');
          setIsLookingAway(true);
          setFaceBox(null);

          // 4 frames = ~1.6 seconds without face before strike
          if (consecutiveNoFaceRef.current >= 4) {
            consecutiveNoFaceRef.current = 0;
            handleFaceAbsence(
              'No candidate face detected in video stream (Strike 1 of 2). Return to camera view immediately.'
            );
          }
          return;
        }

        // ========================================================
        // MULTI-FACE DETECTION: Column Projection Histogram Clustering
        // Detects when multiple persons or separated face clusters appear in camera frame
        // ========================================================
        const clusters: { startX: number; endX: number; peak: number; sum: number; centroidX: number }[] = [];
        let inCluster = false;
        let curCluster = { startX: 0, peak: 0, sum: 0, sumX: 0 };

        for (let x = 0; x < canvas.width; x += 2) {
          const count = colSkin[x];
          if (count >= 3) {
            if (!inCluster) {
              inCluster = true;
              curCluster = { startX: x, peak: count, sum: count, sumX: x * count };
            } else {
              curCluster.sum += count;
              curCluster.sumX += x * count;
              if (count > curCluster.peak) curCluster.peak = count;
            }
          } else if (inCluster) {
            inCluster = false;
            const cWidth = (x - 2) - curCluster.startX + 2;
            if (cWidth >= 10 && curCluster.sum >= 40) {
              clusters.push({
                startX: curCluster.startX,
                endX: x - 2,
                peak: curCluster.peak,
                sum: curCluster.sum,
                centroidX: curCluster.sumX / (curCluster.sum || 1),
              });
            }
          }
        }
        if (inCluster) {
          const cWidth = canvas.width - curCluster.startX;
          if (cWidth >= 10 && curCluster.sum >= 40) {
            clusters.push({
              startX: curCluster.startX,
              endX: canvas.width - 1,
              peak: curCluster.peak,
              sum: curCluster.sum,
              centroidX: curCluster.sumX / (curCluster.sum || 1),
            });
          }
        }

        const normW = Math.max(0.15, Math.min(0.95, (maxX - minX) / canvas.width));
        const normH = Math.max(0.15, Math.min(0.95, (maxY - minY) / canvas.height));
        const normX = Math.max(0.02, Math.min(0.85, minX / canvas.width));
        const normY = Math.max(0.02, Math.min(0.85, minY / canvas.height));

        // Two distinct face peaks separated by valley OR abnormal horizontal span
        const hasTwoDistinctClusters =
          clusters.length >= 2 &&
          clusters[0].sum >= 40 &&
          clusters[1].sum >= 40 &&
          Math.abs(clusters[0].centroidX - clusters[1].centroidX) >= 20;

        const hasMultiPersonSpan = normW > 0.52 && (normW / (normH || 1)) > 1.25 && totalSkinPixels > 450;

        if (hasTwoDistinctClusters || hasMultiPersonSpan) {
          setFacesDetected(2);
          setPoseStatus('multiple');
          setIsLookingAway(true);
          setFaceBox({
            x: normX,
            y: normY,
            width: normW,
            height: normH,
          });
          consecutiveMultipleFacesRef.current += 1;
          consecutiveNoFaceRef.current = 0;
          consecutiveLookingAwayRef.current = 0;
          consecutiveMismatchRef.current = 0;

          // 2 consecutive frames = ~800ms immediate disqualification (Zero Tolerance, One-Time Quit)
          if (consecutiveMultipleFacesRef.current >= 2) {
            handleImmediateDisqualification(
              'multiple_faces',
              'Disqualification: Multiple faces detected in camera frame (One-Time Disqualification). Examination terminated.'
            );
          }
          return;
        }

        // Single Face confirmed: reset multi-face tracker and absence counter
        setFacesDetected(1);
        consecutiveMultipleFacesRef.current = 0;
        consecutiveNoFaceRef.current = 0;

        const centroidX = sumX / totalSkinPixels;
        const centroidY = sumY / totalSkinPixels;
        const normCentroidX = centroidX / canvas.width;
        const normCentroidY = centroidY / canvas.height;
        const asymmetry = (leftSkinCount - rightSkinCount) / (totalSkinPixels || 1);

        setFaceBox({
          x: normX,
          y: normY,
          width: normW,
          height: normH,
        });

        // Head geometric dimensions
        const headWidth = Math.max(1, maxX - minX);
        const headHeight = Math.max(1, maxY - minY);
        const headCenterX = (minX + maxX) / 2;
        const headCenterY = (minY + maxY) / 2;

        // Head-relative shift: how far the skin centroid (nose/cheek mass) has shifted from the head center
        const headShiftX = (centroidX - headCenterX) / (headWidth * 0.5);
        const headShiftY = (centroidY - headCenterY) / (headHeight * 0.5);

        // Approximate 3D Yaw (Left/Right turn) and Pitch (Up/Down tilt) in degrees
        const calcYaw = Math.round(headShiftX * 70 + (normCentroidX - 0.5) * 55);
        const calcPitch = Math.round(headShiftY * 65 + (normCentroidY - 0.45) * 65);

        setYaw(calcYaw);
        setPitch(calcPitch);

        // Spatial Face Movement Tracking (Tier 2): Checks if face centroid is significantly displacing away from safe screen zone
        // Wide generous safe zone (X: 0.22 to 0.78, Y: 0.14 to 0.86) permits natural reading without false triggers
        let currentStatus: PoseStatus = 'center';
        if (normCentroidX < 0.22) currentStatus = 'left';
        else if (normCentroidX > 0.78) currentStatus = 'right';
        else if (normCentroidY > 0.86) currentStatus = 'down';
        else if (normCentroidY < 0.14) currentStatus = 'up';

        setPoseStatus(currentStatus);

        const isFaceMovingAway = currentStatus !== 'center';
        setIsLookingAway(isFaceMovingAway);

        // --- BIOMETRIC CANDIDATE BASELINE & IMPERSONATION / PROXY DETECTION (TIER 2 FALLBACK) ---
        const activeAspect = normW / (normH || 1);
        const baseline = baselineDescriptorRef.current;
        const isValidFraming = normW >= 0.15 && normH >= 0.18 && normW <= 0.85 && normH <= 0.85;

        if (!baseline.isCalibrated) {
          if (currentStatus === 'center' && isValidFraming) {
            baseline.aspectRatio =
              (baseline.aspectRatio * baseline.samplesCount + activeAspect) /
              (baseline.samplesCount + 1);
            baseline.samplesCount += 1;
            setCalibrationProgress(baseline.samplesCount);
            if (baseline.samplesCount >= 8) {
              baseline.isCalibrated = true;
              setIsBaselineCalibrated(true);
            }
          }
          consecutiveMismatchRef.current = 0;
        } else if (currentStatus === 'center') {
          const aspectDeviation =
            Math.abs(activeAspect - baseline.aspectRatio) /
            (baseline.aspectRatio || 1);

          if (aspectDeviation > 0.35) {
            consecutiveMismatchRef.current += 1;
            if (consecutiveMismatchRef.current >= 8) {
              consecutiveMismatchRef.current = 0;
              faceMismatchCountRef.current += 1;

              if (faceMismatchCountRef.current === 1) {
                reportWarning(
                  'looking_away',
                  'Warning: Candidate face mismatch detected (Strike 1 of 2). Only the registered candidate can sit for this exam.'
                );
              } else {
                handleImmediateDisqualification(
                  'multiple_faces',
                  'Disqualification: Unrecognized face / candidate impersonation detected (Strike 2 of 2). Examination terminated.'
                );
              }
            }
          } else {
            consecutiveMismatchRef.current = 0;
          }
        }

        if (isFaceMovingAway) {
          consecutiveLookingAwayRef.current += 1;
          consecutiveNoFaceRef.current = 0;
          consecutiveMultipleFacesRef.current = 0;
          prevMouthDataRef.current = null;
          lipMovementScoreRef.current = 0;

          // Require at least 4 consecutive frames (~1.6s sustained face displacement) before strike
          if (consecutiveLookingAwayRef.current >= 4) {
            consecutiveLookingAwayRef.current = 0;
            const now = Date.now();

            if (lookingAwayStrikeRef.current === 0) {
              // Strike 1: First Warning
              lookingAwayStrikeRef.current = 1;
              lastFaceMovementViolationTimeRef.current = now;
              reportWarning(
                'looking_away',
                'Warning: Face movement detected (Strike 1 of 2). Please keep your face still and focused on the screen. Next violation will terminate your exam!'
              );
            } else if (now - lastFaceMovementViolationTimeRef.current >= 6000) {
              // Strike 2: Next time Exam Quit (Disqualification after 6s recovery cooldown)
              handleImmediateDisqualification(
                'looking_away',
                'Disqualification: Repeated face movement detected (Strike 2 of 2). Examination terminated.'
              );
            }
          }
        } else {
          consecutiveLookingAwayRef.current = 0;
          consecutiveNoFaceRef.current = 0;
          consecutiveMultipleFacesRef.current = 0;

          // If candidate has stabilized face at center after Strike 1 warning, clear active alert
          if (
            lookingAwayStrikeRef.current === 1 &&
            Date.now() - lastFaceMovementViolationTimeRef.current > 4000
          ) {
            clearActiveAlert();
          }

          // ========================================================
          // LIP MOVEMENT (LIPSING) & WHISPERING DETECTION
          // Analyzes temporal optical motion flux inside mouth sub-window
          // ========================================================
          if (currentStatus === 'center' && rawHeadW >= 24 && rawHeadH >= 30) {
            const mouthY1 = Math.max(0, minY + Math.floor(rawHeadH * 0.62));
            const mouthY2 = Math.min(canvas.height, minY + Math.floor(rawHeadH * 0.88));
            const mouthX1 = Math.max(0, minX + Math.floor(rawHeadW * 0.28));
            const mouthX2 = Math.min(canvas.width, minX + Math.floor(rawHeadW * 0.72));
            checkLipMovement(data, canvas.width, canvas.height, mouthX1, mouthY1, mouthX2, mouthY2);
          } else {
            prevMouthDataRef.current = null;
            lipMovementScoreRef.current = Math.max(0, lipMovementScoreRef.current - 10);
          }
        }
      } catch (err) {
        console.debug('[FaceDetector] Pass skipped:', err);
      }
    }, 400);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [
    enabled,
    handleViolation,
    handleFaceAbsence,
    handleLipMovement,
    handleImmediateDisqualification,
    reportWarning,
    clearActiveAlert,
    videoRef,
  ]);

  return {
    isModelLoaded,
    facesDetected,
    yaw,
    pitch,
    isLookingAway,
    poseStatus,
    faceBox,
    isBaselineCalibrated,
    calibrationProgress,
    triggerManualViolation: handleViolation,
    triggerFaceAbsence: handleFaceAbsence,
  };
}
