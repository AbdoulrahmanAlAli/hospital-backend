import path from 'path';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { Roles } from '../constants/roles';
import { MedicalTestModel } from '../models/MedicalTest.model';
import { PatientModel } from '../models/Patient.model';
import { NotificationModel } from '../models/Notification.model';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { decryptStoredFile, encryptAndStoreFile } from '../utils/fileCrypto';
import { ensureAssignedDoctorForPatient, ensureCanViewPatient, getPatientOrThrow } from '../services/patientAccess.service';
import { writeAuditLog } from '../middlewares/audit.middleware';

export const createMedicalTestSchema = z.object({
  body: z.object({
    title: z.string().min(2),
    type: z.string().min(2),
    resultSummary: z.string().optional(),
    status: z.enum(['requested', 'in_progress', 'completed', 'cancelled']).optional(),
    completedAt: z.string().datetime().optional()
  })
});

export const updateMedicalTestSchema = z.object({
  body: createMedicalTestSchema.shape.body.partial()
});

const doctorPopulate = {
  path: 'doctor',
  populate: { path: 'user', select: 'name email phone' }
};

export const listPatientTests = asyncHandler(async (req, res) => {
  await ensureCanViewPatient(req, req.params.patientId);
  const tests = await MedicalTestModel.find({ patient: req.params.patientId })
    .populate(doctorPopulate)
    .sort('-createdAt');
  return sendSuccess(res, tests, 'Patient medical tests');
});

export const createPatientTest = asyncHandler(async (req, res) => {
  await ensureAssignedDoctorForPatient(req, req.params.patientId);
  const test = await MedicalTestModel.create({
    ...req.body,
    patient: req.params.patientId,
    doctor: req.user?.doctorId
  });
  await writeAuditLog(req, 'create', 'MedicalTest', test._id.toString());
  const populated = await MedicalTestModel.findById(test._id).populate(doctorPopulate);
  return sendSuccess(res, populated, 'Medical test created successfully', 201);
});

export const updatePatientTest = asyncHandler(async (req, res) => {
  await ensureAssignedDoctorForPatient(req, req.params.patientId);
  const test = await MedicalTestModel.findOneAndUpdate(
    { _id: req.params.testId, patient: req.params.patientId, doctor: req.user?.doctorId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!test) throw new ApiError(404, 'Medical test not found');
  await writeAuditLog(req, 'update', 'MedicalTest', test._id.toString());
  const populated = await MedicalTestModel.findById(test._id).populate(doctorPopulate);
  return sendSuccess(res, populated, 'Medical test updated successfully');
});

export const uploadPatientTestPdf = asyncHandler(async (req, res) => {
  await ensureAssignedDoctorForPatient(req, req.params.patientId);
  if (!req.file) throw new ApiError(400, 'PDF file is required in field name: pdf');

  const patient = await getPatientOrThrow(req.params.patientId);
  const test = await MedicalTestModel.findOne({ _id: req.params.testId, patient: patient._id, doctor: req.user?.doctorId });
  if (!test) throw new ApiError(404, 'Medical test not found');

  const storedName = `${patient._id}-${test._id}-${nanoid(12)}.pdf.enc`;
  const encrypted = await encryptAndStoreFile({
    buffer: req.file.buffer,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    destinationDir: path.resolve(process.cwd(), 'storage', 'analysis'),
    storedName
  });

  test.pdfFile = {
    ...encrypted,
    uploadedBy: req.user!.userId as any,
    uploadedAt: new Date()
  };
  test.status = 'completed';
  test.completedAt = new Date();
  await test.save();

  if (patient.user) {
    await NotificationModel.create({
      recipient: patient.user,
      title: 'New medical analysis result',
      message: `Your medical analysis PDF is now available: ${test.title}`,
      type: 'test_result'
    });
  }

  await writeAuditLog(req, 'upload_pdf', 'MedicalTest', test._id.toString(), { encrypted: true, originalName: req.file.originalname });
  const populated = await MedicalTestModel.findById(test._id).populate(doctorPopulate);
  return sendSuccess(res, populated, 'Encrypted analysis PDF uploaded successfully');
});

export const viewPatientTestPdf = asyncHandler(async (req, res) => {
  await ensureCanViewPatient(req, req.params.patientId);
  const test = await MedicalTestModel.findOne({ _id: req.params.testId, patient: req.params.patientId });
  if (!test) throw new ApiError(404, 'Medical test not found');
  if (!test.pdfFile) throw new ApiError(404, 'No PDF file is attached to this test');

  if (req.user?.role === Roles.DOCTOR && test.doctor.toString() !== req.user.doctorId) {
    throw new ApiError(403, 'Only the assigned doctor can view this doctor-owned test PDF');
  }

  const decrypted = await decryptStoredFile({
    storedPath: test.pdfFile.storedPath,
    iv: test.pdfFile.iv,
    authTag: test.pdfFile.authTag
  });

  await writeAuditLog(req, 'view_pdf', 'MedicalTest', test._id.toString());

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(test.pdfFile.originalName || 'analysis.pdf')}"`);
  res.send(decrypted);
});

export const deletePatientTest = asyncHandler(async (req, res) => {
  await ensureAssignedDoctorForPatient(req, req.params.patientId);
  const test = await MedicalTestModel.findOneAndDelete({ _id: req.params.testId, patient: req.params.patientId, doctor: req.user?.doctorId });
  if (!test) throw new ApiError(404, 'Medical test not found');
  await writeAuditLog(req, 'delete', 'MedicalTest', req.params.testId);
  return sendSuccess(res, null, 'Medical test deleted successfully');
});
