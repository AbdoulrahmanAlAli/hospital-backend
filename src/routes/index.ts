import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import doctorRoutes from './doctor.routes';
import staffRoutes from './staff.routes';
import patientRoutes from './patient.routes';
import appointmentRoutes from './appointment.routes';
import billingRoutes from './billing.routes';
import notificationRoutes from './notification.routes';
import medicineRoutes from './medicine.routes';
import inventoryRoutes from './inventory.routes';
import equipmentRoutes from './equipment.routes';
import shiftRoutes from './shift.routes';
import prescriptionRoutes from './prescription.routes';
import testRoutes from './test.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/doctors', doctorRoutes);
router.use('/staff', staffRoutes);
router.use('/patients', patientRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/billings', billingRoutes);
router.use('/notifications', notificationRoutes);
router.use('/medicines', medicineRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/equipment', equipmentRoutes);
router.use('/shifts', shiftRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/tests', testRoutes);

export default router;
