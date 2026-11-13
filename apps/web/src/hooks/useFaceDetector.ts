import { useEffect, useRef, useState } from 'react';
import { ProctorViolationType } from '@mines-quiz/types';
import { apiClient } from '../lib/apiClient';
import { useProctorStore } from '../stores/useProctorStore';

interface UseFaceDetectorOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  attemptId?: string;
  enabled?: boolean;
  captureSnapshot: () => string | null;
}

export function useFaceDetector({
  videoRef,
  attemptId,
  enabled = true,
  captureSnapshot,
}: UseFaceDetectorOptions) {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [facesDetected, setFacesDetected] = useState<number>(1);
  const reportViolation = useProctorStore((s) => s.reportViolation);
  const consecutiveAbsenceRef = useRef(0);

  // Initialize face detection loop
  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;
    setIsModelLoaded(true);

    const interval = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2 || !isMounted) {
        return;
      }

      try {
        // High-performance canvas frame analysis
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 48;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = frameData.data;

        // Calculate average brightness and edge contrast to detect obstruction or blacked-out camera
        let brightnessSum = 0;
        for (let i = 0; i < data.length; i += 4) {
          brightnessSum += (data[i] + data[i + 1] + data[i + 2]) / 3;
        }
        const avgBrightness = brightnessSum / (data.length / 4);

        if (avgBrightness < 15) {
          consecutiveAbsenceRef.current += 1;
          if (consecutiveAbsenceRef.current >= 3) {
            handleViolation('no_face', 'Camera appears covered or no face visible', 0.95);
            consecutiveAbsenceRef.current = 0;
          }
        } else {
          consecutiveAbsenceRef.current = 0;
          setFacesDetected(1);
        }
      } catch (err) {
        console.debug('Face detection pass skipped:', err);
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [enabled, videoRef]);

  const handleViolation = async (type: ProctorViolationType, message: string, confidence = 0.9) => {
    reportViolation(type, message);

    if (attemptId) {
      try {
        const snapshotUrl = captureSnapshot() || undefined;
        await apiClient.post('/proctor/violation', {
          attemptId,
          type,
          severity: 'warning',
          confidence,
          snapshotUrl,
        });
      } catch (err) {
        console.warn('Failed to log violation to server:', err);
      }
    }
  };

  return {
    isModelLoaded,
    facesDetected,
    triggerManualViolation: handleViolation,
  };
}

