# Hospital Management Backend

Back-end احترافي لنظام إدارة مشفى باستخدام:

- Node.js
- Express.js
- TypeScript
- MongoDB / Mongoose
- JWT Authentication
- bcrypt لتجزئة كلمات المرور
- AES-256-GCM لتشفير ملفات تحاليل المرضى PDF
- RESTful API Architecture

## المزايا الأساسية

- نظام مستخدمين وصلاحيات: Manager, Admin, Staff, Doctor, Patient.
- إدارة المرضى، الأطباء، الموظفين، المواعيد، المناوبات.
- إدارة التحاليل الطبية مع رفع PDF مشفر داخل المشروع.
- منع رفع تحليل المريض إلا من الطبيب المرتبط به فقط.
- عرض تحليل المريض كملف PDF عبر Endpoint مباشر للزر في الواجهة.
- إدارة الوصفات الطبية، الأدوية، المخزون، المعدات، الفواتير، الإشعارات.
- حماية عامة: Helmet, CORS, Rate Limit, JWT, Validation, Error Handling.
- Audit Logs للعمليات المهمة.
- Swagger مبدئي على `/api-docs`.

## التشغيل

```bash
npm install
cp .env.example .env
npm run seed
npm run dev
```

إذا بقي `npm install` بوضع التحميل، استخدم الأوامر التالية داخل مجلد المشروع:

```bash
npm config set registry https://registry.npmjs.org/
npm cache verify
npm install --no-audit --no-fund --progress=false
```

تم أيضاً إضافة ملف `.npmrc` داخل المشروع حتى يستخدم npm registry الرسمي ولا يحاول التحميل من أي registry داخلي أو قديم.

ثم افتح:

```text
http://localhost:5000/health
http://localhost:5000/api-docs
```


## Postman Collection

تم تجهيز Collection كاملة ومرتبة تضم جميع مسارات الـ API الأساسية داخل:

```text
docs/Hospital_Management_Backend.postman_collection.json
docs/postman_collection.json
```

وتم تجهيز Environment اختياري داخل:

```text
docs/Hospital_Management_Backend.postman_environment.json
```

طريقة الاستخدام المقترحة:

1. شغّل السيرفر.
2. افتح Postman.
3. Import للـ Collection.
4. Import للـ Environment أو استخدم Collection Variables.
5. شغّل أول طلب: `01 - Authentication / Login - Manager`.
6. سيحفظ Postman تلقائياً `accessToken` و `refreshToken`.
7. بعدها يمكنك تنفيذ باقي الطلبات بالترتيب، مثل إنشاء Doctor ثم Patient ثم Medical Test.

الـ Collection تحتوي 74 Request موزعة على مجلدات: Auth, Users, Doctors, Staff, Patients, Medical Tests, Prescriptions, Appointments, Billing, Notifications, Medicines, Inventory, Equipment, Shifts.

## متغيرات البيئة المهمة

في ملف `.env` عدّل القيم التالية:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/hospital_management
JWT_ACCESS_SECRET=change_this_access_secret_to_a_long_random_value
JWT_REFRESH_SECRET=change_this_refresh_secret_to_a_long_random_value
FILE_ENCRYPTION_KEY_BASE64=replace_with_32_bytes_base64_key
```

توليد مفتاح تشفير الملفات:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

ضع الناتج في:

```env
FILE_ENCRYPTION_KEY_BASE64=...
```

## حساب المدير الافتراضي

بعد تشغيل:

```bash
npm run seed
```

يتم إنشاء حساب مدير بالقيم الموجودة في `.env`:

```env
SEED_MANAGER_EMAIL=manager@hospital.local
SEED_MANAGER_PASSWORD=Admin@123456
```

غيّر كلمة المرور مباشرة في بيئة الإنتاج.

## تسجيل الدخول

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "manager@hospital.local",
  "password": "Admin@123456"
}
```

استخدم `accessToken` في جميع الطلبات:

```http
Authorization: Bearer ACCESS_TOKEN
```

## زر عرض تحليل المريض PDF في الواجهة

اجعل الزر يستدعي:

```http
GET /api/v1/patients/:patientId/tests/:testId/pdf
Authorization: Bearer ACCESS_TOKEN
```

الـ API يعيد PDF مباشرة مع:

```http
Content-Type: application/pdf
Content-Disposition: inline
```

أي أنه مناسب لفتحه في نافذة جديدة أو iframe حسب تصميم الواجهة.

مثال Front-end:

```ts
const openAnalysisPdf = (patientId: string, testId: string) => {
  window.open(`${API_URL}/patients/${patientId}/tests/${testId}/pdf`, '_blank');
};
```

ملاحظة: لو كانت الواجهة تحتاج Authorization Header، الأفضل استخدام `fetch` وتحويل النتيجة إلى Blob ثم فتحها.

## رفع تحليل PDF

فقط الطبيب المرتبط بالمريض يستطيع رفع ملف التحليل.

