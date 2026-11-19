import mongoose, { Document, Schema } from 'mongoose';
import { ProctorViolationType, ViolationSeverity } from '@mines-quiz/types';

export interface IViolationLogDocument extends Document {
  attemptId: mongoose.Types.ObjectId | string;
  userId: string;
  type: ProctorViolationType;
  severity: ViolationSeverity;
  confidence: number;
  timestamp: Date;
  snapshotUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const ViolationLogSchema = new Schema<IViolationLogDocument>(
  {
    attemptId: { type: Schema.Types.Mixed, ref: 'Attempt', required: true, index: true },
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: [
        'no_face',
        'multiple_faces',
        'looking_away',
        'tab_switch',
        'fullscreen_exit',
        'audio_detected',
        'suspicious_movement',
        'lip_movement',
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'warning', 'critical'],
      default: 'warning',
    },
    confidence: { type: Number, default: 1.0 },
    timestamp: { type: Date, default: Date.now },
    snapshotUrl: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const ViolationLogModel = mongoose.model<IViolationLogDocument>('ViolationLog', ViolationLogSchema);

