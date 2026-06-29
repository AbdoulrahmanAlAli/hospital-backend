import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IMedicine extends Document {
  name: string;
  code?: string;
  category?: string;
  manufacturer?: string;
  description?: string;
  unit: string;
  active: boolean;
}

const medicineSchema = new Schema<IMedicine>(
  {
    name: { type: String, required: true, trim: true, index: true },
    code: { type: String, trim: true, unique: true, sparse: true },
    category: { type: String, trim: true, index: true },
    manufacturer: String,
    description: String,
    unit: { type: String, default: 'box' },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const MedicineModel: Model<IMedicine> = mongoose.model<IMedicine>('Medicine', medicineSchema);
