import { z } from 'zod';
import { Roles } from '../constants/roles';
import { NotificationModel } from '../models/Notification.model';
import { UserModel } from '../models/User.model';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { getPagination } from '../utils/query';
import { writeAuditLog } from '../middlewares/audit.middleware';

const notificationTypes = ['appointment', 'test_result', 'prescription', 'administrative', 'inventory'] as const;
const targetTypes = ['user', 'users', 'role'] as const;
const targetRoles = [Roles.MANAGER, Roles.ADMIN, Roles.STAFF, Roles.DOCTOR, Roles.PATIENT] as const;

const inferTargetType = (body: {
  targetType?: (typeof targetTypes)[number];
  recipient?: string;
  recipients?: string[];
  role?: (typeof targetRoles)[number];
}) => body.targetType ?? (body.role ? 'role' : body.recipients ? 'users' : 'user');

export const createNotificationSchema = z.object({
  body: z.object({
    targetType: z.enum(targetTypes).optional(),
    recipient: z.string().min(10).optional(),
    recipients: z.array(z.string().min(10)).min(1).optional(),
    role: z.enum(targetRoles).optional(),
    title: z.string().min(2),
    message: z.string().min(2),
    type: z.enum(notificationTypes)
  }).superRefine((body, ctx) => {
    const targetType = inferTargetType(body);

    if (targetType === 'user' && !body.recipient) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['recipient'], message: 'recipient is required when targetType is user' });
    }

    if (targetType === 'users' && (!body.recipients || body.recipients.length === 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['recipients'], message: 'recipients is required when targetType is users' });
    }

    if (targetType === 'role' && !body.role) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['role'], message: 'role is required when targetType is role' });
    }
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
  const body = req.body as {
    targetType?: 'user' | 'users' | 'role';
    recipient?: string;
    recipients?: string[];
    role?: (typeof targetRoles)[number];
    title: string;
    message: string;
    type: (typeof notificationTypes)[number];
  };

  const targetType = inferTargetType(body);
  const payload = {
    title: body.title,
    message: body.message,
    type: body.type
  };

  if (targetType === 'role') {
    if (![Roles.MANAGER, Roles.ADMIN].includes(req.user?.role as any)) {
      throw new ApiError(403, 'Only manager or admin can send notifications to a full role');
    }

    const recipients = await UserModel.find({ role: body.role, isActive: true }).select('_id').lean();
    const docs = recipients.map((user) => ({ recipient: user._id, ...payload }));
    const notifications = docs.length > 0 ? await NotificationModel.insertMany(docs) : [];

    await writeAuditLog(req, 'create_bulk', 'Notification', undefined, {
      targetType,
      role: body.role,
      total: notifications.length
    });

    return sendSuccess(
      res,
      {
        targetType,
        role: body.role,
        total: notifications.length,
        items: notifications
      },
      'Notifications sent successfully',
      201
    );
  }

  if (targetType === 'users') {
    const uniqueRecipients = Array.from(new Set(body.recipients ?? []));
    const users = await UserModel.find({ _id: { $in: uniqueRecipients }, isActive: true }).select('_id').lean();
    if (users.length === 0) throw new ApiError(404, 'No active recipients were found');

    const docs = users.map((user) => ({ recipient: user._id, ...payload }));
    const notifications = await NotificationModel.insertMany(docs);

    await writeAuditLog(req, 'create_bulk', 'Notification', undefined, {
      targetType,
      requestedRecipients: uniqueRecipients.length,
      total: notifications.length
    });

    return sendSuccess(
      res,
      {
        targetType,
        total: notifications.length,
        items: notifications
      },
      'Notifications sent successfully',
      201
    );
  }

  const recipientExists = await UserModel.exists({ _id: body.recipient, isActive: true });
  if (!recipientExists) throw new ApiError(404, 'Recipient user not found or inactive');

  const notification = await NotificationModel.create({ recipient: body.recipient, ...payload });
  await writeAuditLog(req, 'create', 'Notification', notification._id.toString(), { targetType: 'user' });
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
