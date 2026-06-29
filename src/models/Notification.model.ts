import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export type NotificationType = 'appointment' | 'test_result' | 'prescription' | 'administrative' | 'inventory';

export interface INotification extends Document {
  recipient: Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  sentAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['appointment', 'test_result', 'prescription', 'administrative', 'inventory'], required: true, index: true },
    read: { type: Boolean, default: false, index: true },
    sentAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, read: 1, sentAt: -1 });

export const NotificationModel: Model<INotification> = mongoose.model<INotification>('Notification', notificationSchema);
