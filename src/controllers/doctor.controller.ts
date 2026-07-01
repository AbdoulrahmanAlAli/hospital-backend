import { z } from 'zod';
import { Roles } from '../constants/roles';
import { DoctorModel } from '../models/Doctor.model';
import { UserModel } from '../models/User.model';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { buildSearchFilter, getPagination } from '../utils/query';
import { writeAuditLog } from '../middlewares/audit.middleware';

const editableUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(8).optional(),
  isActive: z.boolean().optional()
});

const userFieldNames = ['name', 'email', 'phone', 'password', 'isActive'] as const;
const doctorFieldNames = ['specialization', 'licenseNumber', 'roomNumber', 'biography', 'available'] as const;

const pickDefined = <T extends readonly string[]>(source: Record<string, unknown>, fields: T): Partial<Record<T[number], unknown>> => {
  const picked: Record<string, unknown> = {};
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(source, field) && source[field] !== undefined) {
      picked[field] = source[field];
    }
  }
  return picked as Partial<Record<T[number], unknown>>;
};

export const createDoctorSchema = z.object({
  body: z.object({
    user: z.object({
      name: z.string().min(2),
      email: z.string().email(),
      phone: z.string().optional(),
      password: z.string().min(8)
    }),
    specialization: z.string().min(2),
    licenseNumber: z.string().optional(),
    roomNumber: z.string().optional(),
    biography: z.string().optional(),
    available: z.boolean().optional()
  })
});

export const updateDoctorSchema = z.object({
  body: z.object({
    user: editableUserSchema.optional(),
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    password: z.string().min(8).optional(),
    isActive: z.boolean().optional(),
    specialization: z.string().min(2).optional(),
    licenseNumber: z.string().optional(),
    roomNumber: z.string().optional(),
    biography: z.string().optional(),
    available: z.boolean().optional()
  })
});

export const listDoctors = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = getPagination(req.query);
  const filter = buildSearchFilter(req.query.search, ['specialization', 'licenseNumber', 'roomNumber']);
  const [items, total] = await Promise.all([
    DoctorModel.find(filter).populate('user', '-password').sort(sort).skip(skip).limit(limit),
    DoctorModel.countDocuments(filter)
  ]);
  return sendSuccess(res, { items, meta: { page, limit, total, pages: Math.ceil(total / limit) } }, 'Doctors list');
});

export const getDoctor = asyncHandler(async (req, res) => {
  const doctor = await DoctorModel.findById(req.params.id).populate('user', '-password');
  if (!doctor) throw new ApiError(404, 'Doctor not found');
  return sendSuccess(res, doctor, 'Doctor details');
});

export const createDoctor = asyncHandler(async (req, res) => {
  const exists = await UserModel.exists({ email: req.body.user.email.toLowerCase() });
  if (exists) throw new ApiError(409, 'Email already exists');

  const user = await UserModel.create({ ...req.body.user, role: Roles.DOCTOR });
  const doctor = await DoctorModel.create({ ...req.body, user: user._id });
  await writeAuditLog(req, 'create', 'Doctor', doctor._id.toString());
  const populated = await DoctorModel.findById(doctor._id).populate('user', '-password');
  return sendSuccess(res, populated, 'Doctor created successfully', 201);
});

export const updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await DoctorModel.findById(req.params.id);
  if (!doctor) throw new ApiError(404, 'Doctor not found');

  const body = req.body as Record<string, unknown>;
  const doctorUpdates = pickDefined(body, doctorFieldNames);

  const nestedUserUpdates = typeof body.user === 'object' && body.user !== null
    ? (body.user as Record<string, unknown>)
    : {};
  const directUserUpdates = pickDefined(body, userFieldNames);
  const userUpdates = { ...nestedUserUpdates, ...directUserUpdates };

  if (Object.keys(doctorUpdates).length === 0 && Object.keys(userUpdates).length === 0) {
    throw new ApiError(400, 'No valid doctor or linked user fields were provided for update');
  }

  if (Object.keys(doctorUpdates).length > 0) {
    doctor.set(doctorUpdates);
    await doctor.save();
  }

  if (Object.keys(userUpdates).length > 0) {
    const user = await UserModel.findById(doctor.user).select('+password');
    if (!user) throw new ApiError(404, 'Linked user account not found');
    Object.assign(user, userUpdates);
    await user.save();
  }

  await writeAuditLog(req, 'update', 'Doctor', req.params.id);
  const populated = await DoctorModel.findById(doctor._id).populate('user', '-password');
  return sendSuccess(res, populated, 'Doctor updated successfully');
});

export const deleteDoctor = asyncHandler(async (req, res) => {
  const doctor = await DoctorModel.findByIdAndDelete(req.params.id);
  if (!doctor) throw new ApiError(404, 'Doctor not found');
  await UserModel.findByIdAndUpdate(doctor.user, { isActive: false });
  await writeAuditLog(req, 'delete', 'Doctor', req.params.id);
  return sendSuccess(res, null, 'Doctor deleted and user disabled successfully');
});
