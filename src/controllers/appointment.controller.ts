import { z } from 'zod';
import { Roles } from '../constants/roles';
import { AppointmentModel } from '../models/Appointment.model';
import { NotificationModel } from '../models/Notification.model';
import { PatientModel } from '../models/Patient.model';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { getPagination } from '../utils/query';
import { writeAuditLog } from '../middlewares/audit.middleware';

export const createAppointmentSchema = z.object({
  body: z.object({
    patient: z.string().min(10),
    doctor: z.string().min(10),
    scheduledAt: z.string().datetime(),
    durationMinutes: z.number().min(5).optional(),
    reason: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']).optional()
  })
});

export const updateAppointmentSchema = z.object({
  body: createAppointmentSchema.shape.body.partial()
});

const scopedAppointmentFilter = (req: any) => {
  if (req.user.role === Roles.DOCTOR) return { doctor: req.user.doctorId };
  if (req.user.role === Roles.PATIENT) return { patient: req.user.patientId };
  return {};
};

export const listAppointments = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = getPagination(req.query);
  const filter: Record<string, unknown> = { ...scopedAppointmentFilter(req) };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.doctor) filter.doctor = req.query.doctor;
  if (req.query.patient) filter.patient = req.query.patient;
  if (req.query.from || req.query.to) {
    filter.scheduledAt = {
      ...(req.query.from ? { $gte: new Date(String(req.query.from)) } : {}),
      ...(req.query.to ? { $lte: new Date(String(req.query.to)) } : {})
    };
  }

  const [items, total] = await Promise.all([
    AppointmentModel.find(filter).populate('patient').populate('doctor').sort(sort).skip(skip).limit(limit),
    AppointmentModel.countDocuments(filter)
  ]);

  return sendSuccess(res, { items, meta: { page, limit, total, pages: Math.ceil(total / limit) } }, 'Appointments list');
});

export const createAppointment = asyncHandler(async (req, res) => {
  const appointment = await AppointmentModel.create(req.body);
  const patient = await PatientModel.findById(req.body.patient).select('user');
  if (patient?.user) {
    await NotificationModel.create({
      recipient: patient.user,
      title: 'Appointment update',
      message: `A new appointment has been scheduled for ${new Date(req.body.scheduledAt).toLocaleString()}`,
      type: 'appointment'
    });
  }
  await writeAuditLog(req, 'create', 'Appointment', appointment._id.toString());
  return sendSuccess(res, appointment, 'Appointment created successfully', 201);
});

export const updateAppointment = asyncHandler(async (req, res) => {
  const appointment = await AppointmentModel.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!appointment) throw new ApiError(404, 'Appointment not found');
  await writeAuditLog(req, 'update', 'Appointment', req.params.id);
  return sendSuccess(res, appointment, 'Appointment updated successfully');
});

export const getAppointment = asyncHandler(async (req, res) => {
  const appointment = await AppointmentModel.findById(req.params.id).populate('patient').populate('doctor');
  if (!appointment) throw new ApiError(404, 'Appointment not found');

  if (req.user?.role === Roles.DOCTOR && appointment.doctor.toString() !== req.user.doctorId) throw new ApiError(403, 'Forbidden');
  if (req.user?.role === Roles.PATIENT && appointment.patient.toString() !== req.user.patientId) throw new ApiError(403, 'Forbidden');

  return sendSuccess(res, appointment, 'Appointment details');
});

export const deleteAppointment = asyncHandler(async (req, res) => {
  const appointment = await AppointmentModel.findByIdAndDelete(req.params.id);
  if (!appointment) throw new ApiError(404, 'Appointment not found');
  await writeAuditLog(req, 'delete', 'Appointment', req.params.id);
  return sendSuccess(res, null, 'Appointment deleted successfully');
});
