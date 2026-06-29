import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export interface IStaff extends Document {
  user: Types.ObjectId;
  position: string;
  department?: string;
  hireDate?: Date;
}

const staffSchema = new Schema<IStaff>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    position: { type: String, required: true, trim: true },
    department: { type: String, trim: true },
    hireDate: Date
  },
  { timestamps: true }
);

export const StaffModel: Model<IStaff> = mongoose.model<IStaff>('Staff', staffSchema);
