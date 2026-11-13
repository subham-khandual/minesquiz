import { Router } from 'express';
import { ProctorController } from '../controllers/proctorController';
import { authMiddleware, roleGuard } from '../middlewares/auth';
import { proctorViolationLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.post('/violation', authMiddleware, proctorViolationLimiter, ProctorController.logViolation);
router.get(
  '/violations/:attemptId',
  authMiddleware,
  roleGuard(['admin', 'proctor']),
  ProctorController.getAttemptViolations
);

export const proctorRouter = router;

