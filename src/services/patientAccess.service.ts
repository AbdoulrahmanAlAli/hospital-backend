import type { Request } from 'express';
import { Types } from 'mongoose';
import { Roles } from '../constants/roles';
import { PatientModel } from '../models/Patient.model';
import { ApiError } from '../utils/ApiError';

export const getPatientOrThrow = async (patientId: string) => {
  if (!Types.ObjectId.isValid(patientId)) throw new ApiError(400, 'Invalid patient id');
  const patient = await PatientModel.findById(patientId);
  if (!patient) throw new ApiError(404, 'Patient not found');
  return patient;
};

export const ensureCanViewPatient = async (req: Request, patientId: string): Promise<void> => {
  if (!req.user) throw new ApiError(401, 'Authentication required');
  const patient = await getPatientOrThrow(patientId);

  if ([Roles.MANAGER, Roles.ADMIN, Roles.STAFF].includes(req.user.role as any)) return;
  if (req.user.role === Roles.DOCTOR && req.user.doctorId === patient.assignedDoctor.toString()) return;
  if (req.user.role === Roles.PATIENT && req.user.patientId === patient._id.toString()) return;

  throw new ApiError(403, 'You do not have permission to access this patient');
};


export const ensureCanViewPatientMedicalTests = async (req: Request, patientId: string): Promise<void> => {
  if (!req.user) throw new ApiError(401, 'Authentication required');
  const patient = await getPatientOrThrow(patientId);

  if (req.user.role === Roles.DOCTOR && req.user.doctorId === patient.assignedDoctor.toString()) return;
  if (req.user.role === Roles.PATIENT && req.user.patientId === patient._id.toString()) return;

  throw new ApiError(403, 'Only the assigned doctor or the patient can view medical tests');
};

export const ensureAssignedDoctorForPatient = async (req: Request, patientId: string): Promise<void> => {
  if (!req.user) throw new ApiError(401, 'Authentication required');
  if (req.user.role !== Roles.DOCTOR || !req.user.doctorId) {
    throw new ApiError(403, 'Only the assigned doctor can perform this action');
  }

  const patient = await getPatientOrThrow(patientId);
  if (patient.assignedDoctor.toString() !== req.user.doctorId) {
    throw new ApiError(403, 'Only the assigned doctor of this patient can upload or modify analysis files');
  }
};
