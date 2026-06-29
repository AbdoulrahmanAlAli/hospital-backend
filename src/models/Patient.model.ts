import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export interface IPatient extends Document {
  user?: Types.ObjectId;
  fullName: string;
  nationalId?: string;
  phone?: string;
  email?: string;
  gender: 'male' | 'female' | 'other';
  birthDate?: Date;
  address?: string;
  bloodType?: string;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relation?: string;
  };
  assignedDoctor: Types.ObjectId;
  allergies?: string[];
  chronicDiseases?: string[];
  archived: boolean;
}

const patientSchema = new Schema<IPatient>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true, sparse: true },
    fullName: { type: String, required: true, trim: true, index: true },
    nationalId: { type: String, trim: true, index: true, sparse: true },
    phone: { type: String, trim: true, index: true },
    email: { type: String, lowercase: true, trim: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    birthDate: Date,
    address: String,
    bloodType: String,
    emergencyContact: {
      name: String,
      phone: String,
      relation: String
    },
    assignedDoctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    allergies: [{ type: String, trim: true }],
    chronicDiseases: [{ type: String, trim: true }],
    archived: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

patientSchema.index({ fullName: 'text', phone: 'text', nationalId: 'text' });

export const PatientModel: Model<IPatient> = mongoose.model<IPatient>('Patient', patientSchema);
