import { z } from 'zod';
import { Roles } from '../constants/roles';
import { PatientModel } from '../models/Patient.model';
import { UserModel } from '../models/User.model';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { buildSearchFilter, getPagination } from '../utils/query';
import { ensureCanViewPatient } from '../services/patientAccess.service';
import { writeAuditLog } from '../middlewares/audit.middleware';

export const createPatientSchema = z.object({
  body: z.object({
    userAccount: z
      .object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(2).optional(),
        phone: z.string().optional()
      })
      .optional(),
    fullName: z.string().min(2),
    nationalId: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    gender: z.enum(['male', 'female', 'other']),
    birthDate: z.string().datetime().optional(),
    address: z.string().optional(),
    bloodType: z.string().optional(),
    assignedDoctor: z.string().min(10),
    allergies: z.array(z.string()).optional(),
    chronicDiseases: z.array(z.string()).optional(),
    emergencyContact: z
      .object({ name: z.string().optional(), phone: z.string().optional(), relation: z.string().optional() })
      .optional()
  })
});

export const updatePatientSchema = z.object({
  body: createPatientSchema.shape.body.omit({ userAccount: true }).partial()
});


const assignedDoctorPopulate = {
  path: 'assignedDoctor',
  populate: { path: 'user', select: 'name email phone' }
};

const scopedPatientFilter = (req: any) => {
  if (req.user.role === Roles.DOCTOR) return { assignedDoctor: req.user.doctorId };
  if (req.user.role === Roles.PATIENT) return { _id: req.user.patientId };
  return {};
};

export const listPatients = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = getPagination(req.query);
  const searchFilter = buildSearchFilter(req.query.search, ['fullName', 'phone', 'nationalId', 'email']);
  const filter = { ...searchFilter, ...scopedPatientFilter(req), archived: req.query.archived === 'true' ? true : false };
  const [items, total] = await Promise.all([
    PatientModel.find(filter).populate(assignedDoctorPopulate).sort(sort).skip(skip).limit(limit),
    PatientModel.countDocuments(filter)
  ]);
  return sendSuccess(res, { items, meta: { page, limit, total, pages: Math.ceil(total / limit) } }, 'Patients list');
});

export const getPatient = asyncHandler(async (req, res) => {
  await ensureCanViewPatient(req, req.params.id);
  const patient = await PatientModel.findById(req.params.id).populate(assignedDoctorPopulate).populate('user', '-password');
  if (!patient) throw new ApiError(404, 'Patient not found');
  return sendSuccess(res, patient, 'Patient details');
});

export const createPatient = asyncHandler(async (req, res) => {
  let userId;
  if (req.body.userAccount) {
    const exists = await UserModel.exists({ email: req.body.userAccount.email.toLowerCase() });
    if (exists) throw new ApiError(409, 'Patient user email already exists');
    const user = await UserModel.create({
      name: req.body.userAccount.name ?? req.body.fullName,
      email: req.body.userAccount.email,
      phone: req.body.userAccount.phone ?? req.body.phone,
      password: req.body.userAccount.password,
      role: Roles.PATIENT
    });
    userId = user._id;
  }

  const patient = await PatientModel.create({ ...req.body, user: userId });
  await writeAuditLog(req, 'create', 'Patient', patient._id.toString());
  const populated = await PatientModel.findById(patient._id).populate(assignedDoctorPopulate).populate('user', '-password');
  return sendSuccess(res, populated, 'Patient created successfully', 201);
});

export const updatePatient = asyncHandler(async (req, res) => {
  await ensureCanViewPatient(req, req.params.id);
  if (req.user?.role === Roles.PATIENT) throw new ApiError(403, 'Patients cannot update medical profile directly');
  const patient = await PatientModel.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!patient) throw new ApiError(404, 'Patient not found');
  await writeAuditLog(req, 'update', 'Patient', req.params.id);
  const populated = await PatientModel.findById(patient._id).populate(assignedDoctorPopulate).populate('user', '-password');
  return sendSuccess(res, populated, 'Patient updated successfully');
});

export const archivePatient = asyncHandler(async (req, res) => {
  const patient = await PatientModel.findByIdAndUpdate(req.params.id, { archived: true }, { new: true });
  if (!patient) throw new ApiError(404, 'Patient not found');
  await writeAuditLog(req, 'archive', 'Patient', req.params.id);
  const populated = await PatientModel.findById(patient._id).populate(assignedDoctorPopulate).populate('user', '-password');
  return sendSuccess(res, populated, 'Patient archived successfully');
});

export const deletePatient = asyncHandler(async (req, res) => {
  const patient = await PatientModel.findByIdAndDelete(req.params.id);
  if (!patient) throw new ApiError(404, 'Patient not found');
  await writeAuditLog(req, 'delete', 'Patient', req.params.id);
  return sendSuccess(res, null, 'Patient deleted successfully');
});
