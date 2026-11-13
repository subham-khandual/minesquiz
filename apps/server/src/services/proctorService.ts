import { ViolationLogModel } from '../models/ViolationLog';
import { AttemptModel } from '../models/Attempt';
import { QuizModel } from '../models/Quiz';
import { ProctorViolationEvent } from '@mines-quiz/types';

export class ProctorService {
  static async logViolation(data: ProctorViolationEvent) {
    const violation = new ViolationLogModel({
      attemptId: data.attemptId,
      userId: data.userId,
      type: data.type,
      severity: data.severity,
      confidence: data.confidence,
      snapshotUrl: data.snapshotUrl,
      metadata: data.metadata,
      timestamp: new Date(data.timestamp || Date.now()),
    });

    await violation.save();

    // Increment violation count in the active attempt
    const attempt = await AttemptModel.findById(data.attemptId);
    let isTerminated = false;

    if (attempt) {
      attempt.violationsCount += 1;

      const quiz = await QuizModel.findById(attempt.quizId);
      if (quiz && attempt.violationsCount >= quiz.maxViolationsAllowed) {
        attempt.status = 'terminated';
        isTerminated = true;
      }

      await attempt.save();
    }

    return {
      violation,
      violationsCount: attempt ? attempt.violationsCount : 1,
      isTerminated,
    };
  }

  static async getAttemptViolations(attemptId: string) {
    return await ViolationLogModel.find({ attemptId }).sort({ timestamp: -1 }).lean();
  }
}

