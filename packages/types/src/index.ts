/**
 * Mines Quiz Shared Type Definitions
 */

export type UserRole = 'student' | 'proctor' | 'admin';

export interface UserProfile {
  id: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
}

export type QuestionType = 'mcq' | 'multiple-select' | 'true-false' | 'short-answer';

export interface QuestionOption {
  id: string;
  text: string;
  imageUrl?: string;
}

export interface Question {
  id: string;
  quizId?: string;
  text: string;
  imageUrl?: string;
  type: QuestionType;
  options: QuestionOption[];
  correctOptionIds?: string[]; // Kept secret from client during active exam
  marks: number;
  negativeMarks?: number;
  explanation?: string;
}

export type QuizStatus = 'draft' | 'published' | 'archived';

export interface Quiz {
  id: string;
  title: string;
  description: string;
  category?: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  questionsCount: number;
  questions?: Question[];
  shuffleQuestions: boolean;
  proctoringEnabled: boolean;
  maxViolationsAllowed: number;
  status: QuizStatus;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type AttemptStatus = 'in-progress' | 'submitted' | 'timed-out' | 'terminated';

export interface UserAnswer {
  questionId: string;
  selectedOptionIds: string[];
  isMarkedForReview?: boolean;
  timeSpentSeconds?: number;
}

export interface AttemptResultItem {
  questionId: string;
  questionText: string;
  userSelection: string[];
  correctSelection: string[];
  isCorrect: boolean;
  marksAwarded: number;
  explanation?: string;
}

export interface Attempt {
  id: string;
  quizId: string;
  quizTitle: string;
  userId: string;
  userEmail: string;
  userDisplayName: string;
  answers: UserAnswer[];
  status: AttemptStatus;
  startTime: string;
  endTime?: string;
  submittedAt?: string;
  score?: number;
  totalMarks?: number;
  percentage?: number;
  passed?: boolean;
  violationsCount: number;
  results?: AttemptResultItem[];
}

export type ProctorViolationType =
  | 'no_face'
  | 'multiple_faces'
  | 'looking_away'
  | 'tab_switch'
  | 'fullscreen_exit'
  | 'audio_detected'
  | 'suspicious_movement'
  | 'lip_movement';

export type ViolationSeverity = 'low' | 'warning' | 'critical';

export interface ProctorViolationEvent {
  id?: string;
  attemptId: string;
  userId: string;
  type: ProctorViolationType;
  severity: ViolationSeverity;
  confidence: number;
  timestamp: string;
  snapshotUrl?: string; // Base64 or cloud storage link
  metadata?: Record<string, unknown>;
}

export interface WebRTCStreamSignal {
  senderId: string;
  receiverId?: string;
  type: 'offer' | 'answer' | 'candidate';
  payload: unknown;
  timestamp: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

