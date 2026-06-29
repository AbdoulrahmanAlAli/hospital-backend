import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export type TestStatus = 'requested' | 'in_progress' | 'completed' | 'cancelled';

export interface IMedicalTest extends Document {
  patient: Types.ObjectId;
  doctor: Types.ObjectId;
  title: string;
  type: string;
  resultSummary?: string;
  status: TestStatus;
  requestedAt: Date;
  completedAt?: Date;
  pdfFile?: {
    originalName: string;
    storedName: string;
    storedPath: string;
    mimeType: string;
    size: number;
    iv: string;
    authTag: string;
    uploadedBy: Types.ObjectId;
    uploadedAt: Date;
  };
}

const medicalTestSchema = new Schema<IMedicalTest>(
  {
    patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    title: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true, index: true },
    resultSummary: String,
    status: { type: String, enum: ['requested', 'in_progress', 'completed', 'cancelled'], default: 'requested', index: true },
    requestedAt: { type: Date, default: Date.now },
    completedAt: Date,
    pdfFile: {
      originalName: String,
      storedName: String,
      storedPath: String,
      mimeType: String,
      size: Number,
      iv: String,
      authTag: String,
      uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      uploadedAt: Date
    }
  },
  { timestamps: true }
);

medicalTestSchema.index({ patient: 1, doctor: 1, createdAt: -1 });

export const MedicalTestModel: Model<IMedicalTest> = mongoose.model<IMedicalTest>('MedicalTest', medicalTestSchema);
