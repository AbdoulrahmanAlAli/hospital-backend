import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export interface IAuditLog extends Document {
  actor?: Types.ObjectId;
  action: string;
  entity: string;
  entityId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    action: { type: String, required: true, index: true },
    entity: { type: String, required: true, index: true },
    entityId: String,
    ip: String,
    userAgent: String,
    metadata: Schema.Types.Mixed
  },
  { timestamps: true }
);

export const AuditLogModel: Model<IAuditLog> = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
