import { QuizModel, IQuizDocument } from '../models/Quiz';
import { shuffleArray } from '@mines-quiz/utils';

export class QuizService {
  static async createQuiz(data: Partial<IQuizDocument>, createdBy: string) {
    const quiz = new QuizModel({ ...data, createdBy });
    return await quiz.save();
  }

  static async getPublishedQuizzes() {
    return await QuizModel.find({ status: 'published' })
      .select('-questions.correctOptionIds -questions.explanation')
      .lean();
  }

  static async getAllQuizzes() {
    return await QuizModel.find().lean();
  }

  static async getQuizById(quizId: string, sanitizeAnswers = true) {
    const quiz = await QuizModel.findById(quizId).lean();
    if (!quiz) return null;

    if (sanitizeAnswers) {
      // Hide correct answers and explanations from candidates during quiz fetch
      quiz.questions = quiz.questions.map((q) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { correctOptionIds, explanation, ...rest } = q;
        return rest as typeof q;
      });

      if (quiz.shuffleQuestions) {
        quiz.questions = shuffleArray(quiz.questions).map((q) => ({
          ...q,
          options: shuffleArray(q.options),
        }));
      }
    }

    return quiz;
  }
}

