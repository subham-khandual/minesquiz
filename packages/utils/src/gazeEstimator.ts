import { ProctorViolationType } from '@mines-quiz/types';

export interface Landmark3D {
  x: number;
  y: number;
  z: number;
}

export interface HeadPoseResult {
  pitch: number; // looking up / down
  yaw: number;   // looking left / right
  roll: number;  // tilting head
  isLookingAway: boolean;
}

export interface FaceInferenceResult {
  faceCount: number;
  violationDetected?: ProctorViolationType;
  confidence: number;
  details?: Record<string, unknown>;
}

/**
 * Calculates head pose angles (Pitch, Yaw, Roll) from standard 468 MediaPipe facial landmarks
 */
export function estimateHeadPose(landmarks: Landmark3D[]): HeadPoseResult {
  if (!landmarks || landmarks.length < 468) {
    return { pitch: 0, yaw: 0, roll: 0, isLookingAway: false };
  }

  // Key MediaPipe landmark indices
  // 1: Nose tip
  // 33: Left eye outer corner
  // 263: Right eye outer corner
  const nose = landmarks[1];
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];

  // Calculate eye center
  const eyeCenterX = (leftEye.x + rightEye.x) / 2;
  const eyeCenterY = (leftEye.y + rightEye.y) / 2;

  // Yaw (horizontal turning) approximation
  const eyeDist = Math.abs(rightEye.x - leftEye.x) || 0.001;
  const yaw = ((nose.x - eyeCenterX) / eyeDist) * 100;

  // Pitch (vertical tilting) approximation
  const pitch = (nose.y - eyeCenterY) * 100;

  // Roll (head tilt)
  const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);

  // Thresholds: Yaw > 35 or Pitch outside normal range
  const isLookingAway = Math.abs(yaw) > 35 || Math.abs(pitch) > 40;

  return {
    pitch: Math.round(pitch),
    yaw: Math.round(yaw),
    roll: Math.round(roll),
    isLookingAway,
  };
}

export class FaceProctorAnalyzer {
  static analyzeLandmarks(faces: Landmark3D[][]): FaceInferenceResult {
    if (!faces || faces.length === 0) {
      return {
        faceCount: 0,
        violationDetected: 'no_face',
        confidence: 0.98,
        details: { reason: 'No facial landmarks detected in frame' },
      };
    }

    if (faces.length > 1) {
      return {
        faceCount: faces.length,
        violationDetected: 'multiple_faces',
        confidence: 0.95,
        details: { count: faces.length, reason: 'Multiple faces in candidate video stream' },
      };
    }

    // Single face detected - analyze gaze pose
    const primaryFace = faces[0];
    const pose = estimateHeadPose(primaryFace);

    if (pose.isLookingAway) {
      return {
        faceCount: 1,
        violationDetected: 'looking_away',
        confidence: 0.9,
        details: { pose, reason: 'Candidate head pose deviated from display' },
      };
    }

    return {
      faceCount: 1,
      confidence: 1.0,
      details: { pose },
    };
  }
}
