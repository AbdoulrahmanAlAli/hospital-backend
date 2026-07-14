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



## Medical Tests General API

A general medical tests endpoint is available for doctors and patients only. It is not available for manager, admin, or staff accounts:

```http
GET /api/v1/tests
```

Access behavior:

- `doctor`: can view only tests created by the logged-in doctor and can create/update/upload test files for assigned patients.
- `patient`: can view only tests linked to the logged-in patient profile.
- `manager`, `admin`, and `staff`: cannot view or follow medical tests.

Optional filters:

```http
GET /api/v1/tests?page=1&limit=10&search=&patient=PATIENT_ID&doctor=DOCTOR_ID&type=Blood%20Test&status=completed&from=2026-01-01&to=2026-12-31
```

The patient-specific endpoint remains available for patient profile pages:

```http
GET /api/v1/patients/:patientId/tests
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

## Dashboard Overview API

A dashboard overview endpoint is available for the main admin/staff home page:

```http
GET /api/v1/dashboard/overview
```

Allowed roles:

- `manager`
- `admin`
- `staff`

The response includes:

- Total patients.
- Today's appointments.
- Unpaid bills count and total amount.
- Active doctors count and total doctors.
- Appointment status distribution.
- Appointments count for the last 7 days.
- Monthly revenue for the last 6 months.
- Inventory low-stock alerts.
- Latest appointments with patient and doctor names.

## Notifications Targeting

Notifications can now be sent to one user, multiple users, or a full role.

### Single user

```json
{
  "targetType": "user",
  "recipient": "USER_ID",
  "title": "Administrative notice",
  "message": "This is a notification for one user",
  "type": "administrative"
}
```

### Multiple selected users

```json
{
  "targetType": "users",
  "recipients": ["USER_ID_1", "USER_ID_2"],
  "title": "Administrative notice",
  "message": "This notification is sent to selected users",
  "type": "administrative"
}
```

### Full role broadcast

```json
{
  "targetType": "role",
  "role": "doctor",
  "title": "Doctors announcement",
  "message": "This notification is sent to all active doctors",
  "type": "administrative"
}
```

Allowed role values:

- `manager`
- `admin`
- `staff`
- `doctor`
- `patient`

Role broadcast is allowed only for `manager` and `admin`.
