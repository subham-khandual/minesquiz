import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { QuizService } from '../services/quizService';
import { createQuizSchema } from '../validators/quizValidator';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class QuizController {
  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const validated = createQuizSchema.parse(req.body);
      const quiz = await QuizService.createQuiz(validated as any, req.user?.uid || 'admin');
      sendSuccess(res, quiz, 'Quiz created successfully', 201);
    } catch (err: any) {
      sendError(res, err.message, 400, 'VALIDATION_ERROR', err.errors);
    }
  }

  static async listPublished(_req: AuthenticatedRequest, res: Response) {
    try {
      const quizzes = await QuizService.getPublishedQuizzes();
      sendSuccess(res, quizzes);
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const quizId = String(req.params.id);
      const isTeacherOrAdmin = req.user?.role === 'admin' || req.user?.role === 'proctor';
      const quiz = await QuizService.getQuizById(quizId, !isTeacherOrAdmin);
      if (!quiz) {
        return sendError(res, 'Quiz not found', 404, 'NOT_FOUND');
      }
      sendSuccess(res, quiz);
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }
}
