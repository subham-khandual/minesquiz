import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { AttemptService } from '../services/attemptService';
import { startAttemptSchema, submitAnswerSchema, submitQuizSchema } from '../validators/attemptValidator';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class AttemptController {
  static async start(req: AuthenticatedRequest, res: Response) {
    try {
      const { quizId } = startAttemptSchema.parse(req.body);
      const attempt = await AttemptService.startAttempt(quizId, {
        uid: req.user!.uid,
        email: req.user!.email,
        name: req.user!.name,
      });
      sendSuccess(res, attempt, 'Exam session started', 201);
    } catch (err: any) {
      if (err.code === 'ALREADY_COMPLETED') {
        return sendError(res, err.message, 403, 'ALREADY_COMPLETED', {
          attemptId: err.attemptId,
          status: err.status,
        });
      }
      sendError(res, err.message, 400);
    }
  }

  static async getStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const quizId = String(req.params.quizId);
      const status = await AttemptService.getAttemptStatusForUser(quizId, req.user!.email);
      sendSuccess(res, status);
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }

  static async recordAnswer(req: AuthenticatedRequest, res: Response) {
    try {
      const attemptId = String(req.params.attemptId);
      const validated = submitAnswerSchema.parse(req.body);
      const updated = await AttemptService.recordAnswer(attemptId, validated);
      sendSuccess(res, updated, 'Answer recorded');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  static async submit(req: AuthenticatedRequest, res: Response) {
    try {
      const attemptId = String(req.params.attemptId);
      const validated = submitQuizSchema.safeParse(req.body);
      const answers = validated.success ? validated.data.answers : undefined;
      const result = await AttemptService.submitAttempt(attemptId, answers);
      sendSuccess(res, result, 'Exam submitted successfully');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }
}
