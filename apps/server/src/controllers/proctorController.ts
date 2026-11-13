import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { ProctorService } from '../services/proctorService';
import { logViolationSchema } from '../validators/attemptValidator';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class ProctorController {
  static async logViolation(req: AuthenticatedRequest, res: Response) {
    try {
      const validated = logViolationSchema.parse(req.body);
      const result = await ProctorService.logViolation({
        ...validated,
        userId: req.user!.uid,
        timestamp: new Date().toISOString(),
      });

      sendSuccess(res, result, 'Violation logged', 201);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  }

  static async getAttemptViolations(req: AuthenticatedRequest, res: Response) {
    try {
      const attemptId = String(req.params.attemptId);
      const violations = await ProctorService.getAttemptViolations(attemptId);
      sendSuccess(res, violations);
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  }
}
