import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export interface IPrescriptionMedicine {
  medicine?: Types.ObjectId;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface IPrescription extends Document {
  patient: Types.ObjectId;
  doctor: Types.ObjectId;
  diagnosis?: string;
  medicines: IPrescriptionMedicine[];
  notes?: string;
  issuedAt: Date;
}

const prescriptionSchema = new Schema<IPrescription>(
  {
    patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    diagnosis: String,
    medicines: [
      {
        medicine: { type: Schema.Types.ObjectId, ref: 'Medicine' },
        name: { type: String, required: true },
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
        duration: { type: String, required: true },
        instructions: String
      }
    ],
    notes: String,
    issuedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

prescriptionSchema.index({ patient: 1, issuedAt: -1 });

export const PrescriptionModel: Model<IPrescription> = mongoose.model<IPrescription>('Prescription', prescriptionSchema);
