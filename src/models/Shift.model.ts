import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export interface IShift extends Document {
  doctor: Types.ObjectId;
  startsAt: Date;
  endsAt: Date;
  department?: string;
  notes?: string;
}

const shiftSchema = new Schema<IShift>(
  {
    doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    startsAt: { type: Date, required: true, index: true },
    endsAt: { type: Date, required: true },
    department: String,
    notes: String
  },
  { timestamps: true }
);

shiftSchema.index({ doctor: 1, startsAt: 1 });

export const ShiftModel: Model<IShift> = mongoose.model<IShift>('Shift', shiftSchema);
