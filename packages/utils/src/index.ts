import { Question, UserAnswer, AttemptResultItem } from '@mines-quiz/types';

/**
 * Shuffles array in-place using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Formats seconds into MM:SS or HH:MM:SS string
 */
export function formatSecondsToTime(totalSeconds: number): string {
  if (totalSeconds < 0) totalSeconds = 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Evaluates submitted user answers against questions database
 */
export function gradeAttempt(
  questions: Question[],
  answers: UserAnswer[]
): {
  totalScore: number;
  totalPossibleMarks: number;
  percentage: number;
  results: AttemptResultItem[];
} {
  const answerMap = new Map<string, string[]>();
  answers.forEach((ans) => {
    answerMap.set(ans.questionId, ans.selectedOptionIds || []);
  });

  let totalScore = 0;
  let totalPossibleMarks = 0;
  const results: AttemptResultItem[] = [];

  for (const q of questions) {
    totalPossibleMarks += q.marks;
    const userSelected = answerMap.get(q.id) || [];
    const correctOptions = q.correctOptionIds || [];

    // Check correctness (exact set equality with valid non-empty answer key)
    const isCorrect =
      correctOptions.length > 0 &&
      userSelected.length === correctOptions.length &&
      userSelected.every((opt) => correctOptions.includes(opt));

    let awarded = 0;
    if (isCorrect) {
      awarded = q.marks;
    } else if (userSelected.length > 0 && q.negativeMarks) {
      awarded = -Math.abs(q.negativeMarks);
    }

    totalScore += awarded;

    results.push({
      questionId: q.id,
      questionText: q.text,
      userSelection: userSelected,
      correctSelection: correctOptions,
      isCorrect,
      marksAwarded: awarded,
      explanation: q.explanation,
    });
  }

  // Score cannot be negative overall
  totalScore = Math.max(0, totalScore);
  const percentage = totalPossibleMarks > 0 ? (totalScore / totalPossibleMarks) * 100 : 0;

  return {
    totalScore,
    totalPossibleMarks,
    percentage: Math.round(percentage * 100) / 100,
    results,
  };
}

/**
 * Sanitizes input string to prevent XSS payloads
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export * from './validation';
export * from './gazeEstimator';


