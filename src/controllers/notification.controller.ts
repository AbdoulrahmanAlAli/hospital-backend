import { z } from 'zod';
import { NotificationModel } from '../models/Notification.model';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { getPagination } from '../utils/query';
import { writeAuditLog } from '../middlewares/audit.middleware';

export const createNotificationSchema = z.object({
  body: z.object({
    recipient: z.string().min(10),
    title: z.string().min(2),
    message: z.string().min(2),
    type: z.enum(['appointment', 'test_result', 'prescription', 'administrative', 'inventory'])
  })
});

export const listMyNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = getPagination(req.query);
  const filter: Record<string, unknown> = { recipient: req.user?.userId };
  if (req.query.read === 'true') filter.read = true;
  if (req.query.read === 'false') filter.read = false;

  const [items, total] = await Promise.all([
    NotificationModel.find(filter).sort(sort).skip(skip).limit(limit),
    NotificationModel.countDocuments(filter)
  ]);
  return sendSuccess(res, { items, meta: { page, limit, total, pages: Math.ceil(total / limit) } }, 'My notifications');
});

export const createNotification = asyncHandler(async (req, res) => {
  const notification = await NotificationModel.create(req.body);
  await writeAuditLog(req, 'create', 'Notification', notification._id.toString());
  return sendSuccess(res, notification, 'Notification created successfully', 201);
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await NotificationModel.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user?.userId },
    { read: true },
    { new: true }
  );
  if (!notification) throw new ApiError(404, 'Notification not found');
  return sendSuccess(res, notification, 'Notification marked as read');
});
