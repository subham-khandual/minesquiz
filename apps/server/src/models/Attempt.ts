import mongoose, { Document, Schema } from 'mongoose';
import { AttemptStatus } from '@mines-quiz/types';

export interface IAttemptDocument extends Document {
  quizId: mongoose.Types.ObjectId;
  userId: string;
  userEmail: string;
  userDisplayName: string;
  answers: {
    questionId: string;
    selectedOptionIds: string[];
    isMarkedForReview: boolean;
    timeSpentSeconds: number;
  }[];
  status: AttemptStatus;
  startTime: Date;
  endTime?: Date;
  submittedAt?: Date;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  violationsCount: number;
  results: {
    questionId: string;
    questionText: string;
    userSelection: string[];
    correctSelection: string[];
    isCorrect: boolean;
    marksAwarded: number;
    explanation?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const AttemptSchema = new Schema<IAttemptDocument>(
  {
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true },
    userDisplayName: { type: String, required: true },
    answers: [
      {
        questionId: { type: String, required: true },
        selectedOptionIds: [{ type: String }],
        isMarkedForReview: { type: Boolean, default: false },
        timeSpentSeconds: { type: Number, default: 0 },
      },
    ],
    status: {
      type: String,
      enum: ['in-progress', 'submitted', 'timed-out', 'terminated'],
      default: 'in-progress',
    },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    submittedAt: { type: Date },
    score: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    violationsCount: { type: Number, default: 0 },
    results: [
      {
        questionId: { type: String },
        questionText: { type: String },
        userSelection: [{ type: String }],
        correctSelection: [{ type: String }],
        isCorrect: { type: Boolean },
        marksAwarded: { type: Number },
        explanation: { type: String },
      },
    ],
  },
  { timestamps: true }
);

AttemptSchema.index({ quizId: 1, userEmail: 1, status: 1 });

export const AttemptModel = mongoose.model<IAttemptDocument>('Attempt', AttemptSchema);

