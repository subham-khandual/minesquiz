import { z } from 'zod';

export const startAttemptSchema = z.object({
  quizId: z.string().min(1),
});

export const submitAnswerSchema = z.object({
  questionId: z.string().min(1),
  selectedOptionIds: z.array(z.string()),
  isMarkedForReview: z.boolean().optional(),
  timeSpentSeconds: z.number().nonnegative().optional(),
});

export const submitQuizSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      selectedOptionIds: z.array(z.string()),
      isMarkedForReview: z.boolean().optional(),
      timeSpentSeconds: z.number().nonnegative().optional(),
    })
  ),
});

export const logViolationSchema = z.object({
  attemptId: z.string().min(1),
  type: z.enum([
    'no_face',
    'multiple_faces',
    'looking_away',
    'tab_switch',
    'fullscreen_exit',
    'audio_detected',
    'suspicious_movement',
    'lip_movement',
  ]),
  severity: z.enum(['low', 'warning', 'critical']).default('warning'),
  confidence: z.number().min(0).max(1).default(1.0),
  snapshotUrl: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

