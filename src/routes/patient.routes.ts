import { Router } from 'express';
import { Roles } from '../constants/roles';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { validate } from '../middlewares/validate.middleware';
import { pdfUpload } from '../middlewares/upload.middleware';
import * as patientController from '../controllers/patient.controller';
import * as testController from '../controllers/medicalTest.controller';
import * as prescriptionController from '../controllers/prescription.controller';

const router = Router();

router.use(authenticate);

router.get('/', authorize(Roles.MANAGER, Roles.ADMIN, Roles.STAFF, Roles.DOCTOR, Roles.PATIENT), patientController.listPatients);
router.post('/', authorize(Roles.MANAGER, Roles.ADMIN, Roles.STAFF), validate(patientController.createPatientSchema), patientController.createPatient);
router.get('/:id', authorize(Roles.MANAGER, Roles.ADMIN, Roles.STAFF, Roles.DOCTOR, Roles.PATIENT), patientController.getPatient);
router.patch('/:id', authorize(Roles.MANAGER, Roles.ADMIN, Roles.STAFF, Roles.DOCTOR, Roles.PATIENT), validate(patientController.updatePatientSchema), patientController.updatePatient);
router.patch('/:id/archive', authorize(Roles.MANAGER, Roles.ADMIN, Roles.STAFF), patientController.archivePatient);
router.delete('/:id', authorize(Roles.MANAGER, Roles.ADMIN), patientController.deletePatient);

router.get('/:patientId/tests', authorize(Roles.DOCTOR, Roles.PATIENT), testController.listPatientTests);
router.post('/:patientId/tests', authorize(Roles.DOCTOR), validate(testController.createMedicalTestSchema), testController.createPatientTest);
router.patch('/:patientId/tests/:testId', authorize(Roles.DOCTOR), validate(testController.updateMedicalTestSchema), testController.updatePatientTest);
router.post('/:patientId/tests/:testId/pdf', authorize(Roles.DOCTOR), pdfUpload.single('pdf'), testController.uploadPatientTestPdf);
router.get('/:patientId/tests/:testId/pdf', authorize(Roles.DOCTOR, Roles.PATIENT), testController.viewPatientTestPdf);
router.delete('/:patientId/tests/:testId', authorize(Roles.DOCTOR), testController.deletePatientTest);

router.get('/:patientId/prescriptions', authorize(Roles.MANAGER, Roles.ADMIN, Roles.STAFF, Roles.DOCTOR, Roles.PATIENT), prescriptionController.listPatientPrescriptions);
router.post('/:patientId/prescriptions', authorize(Roles.DOCTOR), validate(prescriptionController.createPrescriptionSchema), prescriptionController.createPatientPrescription);
router.patch('/:patientId/prescriptions/:prescriptionId', authorize(Roles.DOCTOR), validate(prescriptionController.updatePrescriptionSchema), prescriptionController.updatePatientPrescription);
router.delete('/:patientId/prescriptions/:prescriptionId', authorize(Roles.DOCTOR), prescriptionController.deletePatientPrescription);

export default router;
