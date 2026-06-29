import { z } from 'zod';
import { allRoles } from '../constants/roles';
import { UserModel } from '../models/User.model';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { buildSearchFilter, getPagination } from '../utils/query';
import { writeAuditLog } from '../middlewares/audit.middleware';

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    password: z.string().min(8),
    role: z.enum(allRoles as [string, ...string[]]),
    isActive: z.boolean().optional()
  })
});

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    password: z.string().min(8).optional(),
    role: z.enum(allRoles as [string, ...string[]]).optional(),
    isActive: z.boolean().optional()
  })
});

export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = getPagination(req.query);
  const filter = buildSearchFilter(req.query.search, ['name', 'email', 'phone']);
  const [items, total] = await Promise.all([
    UserModel.find(filter).select('-password').sort(sort).skip(skip).limit(limit),
    UserModel.countDocuments(filter)
  ]);
  return sendSuccess(res, { items, meta: { page, limit, total, pages: Math.ceil(total / limit) } }, 'Users list');
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.params.id).select('-password');
  if (!user) throw new ApiError(404, 'User not found');
  return sendSuccess(res, user, 'User details');
});

export const createUser = asyncHandler(async (req, res) => {
  const exists = await UserModel.exists({ email: req.body.email.toLowerCase() });
  if (exists) throw new ApiError(409, 'Email already exists');
  const user = await UserModel.create(req.body);
  await writeAuditLog(req, 'create', 'User', user._id.toString());
  const safeUser = await UserModel.findById(user._id).select('-password');
  return sendSuccess(res, safeUser, 'User created successfully', 201);
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.params.id).select('+password');
  if (!user) throw new ApiError(404, 'User not found');

  Object.assign(user, req.body);
  await user.save();
  await writeAuditLog(req, 'update', 'User', user._id.toString());

  const safeUser = await UserModel.findById(user._id).select('-password');
  return sendSuccess(res, safeUser, 'User updated successfully');
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await UserModel.findByIdAndDelete(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  await writeAuditLog(req, 'delete', 'User', req.params.id);
  return sendSuccess(res, null, 'User deleted successfully');
});
