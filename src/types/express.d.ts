import type { Role } from '../constants/roles';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: Role;
        email: string;
        doctorId?: string;
        patientId?: string;
      };
    }
  }
}

export {};