```http
POST /api/v1/patients/:patientId/tests/:testId/pdf
Authorization: Bearer DOCTOR_ACCESS_TOKEN
Content-Type: multipart/form-data

pdf: analysis.pdf
```

سيتم حفظ الملف داخل:

```text
storage/analysis/*.pdf.enc
```

الملف المحفوظ ليس PDF عادي، بل ملف مشفر باستخدام AES-256-GCM. يتم فك تشفيره فقط عند طلب العرض من API وبعد التحقق من الصلاحيات.

## أهم المسارات

```text
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
GET    /api/v1/auth/me
PATCH  /api/v1/auth/change-password

GET    /api/v1/users
POST   /api/v1/users
GET    /api/v1/doctors
POST   /api/v1/doctors
GET    /api/v1/staff
POST   /api/v1/staff

GET    /api/v1/patients
POST   /api/v1/patients
GET    /api/v1/patients/:id
PATCH  /api/v1/patients/:id
PATCH  /api/v1/patients/:id/archive

GET    /api/v1/tests
GET    /api/v1/patients/:patientId/tests
POST   /api/v1/patients/:patientId/tests
PATCH  /api/v1/patients/:patientId/tests/:testId
POST   /api/v1/patients/:patientId/tests/:testId/pdf
GET    /api/v1/patients/:patientId/tests/:testId/pdf

GET    /api/v1/prescriptions
GET    /api/v1/prescriptions/:id
GET    /api/v1/patients/:patientId/prescriptions
POST   /api/v1/patients/:patientId/prescriptions

GET    /api/v1/appointments
POST   /api/v1/appointments
GET    /api/v1/billings
POST   /api/v1/billings
GET    /api/v1/medicines
GET    /api/v1/inventory
GET    /api/v1/inventory/low-stock
GET    /api/v1/equipment
GET    /api/v1/shifts
GET    /api/v1/notifications/me
```

## قواعد الصلاحيات المهمة

- Manager: تحكم كامل تقريباً.
- Admin: إدارة المستخدمين والبيانات التشغيلية.
- Staff: إدارة المرضى والمواعيد والمستودع والفواتير.
- Doctor: يرى مرضاه فقط، ويستطيع إضافة الوصفات والتحاليل لهم.
- Patient: يرى ملفه وتحاليله ووصفاته وفواتيره وإشعاراته فقط.
- رفع PDF التحليل: الطبيب المرتبط بالمريض فقط.

## ملاحظات إنتاجية مهمة

- لا تستخدم مفاتيح `.env.example` في الإنتاج.
- استخدم HTTPS دائماً في الإنتاج.
- خزن `storage/analysis` في Volume دائم عند Docker أو السيرفر.
- لا ترفع `.env` أو ملفات `storage/analysis/*.enc` إلى Git.
- يمكن لاحقاً ربط التخزين بـ S3 أو MinIO مع الحفاظ على نفس منطق التشفير.


## Staff role classification

Staff users still use the main auth role `staff`. The staff profile now includes `staffRole` to classify the employee job type. Staff list can be filtered using `GET /api/v1/staff?staffRole=receptionist`.

Allowed `staffRole` values:

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

Example:

```json
{
  "position": "Nurse",
  "staffRole": "nurse",
  "department": "Emergency"
}
```



## التحاليل الطبية العامة

تمت إضافة endpoint عام لعرض التحاليل حسب صلاحية المستخدم. هذا الرابط ليس مخصصاً للإدارة، لأن المدير والأدمن والموظف لا يملكون صلاحية عرض أو متابعة التحاليل:

```http
GET /api/v1/tests
```

الصلاحيات:

- `doctor`: يرى التحاليل التي أنشأها هو فقط، ويمكنه إنشاء وتعديل ورفع ملفات التحاليل للمرضى المرتبطين به.
- `patient`: يرى تحاليله فقط.
- `manager` و `admin` و `staff`: لا يملكون صلاحية عرض أو متابعة التحاليل.

فلترة اختيارية:

```http
GET /api/v1/tests?page=1&limit=10&search=&patient=PATIENT_ID&doctor=DOCTOR_ID&type=Blood%20Test&status=completed&from=2026-01-01&to=2026-12-31
```

الرابط القديم بقي موجوداً لصفحة ملف مريض محدد:

```http
GET /api/v1/patients/:patientId/tests
```


## وصفات عامة للأدمن

تمت إضافة endpoint عام للوصفات:

```http
GET /api/v1/prescriptions
GET /api/v1/prescriptions/:id
```

الاستخدام:

- `manager` و `admin` و `staff` يمكنهم عرض كل الوصفات.
- `doctor` يرى الوصفات التي كتبها هو فقط.
- `patient` يرى وصفاته هو فقط.

فلترة اختيارية:

```http
GET /api/v1/prescriptions?page=1&limit=10&patient=PATIENT_ID&doctor=DOCTOR_ID&from=2026-01-01&to=2026-12-31
```

الرابط القديم بقي موجوداً لصفحة ملف مريض محدد:

```http
GET /api/v1/patients/:patientId/prescriptions
```
