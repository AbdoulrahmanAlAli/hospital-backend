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


## Staff Roles

Staff records support a `staffRole` field in addition to the main user role `staff`. You can also filter staff list using `GET /api/v1/staff?staffRole=receptionist`.

Allowed values:

- `doctor_assistant`
- `receptionist`
- `cleaner`
- `data_entry`
- `accountant`
- `nurse`
- `pharmacist`
- `lab_staff`
- `admin_assistant`
- `other`

Example create/update body:

```json
{
  "position": "Nurse",
  "staffRole": "nurse",
  "department": "Emergency"
}
```


## Prescriptions General API

A general prescriptions endpoint was added for dashboard/admin views:

```http
GET /api/v1/prescriptions
GET /api/v1/prescriptions/:id
```

Access behavior:

- `manager`, `admin`, and `staff`: can view all prescriptions.
- `doctor`: can view only prescriptions created by the logged-in doctor.
- `patient`: can view only prescriptions linked to the logged-in patient profile.

Optional filters for management/staff roles:

```http
GET /api/v1/prescriptions?page=1&limit=10&patient=PATIENT_ID&doctor=DOCTOR_ID&from=2026-01-01&to=2026-12-31
```

The patient-specific endpoint remains available for patient profile pages:

```http
GET /api/v1/patients/:patientId/prescriptions
```
# Doctor name populate update

Updated responses that include doctors so they return the doctor id and the linked user data, including name.

Example response shape:

```json
{
  "assignedDoctor": {
    "_id": "DOCTOR_ID",
    "name": "Dr. Ahmad",
    "user": {
      "_id": "USER_ID",
      "name": "Dr. Ahmad",
      "email": "doctor@example.com",
      "phone": "+963..."
    },
    "specialization": "Cardiology"
  }
}
```
