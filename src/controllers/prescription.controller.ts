import { z } from 'zod';
import { PrescriptionModel } from '../models/Prescription.model';
import { NotificationModel } from '../models/Notification.model';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
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
