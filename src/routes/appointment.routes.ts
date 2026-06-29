import { Router } from 'express';
import { Roles } from '../constants/roles';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { validate } from '../middlewares/validate.middleware';
import * as controller from '../controllers/appointment.controller';

const router = Router();

router.use(authenticate);
router.get('/', authorize(Roles.MANAGER, Roles.ADMIN, Roles.STAFF, Roles.DOCTOR, Roles.PATIENT), controller.listAppointments);
router.post('/', authorize(Roles.MANAGER, Roles.ADMIN, Roles.STAFF), validate(controller.createAppointmentSchema), controller.createAppointment);
router.get('/:id', authorize(Roles.MANAGER, Roles.ADMIN, Roles.STAFF, Roles.DOCTOR, Roles.PATIENT), controller.getAppointment);
router.patch('/:id', authorize(Roles.MANAGER, Roles.ADMIN, Roles.STAFF, Roles.DOCTOR), validate(controller.updateAppointmentSchema), controller.updateAppointment);
router.delete('/:id', authorize(Roles.MANAGER, Roles.ADMIN, Roles.STAFF), controller.deleteAppointment);

export default router;
