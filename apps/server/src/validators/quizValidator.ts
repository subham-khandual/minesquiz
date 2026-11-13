import { z } from 'zod';

export const createQuizSchema = z.object({
  title: z.string().min(3).max(150),
  description: z.string().min(5),
  category: z.string().optional().default('General'),
  durationMinutes: z.number().int().positive().max(360),
  totalMarks: z.number().positive(),
  passingMarks: z.number().positive(),
  shuffleQuestions: z.boolean().default(true),
  proctoringEnabled: z.boolean().default(true),
  maxViolationsAllowed: z.number().int().min(1).default(5),
  questions: z.array(
    z.object({
      text: z.string().min(2),
      imageUrl: z.string().url().optional(),
      type: z.enum(['mcq', 'multiple-select', 'true-false', 'short-answer']).default('mcq'),
      options: z.array(
        z.object({
          id: z.string(),
          text: z.string().min(1),
          imageUrl: z.string().url().optional(),
        })
      ).min(2),
      correctOptionIds: z.array(z.string()).min(1),
      marks: z.number().positive().default(1),
      negativeMarks: z.number().nonnegative().optional().default(0),
      explanation: z.string().optional(),
    })
  ).min(1),
});

export const updateQuizSchema = createQuizSchema.partial();

