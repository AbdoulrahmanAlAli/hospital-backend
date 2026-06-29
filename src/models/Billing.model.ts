import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export type PaymentStatus = 'paid' | 'unpaid';

export interface IBillingItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface IBilling extends Document {
  patient: Types.ObjectId;
  invoiceNumber: string;
  items: IBillingItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: PaymentStatus;
  paidAt?: Date;
  notes?: string;
}

const billingSchema = new Schema<IBilling>(
  {
    patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    items: [
      {
        description: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 }
      }
    ],
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['paid', 'unpaid'], default: 'unpaid', index: true },
    paidAt: Date,
    notes: String
  },
  { timestamps: true }
);

billingSchema.pre('validate', function calculateTotals(next) {
  this.subtotal = this.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  this.total = Math.max(this.subtotal - (this.discount ?? 0), 0);
  next();
});

export const BillingModel: Model<IBilling> = mongoose.model<IBilling>('Billing', billingSchema);
