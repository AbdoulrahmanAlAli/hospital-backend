export const StaffRoles = {
  DOCTOR_ASSISTANT: 'doctor_assistant',
  RECEPTIONIST: 'receptionist',
  CLEANER: 'cleaner',
  DATA_ENTRY: 'data_entry',
  ACCOUNTANT: 'accountant',
  NURSE: 'nurse',
  PHARMACIST: 'pharmacist',
  LAB_STAFF: 'lab_staff',
  ADMIN_ASSISTANT: 'admin_assistant',
  OTHER: 'other'
} as const;

export type StaffRole = (typeof StaffRoles)[keyof typeof StaffRoles];

export const staffRoleValues = Object.values(StaffRoles) as [StaffRole, ...StaffRole[]];
