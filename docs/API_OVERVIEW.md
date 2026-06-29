# API Overview

## Authentication

### Login
`POST /api/v1/auth/login`

Body:
```json
{
  "email": "manager@hospital.local",
  "password": "Admin@123456"
}
```

### Refresh Token
`POST /api/v1/auth/refresh`

Body:
```json
{
  "refreshToken": "..."
}
```

## Patient Analysis PDF Flow

1. Staff/Admin creates patient and assigns a doctor.
2. Assigned doctor creates a medical test:
   `POST /api/v1/patients/:patientId/tests`
3. Assigned doctor uploads PDF:
   `POST /api/v1/patients/:patientId/tests/:testId/pdf`
4. Frontend displays PDF using:
   `GET /api/v1/patients/:patientId/tests/:testId/pdf`

## Upload Rule

Only the assigned doctor can upload or update patient analysis files. This is enforced in:

- `ensureAssignedDoctorForPatient`
- `uploadPatientTestPdf`
- `updatePatientTest`
- `createPatientTest`

## File Encryption

PDF files are encrypted using AES-256-GCM and saved under:

```text
storage/analysis
```

The database stores only metadata:

- stored path
- iv
- authTag
- original name
- uploader
- upload date

## Password Security

Passwords are hashed with bcrypt using 12 salt rounds in `src/utils/password.ts`.
