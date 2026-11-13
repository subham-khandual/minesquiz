import { Router } from 'express';
import { QuizController } from '../controllers/quizController';
import { authMiddleware, roleGuard } from '../middlewares/auth';

const router = Router();

router.get('/', authMiddleware, QuizController.listPublished);
router.get('/:id', authMiddleware, QuizController.getById);
router.post('/', authMiddleware, roleGuard(['admin', 'proctor']), QuizController.create);

export const quizRouter = router;

