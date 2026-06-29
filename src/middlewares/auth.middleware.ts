import type { NextFunction, Request, Response } from 'express';
import { DoctorModel } from '../models/Doctor.model';
import { PatientModel } from '../models/Patient.model';
import { UserModel } from '../models/User.model';
import { ApiError } from '../utils/ApiError';
import { verifyAccessToken } from '../utils/jwt';
import { Roles } from '../constants/roles';

export const authenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication token is required');
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);
    const user = await UserModel.findById(payload.sub).select('_id email role isActive');

    if (!user || !user.isActive) {
      throw new ApiError(401, 'Invalid or inactive user');
    }

    req.user = {
      userId: user._id.toString(),
      role: user.role,
      email: user.email
    };

    if (user.role === Roles.DOCTOR) {
      const doctor = await DoctorModel.findOne({ user: user._id }).select('_id');
      if (doctor) req.user.doctorId = doctor._id.toString();
    }

    if (user.role === Roles.PATIENT) {
      const patient = await PatientModel.findOne({ user: user._id }).select('_id');
      if (patient) req.user.patientId = patient._id.toString();
    }

    next();
  } catch (error) {
    next(error);
  }
};
