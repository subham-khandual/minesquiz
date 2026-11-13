import { AttemptModel } from '../models/Attempt';
import { QuizModel } from '../models/Quiz';
import { gradeAttempt } from '@mines-quiz/utils';
import { UserAnswer, Question } from '@mines-quiz/types';

export class AttemptService {
  /**
   * Starts a new attempt or resumes an in-progress one.
   * Strictly enforces 1 attempt per email: blocks if already submitted or terminated.
   */
  static async startAttempt(quizId: string, user: { uid: string; email: string; name: string }) {
    const quiz = await QuizModel.findById(quizId);
    if (!quiz) throw new Error('Quiz not found');
    if (quiz.status !== 'published') throw new Error('Quiz is not open for attempts');

    const normalizedEmail = user.email.toLowerCase();

    // 1. Check if user already submitted or was disqualified on this email
    const existingCompleted = await AttemptModel.findOne({
      quizId: quiz._id,
      userEmail: normalizedEmail,
      status: { $in: ['submitted', 'terminated'] },
    });

    if (existingCompleted) {
      const err = new Error(
        'ALREADY_COMPLETED: You have already completed this examination. Multiple attempts are not permitted for this email.'
      );
      (err as any).code = 'ALREADY_COMPLETED';
      (err as any).attemptId = existingCompleted._id.toString();
      (err as any).status = existingCompleted.status;
      throw err;
    }

    // 2. Check for active in-progress attempt to resume
    const existingActive = await AttemptModel.findOne({
      quizId: quiz._id,
      userEmail: normalizedEmail,
      status: 'in-progress',
    });

    if (existingActive) {
      return existingActive;
    }

    // 3. Create fresh attempt
    const durationMs = quiz.durationMinutes * 60 * 1000;
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + durationMs);

    const attempt = new AttemptModel({
      quizId: quiz._id,
      userId: user.uid,
      userEmail: normalizedEmail,
      userDisplayName: user.name,
      answers: [],
      status: 'in-progress',
      startTime,
      endTime,
      totalMarks: quiz.totalMarks,
    });

    return await attempt.save();
  }

  /**
   * Check if a given email has already attempted this quiz
   */
  static async getAttemptStatusForUser(quizId: string, userEmail: string) {
    const attempt = await AttemptModel.findOne({
      quizId,
      userEmail: userEmail.toLowerCase(),
    }).sort({ createdAt: -1 });

    if (!attempt) {
      return { hasAttempted: false, canStart: true };
    }

    const isFinished = attempt.status === 'submitted' || attempt.status === 'terminated';

    return {
      hasAttempted: isFinished,
      canStart: !isFinished,
      status: attempt.status,
      attemptId: attempt._id.toString(),
      score: attempt.score,
      totalMarks: attempt.totalMarks,
      percentage: attempt.percentage,
      passed: attempt.passed,
      violationsCount: attempt.violationsCount,
      submittedAt: attempt.submittedAt,
    };
  }

  static async recordAnswer(attemptId: string, answer: UserAnswer) {
    const attempt = await AttemptModel.findById(attemptId);
    if (!attempt) throw new Error('Attempt not found');
    if (attempt.status !== 'in-progress') throw new Error('Attempt is already closed');

    const index = attempt.answers.findIndex((a) => a.questionId === answer.questionId);
    if (index >= 0) {
      attempt.answers[index] = {
        questionId: answer.questionId,
        selectedOptionIds: answer.selectedOptionIds,
        isMarkedForReview: !!answer.isMarkedForReview,
        timeSpentSeconds: answer.timeSpentSeconds || 0,
      };
    } else {
      attempt.answers.push({
        questionId: answer.questionId,
        selectedOptionIds: answer.selectedOptionIds,
        isMarkedForReview: !!answer.isMarkedForReview,
        timeSpentSeconds: answer.timeSpentSeconds || 0,
      });
    }

    return await attempt.save();
  }

  static async submitAttempt(attemptId: string, finalAnswers?: UserAnswer[]) {
    const attempt = await AttemptModel.findById(attemptId);
    if (!attempt) throw new Error('Attempt not found');
    if (attempt.status === 'submitted') return attempt;
    if (attempt.status === 'terminated') {
      throw new Error('TERMINATED_EXAM: This examination was terminated due to proctoring violations and cannot be submitted.');
    }

    const quiz = await QuizModel.findById(attempt.quizId);
    if (!quiz) throw new Error('Associated quiz not found');

    const answersToGrade = finalAnswers && finalAnswers.length > 0 ? finalAnswers : attempt.answers;

    const questionsForGrading = quiz.questions.map((q) => ({
      id: q._id.toString(),
      text: q.text,
      type: q.type,
      options: q.options,
      correctOptionIds: q.correctOptionIds,
      marks: q.marks,
      negativeMarks: q.negativeMarks,
      explanation: q.explanation,
    })) as Question[];

    const graded = gradeAttempt(questionsForGrading, answersToGrade as UserAnswer[]);

    attempt.status = 'submitted';
    attempt.submittedAt = new Date();
    attempt.score = graded.totalScore;
    attempt.totalMarks = graded.totalPossibleMarks;
    attempt.percentage = graded.percentage;
    attempt.passed = graded.totalScore >= quiz.passingMarks;
    attempt.results = graded.results;

    return await attempt.save();
  }
}
