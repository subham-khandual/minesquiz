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
  const [faceBox, setFaceBox] = useState<FaceBoundingBox | null>({
    x: 0.2,
    y: 0.15,
    width: 0.6,
    height: 0.7,
  });

  const reportViolation = useProctorStore((s) => s.reportViolation);
  const reportFaceAbsence = useProctorStore((s) => s.reportFaceAbsence);

  // Temporal debounce tracking to avoid false positives from natural eye blinks or camera blur
  const consecutiveLookingAwayRef = useRef(0);
  const consecutiveNoFaceRef = useRef(0);
  const consecutiveMultipleFacesRef = useRef(0);
  const lastViolationTimeRef = useRef(0);

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
      if (now - lastViolationTimeRef.current < 4000) {
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

  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;
    setIsModelLoaded(true);

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
                setPoseStatus('no_face');
                setIsLookingAway(true);
                setFaceBox(null);

                // 8 consecutive frames = ~3.2 seconds without face before single chance warning
                if (consecutiveNoFaceRef.current >= 8) {
                  handleFaceAbsence(
                    'No face visible in camera frame. You have 1 chance remaining. Please face your webcam.'
                  );
                }
                return;
              }

              if (detectedCount > 1) {
                consecutiveMultipleFacesRef.current += 1;
                consecutiveNoFaceRef.current = 0;
                consecutiveLookingAwayRef.current = 0;
                setPoseStatus('multiple');
                setIsLookingAway(true);

                if (consecutiveMultipleFacesRef.current >= 3) {
                  handleViolation(
                    'multiple_faces',
                    `Multiple faces detected in frame (${detectedCount} people).`
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

              // Generous 40-degree Yaw and 35-degree Pitch tolerance for normal wide-screen question reading
              let currentStatus: PoseStatus = 'center';
              if (calcYaw < -40) currentStatus = 'left';
              else if (calcYaw > 40) currentStatus = 'right';
              else if (calcPitch > 35) currentStatus = 'down';
              else if (calcPitch < -35) currentStatus = 'up';

              setPoseStatus(currentStatus);

              const turnedAway = currentStatus !== 'center';
              setIsLookingAway(turnedAway);

              if (turnedAway) {
                consecutiveLookingAwayRef.current += 1;
                consecutiveNoFaceRef.current = 0;
                consecutiveMultipleFacesRef.current = 0;

                // 7 frames = ~2.8s continuous turned pose
                if (consecutiveLookingAwayRef.current >= 7) {
                  handleViolation(
                    'looking_away',
                    `Candidate head pose turned away from display (${currentStatus}: ${calcYaw}°).`
                  );
                }
              } else {
                consecutiveLookingAwayRef.current = 0;
                consecutiveNoFaceRef.current = 0;
                consecutiveMultipleFacesRef.current = 0;
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

        // Check if face is present: minimum 60 skin pixel samples in downscaled frame
        // Under extreme backlighting or low-light, this prevents false "no_face" alarms
        if (totalSkinPixels < 60) {
          consecutiveNoFaceRef.current += 1;
          consecutiveLookingAwayRef.current = 0;
          consecutiveMultipleFacesRef.current = 0;
          setFacesDetected(0);
          setPoseStatus('no_face');
          setIsLookingAway(true);
          setFaceBox(null);

          // 8 frames = ~3.2 seconds without face before single chance warning
          if (consecutiveNoFaceRef.current >= 8) {
            handleFaceAbsence(
              'No candidate face detected in video stream. You have 1 chance remaining. Please face your webcam.'
            );
          }
          return;
        }

        // Face present: reset absence tracker
        setFacesDetected(1);
        consecutiveNoFaceRef.current = 0;

        const centroidX = sumX / totalSkinPixels;
        const centroidY = sumY / totalSkinPixels;

        // Bounding box normalized
        const normX = Math.max(0.05, Math.min(0.85, minX / canvas.width));
        const normY = Math.max(0.05, Math.min(0.85, minY / canvas.height));
        const normW = Math.max(0.2, Math.min(0.9, (maxX - minX) / canvas.width));
        const normH = Math.max(0.2, Math.min(0.9, (maxY - minY) / canvas.height));

        setFaceBox({
          x: normX,
          y: normY,
          width: normW,
          height: normH,
        });

        // Horizontal and vertical asymmetry calculations
        const normCentroidX = centroidX / canvas.width;
        const normCentroidY = centroidY / canvas.height;
        const asymmetry = (leftSkinCount - rightSkinCount) / (totalSkinPixels || 1);

        // Approximate 3D Yaw (Left/Right turn) and Pitch (Up/Down tilt) in degrees
        const calcYaw = Math.round((normCentroidX - 0.5) * 80 + asymmetry * 35);
        const calcPitch = Math.round((normCentroidY - 0.45) * 70);

        setYaw(calcYaw);
        setPitch(calcPitch);

        // Generous 40-degree Yaw and 35-degree Pitch tolerance for normal wide-screen question reading
        let currentStatus: PoseStatus = 'center';
        if (calcYaw < -40) currentStatus = 'left';
        else if (calcYaw > 40) currentStatus = 'right';
        else if (calcPitch > 35) currentStatus = 'down';
        else if (calcPitch < -35) currentStatus = 'up';

        setPoseStatus(currentStatus);

        const turnedAway = currentStatus !== 'center';
        setIsLookingAway(turnedAway);

        if (turnedAway) {
          consecutiveLookingAwayRef.current += 1;

          // 7 frames = ~2.8s continuous turned pose
          if (consecutiveLookingAwayRef.current >= 7) {
            handleViolation(
              'looking_away',
              `Candidate head turned away from screen (${currentStatus}: ${calcYaw}°).`
            );
          }
        } else {
          consecutiveLookingAwayRef.current = 0;
        }
      } catch (err) {
        console.debug('[FaceDetector] Pass skipped:', err);
      }
    }, 400);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [enabled, handleViolation, handleFaceAbsence, videoRef]);

  return {
    isModelLoaded,
    facesDetected,
    yaw,
    pitch,
    isLookingAway,
    poseStatus,
    faceBox,
    triggerManualViolation: handleViolation,
    triggerFaceAbsence: handleFaceAbsence,
  };
}
