import { z } from 'zod';
import type { FilterQuery } from 'mongoose';
import { Roles } from '../constants/roles';
import { PrescriptionModel, type IPrescription } from '../models/Prescription.model';
import { NotificationModel } from '../models/Notification.model';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { getPagination } from '../utils/query';
import { ensureAssignedDoctorForPatient, ensureCanViewPatient, getPatientOrThrow } from '../services/patientAccess.service';
import { writeAuditLog } from '../middlewares/audit.middleware';

const prescriptionBodySchema = z.object({
    diagnosis: z.string().optional(),
    medicines: z
      .array(
        z.object({
          medicine: z.string().optional(),
          name: z.string().min(1),
          dosage: z.string().min(1),
          frequency: z.string().min(1),
          duration: z.string().min(1),
          instructions: z.string().optional()
        })
      )
      .min(1),
    notes: z.string().optional()
});

export const createPrescriptionSchema = z.object({ body: prescriptionBodySchema });
export const updatePrescriptionSchema = z.object({ body: prescriptionBodySchema.partial() });

const prescriptionPopulate = [
  {
    path: 'patient',
    populate: { path: 'user', select: 'name email phone' }
  },
  {
    path: 'doctor',
    populate: { path: 'user', select: 'name email phone' }
  },
  { path: 'medicines.medicine' }
];

const applyQueryFilters = (filter: FilterQuery<IPrescription>, query: Record<string, unknown>) => {
  if (typeof query.patient === 'string' && query.patient.trim()) {
    filter.patient = query.patient.trim();
  }

  if (typeof query.doctor === 'string' && query.doctor.trim()) {
    filter.doctor = query.doctor.trim();
  }

  const issuedAt: Record<string, Date> = {};
  if (typeof query.from === 'string' && query.from.trim()) {
    issuedAt.$gte = new Date(query.from);
  }
  if (typeof query.to === 'string' && query.to.trim()) {
    issuedAt.$lte = new Date(query.to);
  }
  if (Object.keys(issuedAt).length > 0) {
    filter.issuedAt = issuedAt;
  }
};

const populatePrescriptionQuery = <T extends { populate: (path: any) => T }>(query: T): T => {
  let populated = query;
  for (const populateOption of prescriptionPopulate) {
    populated = populated.populate(populateOption);
  }
  return populated;
};

export const listPrescriptions = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, 'Authentication required');

  const sortValue = typeof req.query.sort === 'string' ? req.query.sort : '-issuedAt';
  const { page, limit, skip, sort } = getPagination({ page: req.query.page as any, limit: req.query.limit as any, sort: sortValue });
  const filter: FilterQuery<IPrescription> = {};

  if ([Roles.MANAGER, Roles.ADMIN, Roles.STAFF].includes(req.user.role as any)) {
    applyQueryFilters(filter, req.query as Record<string, unknown>);
  } else if (req.user.role === Roles.DOCTOR && req.user.doctorId) {
    filter.doctor = req.user.doctorId;
    if (typeof req.query.patient === 'string' && req.query.patient.trim()) {
      filter.patient = req.query.patient.trim();
    }
  } else if (req.user.role === Roles.PATIENT && req.user.patientId) {
    filter.patient = req.user.patientId;
  } else {
    throw new ApiError(403, 'You do not have permission to view prescriptions');
  }

  const [items, total] = await Promise.all([
    populatePrescriptionQuery(PrescriptionModel.find(filter)).sort(sort).skip(skip).limit(limit),
    PrescriptionModel.countDocuments(filter)
  ]);

  return sendSuccess(
    res,
    { items, meta: { page, limit, total, pages: Math.ceil(total / limit) } },
    'Prescriptions list'
  );
});

export const getPrescription = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, 'Authentication required');

  const prescription = await PrescriptionModel.findById(req.params.id);
  if (!prescription) throw new ApiError(404, 'Prescription not found');

  if ([Roles.MANAGER, Roles.ADMIN, Roles.STAFF].includes(req.user.role as any)) {
    // Management and staff roles can view any prescription.
  } else if (req.user.role === Roles.DOCTOR && req.user.doctorId === prescription.doctor.toString()) {
    // Doctors can view only their own prescriptions.
  } else if (req.user.role === Roles.PATIENT && req.user.patientId === prescription.patient.toString()) {
    // Patients can view only prescriptions linked to their own patient profile.
  } else {
    throw new ApiError(403, 'You do not have permission to view this prescription');
  }

  const populated = await populatePrescriptionQuery(PrescriptionModel.findById(prescription._id));
  return sendSuccess(res, populated, 'Prescription details');
});

export const listPatientPrescriptions = asyncHandler(async (req, res) => {
  await ensureCanViewPatient(req, req.params.patientId);
  const items = await PrescriptionModel.find({ patient: req.params.patientId }).populate('doctor').populate('medicines.medicine').sort('-issuedAt');
  return sendSuccess(res, items, 'Patient prescriptions');
});

export const createPatientPrescription = asyncHandler(async (req, res) => {
  await ensureAssignedDoctorForPatient(req, req.params.patientId);
  const patient = await getPatientOrThrow(req.params.patientId);
  const prescription = await PrescriptionModel.create({ ...req.body, patient: patient._id, doctor: req.user?.doctorId });

  if (patient.user) {
    await NotificationModel.create({
      recipient: patient.user,
      title: 'New prescription',
      message: 'A new prescription has been added to your medical file.',
      type: 'prescription'
    });
  }

  await writeAuditLog(req, 'create', 'Prescription', prescription._id.toString());
  return sendSuccess(res, prescription, 'Prescription created successfully', 201);
});

export const updatePatientPrescription = asyncHandler(async (req, res) => {
  await ensureAssignedDoctorForPatient(req, req.params.patientId);
  const prescription = await PrescriptionModel.findOneAndUpdate(
    { _id: req.params.prescriptionId, patient: req.params.patientId, doctor: req.user?.doctorId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!prescription) throw new ApiError(404, 'Prescription not found');
  await writeAuditLog(req, 'update', 'Prescription', prescription._id.toString());
  return sendSuccess(res, prescription, 'Prescription updated successfully');
});

export const deletePatientPrescription = asyncHandler(async (req, res) => {
  await ensureAssignedDoctorForPatient(req, req.params.patientId);
  const prescription = await PrescriptionModel.findOneAndDelete({ _id: req.params.prescriptionId, patient: req.params.patientId, doctor: req.user?.doctorId });
  if (!prescription) throw new ApiError(404, 'Prescription not found');
  await writeAuditLog(req, 'delete', 'Prescription', req.params.prescriptionId);
  return sendSuccess(res, null, 'Prescription deleted successfully');
});
