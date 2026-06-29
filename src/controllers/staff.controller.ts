import { z } from 'zod';
import { Roles } from '../constants/roles';
import { StaffModel } from '../models/Staff.model';
import { UserModel } from '../models/User.model';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { buildSearchFilter, getPagination } from '../utils/query';
import { writeAuditLog } from '../middlewares/audit.middleware';

export const createStaffSchema = z.object({
  body: z.object({
    user: z.object({
      name: z.string().min(2),
      email: z.string().email(),
      phone: z.string().optional(),
      password: z.string().min(8),
      role: z.enum([Roles.ADMIN, Roles.STAFF]).optional()
    }),
    position: z.string().min(2),
    department: z.string().optional(),
    hireDate: z.string().datetime().optional()
  })
});

export const updateStaffSchema = z.object({
  body: z.object({
    position: z.string().min(2).optional(),
    department: z.string().optional(),
    hireDate: z.string().datetime().optional()
  })
});

export const listStaff = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = getPagination(req.query);
  const filter = buildSearchFilter(req.query.search, ['position', 'department']);
  const [items, total] = await Promise.all([
    StaffModel.find(filter).populate('user', '-password').sort(sort).skip(skip).limit(limit),
    StaffModel.countDocuments(filter)
  ]);
  return sendSuccess(res, { items, meta: { page, limit, total, pages: Math.ceil(total / limit) } }, 'Staff list');
});

export const getStaff = asyncHandler(async (req, res) => {
  const staff = await StaffModel.findById(req.params.id).populate('user', '-password');
  if (!staff) throw new ApiError(404, 'Staff not found');
  return sendSuccess(res, staff, 'Staff details');
});

export const createStaff = asyncHandler(async (req, res) => {
  const exists = await UserModel.exists({ email: req.body.user.email.toLowerCase() });
  if (exists) throw new ApiError(409, 'Email already exists');
  const role = req.body.user.role ?? Roles.STAFF;
  const user = await UserModel.create({ ...req.body.user, role });
  const staff = await StaffModel.create({ ...req.body, user: user._id });
  await writeAuditLog(req, 'create', 'Staff', staff._id.toString());
  const populated = await StaffModel.findById(staff._id).populate('user', '-password');
  return sendSuccess(res, populated, 'Staff created successfully', 201);
});

export const updateStaff = asyncHandler(async (req, res) => {
  const staff = await StaffModel.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('user', '-password');
  if (!staff) throw new ApiError(404, 'Staff not found');
  await writeAuditLog(req, 'update', 'Staff', req.params.id);
  return sendSuccess(res, staff, 'Staff updated successfully');
});

export const deleteStaff = asyncHandler(async (req, res) => {
  const staff = await StaffModel.findByIdAndDelete(req.params.id);
  if (!staff) throw new ApiError(404, 'Staff not found');
  await UserModel.findByIdAndUpdate(staff.user, { isActive: false });
  await writeAuditLog(req, 'delete', 'Staff', req.params.id);
  return sendSuccess(res, null, 'Staff deleted and user disabled successfully');
});
