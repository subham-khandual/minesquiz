import { Router } from 'express';
import { quizRouter } from './quizRoutes';
import { attemptRouter } from './attemptRoutes';
import { proctorRouter } from './proctorRoutes';
import { appState } from '../config/appState';

const router = Router();

router.use('/quizzes', quizRouter);
router.use('/attempts', attemptRouter);
router.use('/proctor', proctorRouter);

router.get('/health', (_req, res) => {
  if (appState.isShuttingDown) {
    return res.status(503).json({
      status: 'shutting_down',
      message: 'Server is draining connections for deployment.',
    });
  }
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export const apiRouter = router;

