import { create } from 'zustand';
import { Quiz, Question, UserAnswer, Attempt } from '@mines-quiz/types';

interface QuizState {
  currentQuiz: Quiz | null;
  activeAttempt: Attempt | null;
  masterQuestionsForScoring: Question[];
  currentIndex: number;
  answers: Map<string, string[]>;
  markedForReview: Set<string>;
  timeRemainingSeconds: number;
  endTimeTimestampMs: number | null;

  setQuizSession: (quiz: Quiz, attempt: Attempt, masterQuestions?: Question[]) => void;
  setCurrentIndex: (index: number) => void;
  selectOption: (questionId: string, optionId: string, isMultiple?: boolean) => void;
  toggleMarkForReview: (questionId: string) => void;
  decrementTimer: () => void;
  getCurrentAnswersArray: () => UserAnswer[];
  resetSession: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  currentQuiz: null,
  activeAttempt: null,
  masterQuestionsForScoring: [],
  currentIndex: 0,
  answers: new Map(),
  markedForReview: new Set(),
  timeRemainingSeconds: 0,
  endTimeTimestampMs: null,

  setQuizSession: (quiz, attempt, masterQuestions = []) => {
    const durationSeconds = quiz.durationMinutes * 60;
    const endTimeTimestampMs = Date.now() + durationSeconds * 1000;
    set({
      currentQuiz: quiz,
      activeAttempt: attempt,
      masterQuestionsForScoring: masterQuestions,
      currentIndex: 0,
      answers: new Map(),
      markedForReview: new Set(),
      timeRemainingSeconds: durationSeconds,
      endTimeTimestampMs,
    });
  },

  setCurrentIndex: (index) => set({ currentIndex: index }),

  selectOption: (questionId, optionId, isMultiple = false) => {
    const { answers } = get();
    const newAnswers = new Map(answers);
    const existing = newAnswers.get(questionId) || [];

    if (isMultiple) {
      if (existing.includes(optionId)) {
        newAnswers.set(questionId, existing.filter((id) => id !== optionId));
      } else {
        newAnswers.set(questionId, [...existing, optionId]);
      }
    } else {
      newAnswers.set(questionId, [optionId]);
    }

    set({ answers: newAnswers });
  },

  toggleMarkForReview: (questionId) => {
    const { markedForReview } = get();
    const newSet = new Set(markedForReview);
    if (newSet.has(questionId)) {
      newSet.delete(questionId);
    } else {
      newSet.add(questionId);
    }
    set({ markedForReview: newSet });
  },

  decrementTimer: () => {
    const { endTimeTimestampMs, timeRemainingSeconds } = get();
    if (endTimeTimestampMs) {
      const remaining = Math.max(0, Math.floor((endTimeTimestampMs - Date.now()) / 1000));
      set({ timeRemainingSeconds: remaining });
    } else if (timeRemainingSeconds > 0) {
      set({ timeRemainingSeconds: timeRemainingSeconds - 1 });
    }
  },

  getCurrentAnswersArray: () => {
    const { answers, markedForReview } = get();
    const result: UserAnswer[] = [];
    answers.forEach((selectedOptionIds, questionId) => {
      result.push({
        questionId,
        selectedOptionIds,
        isMarkedForReview: markedForReview.has(questionId),
      });
    });
    return result;
  },

  resetSession: () =>
    set({
      currentQuiz: null,
      activeAttempt: null,
      masterQuestionsForScoring: [],
      currentIndex: 0,
      answers: new Map(),
      markedForReview: new Set(),
      timeRemainingSeconds: 0,
      endTimeTimestampMs: null,
    }),
}));

