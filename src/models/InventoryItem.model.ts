import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export interface IInventoryItem extends Document {
  medicine: Types.ObjectId;
  quantity: number;
  minimumQuantity: number;
  batchNumber?: string;
  expiryDate?: Date;
  location?: string;
}

const inventoryItemSchema = new Schema<IInventoryItem>(
  {
    medicine: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true, index: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    minimumQuantity: { type: Number, min: 0, default: 10 },
    batchNumber: String,
    expiryDate: Date,
    location: String
  },
  { timestamps: true }
);

inventoryItemSchema.index({ medicine: 1, batchNumber: 1 });

export const InventoryItemModel: Model<IInventoryItem> = mongoose.model<IInventoryItem>('InventoryItem', inventoryItemSchema);
