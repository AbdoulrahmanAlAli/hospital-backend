import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type EquipmentStatus = 'available' | 'in_use' | 'maintenance' | 'retired';

export interface IEquipment extends Document {
  name: string;
  code?: string;
  category?: string;
  quantity: number;
  availableQuantity: number;
  status: EquipmentStatus;
  location?: string;
  notes?: string;
}

const equipmentSchema = new Schema<IEquipment>(
  {
    name: { type: String, required: true, trim: true, index: true },
    code: { type: String, trim: true, unique: true, sparse: true },
    category: { type: String, trim: true, index: true },
    quantity: { type: Number, default: 1, min: 0 },
    availableQuantity: { type: Number, default: 1, min: 0 },
    status: { type: String, enum: ['available', 'in_use', 'maintenance', 'retired'], default: 'available', index: true },
    location: String,
    notes: String
  },
  { timestamps: true }
);

export const EquipmentModel: Model<IEquipment> = mongoose.model<IEquipment>('Equipment', equipmentSchema);
