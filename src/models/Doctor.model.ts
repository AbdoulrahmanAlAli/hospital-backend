import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export interface IDoctor extends Document {
  user: Types.ObjectId;
  specialization: string;
  licenseNumber?: string;
  roomNumber?: string;
  biography?: string;
  available: boolean;
}

const doctorSchema = new Schema<IDoctor>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    specialization: { type: String, required: true, trim: true, index: true },
    licenseNumber: { type: String, trim: true },
    roomNumber: { type: String, trim: true },
    biography: { type: String, trim: true },
    available: { type: Boolean, default: true }
  },
  { timestamps: true }
);

doctorSchema.virtual('name').get(function () {
  const user = this.user as any;
  return user && typeof user === 'object' ? user.name : undefined;
});

doctorSchema.virtual('email').get(function () {
  const user = this.user as any;
  return user && typeof user === 'object' ? user.email : undefined;
});

doctorSchema.virtual('phone').get(function () {
  const user = this.user as any;
  return user && typeof user === 'object' ? user.phone : undefined;
});

doctorSchema.set('toJSON', { virtuals: true });
doctorSchema.set('toObject', { virtuals: true });

doctorSchema.index({ specialization: 1, available: 1 });

export const DoctorModel: Model<IDoctor> = mongoose.model<IDoctor>('Doctor', doctorSchema);
