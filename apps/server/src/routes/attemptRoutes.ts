import { Router } from 'express';
import { AttemptController } from '../controllers/attemptController';
import { authMiddleware } from '../middlewares/auth';
import { strictSubmissionLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.post('/start', authMiddleware, AttemptController.start);
router.get('/status/:quizId', authMiddleware, AttemptController.getStatus);
router.post('/:attemptId/answer', authMiddleware, strictSubmissionLimiter, AttemptController.recordAnswer);
router.post('/:attemptId/submit', authMiddleware, AttemptController.submit);

export const attemptRouter = router;
