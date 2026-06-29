import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface IAppointment extends Document {
  patient: Types.ObjectId;
  doctor: Types.ObjectId;
  scheduledAt: Date;
  durationMinutes: number;
  reason?: string;
  notes?: string;
  status: AppointmentStatus;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    scheduledAt: { type: Date, required: true, index: true },
    durationMinutes: { type: Number, default: 30, min: 5 },
    reason: String,
    notes: String,
    status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending', index: true }
  },
  { timestamps: true }
);

appointmentSchema.index({ doctor: 1, scheduledAt: 1 });
appointmentSchema.index({ patient: 1, scheduledAt: 1 });

export const AppointmentModel: Model<IAppointment> = mongoose.model<IAppointment>('Appointment', appointmentSchema);
