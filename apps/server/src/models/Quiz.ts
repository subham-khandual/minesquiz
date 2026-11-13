import mongoose, { Document, Schema } from 'mongoose';
import { QuestionType, QuizStatus } from '@mines-quiz/types';

export interface IQuestionSubdocument {
  _id: mongoose.Types.ObjectId;
  text: string;
  imageUrl?: string;
  type: QuestionType;
  options: {
    id: string;
    text: string;
    imageUrl?: string;
  }[];
  correctOptionIds: string[];
  marks: number;
  negativeMarks?: number;
  explanation?: string;
}

export interface IQuizDocument extends Document {
  title: string;
  description: string;
  category?: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  questionsCount?: number;
  questions: IQuestionSubdocument[];
  shuffleQuestions: boolean;
  proctoringEnabled: boolean;
  maxViolationsAllowed: number;
  status: QuizStatus;
  scheduledStartTime?: Date;
  scheduledEndTime?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSubSchema = new Schema<IQuestionSubdocument>({
  text: { type: String, required: true },
  imageUrl: { type: String },
  type: {
    type: String,
    enum: ['mcq', 'multiple-select', 'true-false', 'short-answer'],
    default: 'mcq',
  },
  options: [
    {
      id: { type: String, required: true },
      text: { type: String, required: true },
      imageUrl: { type: String },
    },
  ],
  correctOptionIds: [{ type: String, required: true }],
  marks: { type: Number, required: true, default: 1 },
  negativeMarks: { type: Number, default: 0 },
  explanation: { type: String },
});

const QuizSchema = new Schema<IQuizDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, default: 'General' },
    durationMinutes: { type: Number, required: true, default: 30 },
    totalMarks: { type: Number, required: true, default: 100 },
    passingMarks: { type: Number, required: true, default: 40 },
    questionsCount: { type: Number },
    questions: [QuestionSubSchema],
    shuffleQuestions: { type: Boolean, default: true },
    proctoringEnabled: { type: Boolean, default: true },
    maxViolationsAllowed: { type: Number, default: 5 },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    scheduledStartTime: { type: Date },
    scheduledEndTime: { type: Date },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

export const QuizModel = mongoose.model<IQuizDocument>('Quiz', QuizSchema);

