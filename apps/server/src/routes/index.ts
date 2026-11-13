import { Router } from 'express';
import { quizRouter } from './quizRoutes';
import { attemptRouter } from './attemptRoutes';
import { proctorRouter } from './proctorRoutes';

const router = Router();

router.use('/quizzes', quizRouter);
router.use('/attempts', attemptRouter);
router.use('/proctor', proctorRouter);

router.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export const apiRouter = router;

