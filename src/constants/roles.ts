export const Roles = {
  MANAGER: 'manager',
  ADMIN: 'admin',
  STAFF: 'staff',
  DOCTOR: 'doctor',
  PATIENT: 'patient'
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];

export const allRoles = Object.values(Roles);
export const managementRoles: Role[] = [Roles.MANAGER, Roles.ADMIN];
export const staffRoles: Role[] = [Roles.MANAGER, Roles.ADMIN, Roles.STAFF];
export const medicalRoles: Role[] = [Roles.MANAGER, Roles.ADMIN, Roles.STAFF, Roles.DOCTOR];
