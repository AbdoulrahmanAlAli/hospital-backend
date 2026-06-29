import type { Request } from 'express';
import { AuditLogModel } from '../models/AuditLog.model';

export const writeAuditLog = async (req: Request, action: string, entity: string, entityId?: string, metadata?: Record<string, unknown>): Promise<void> => {
  try {
    await AuditLogModel.create({
      actor: req.user?.userId,
      action,
      entity,
      entityId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      metadata
    });
  } catch {
    // Audit logging must not break the main business flow.
  }
};
