import { Router } from 'express';
import { Roles } from '../constants/roles';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { validate } from '../middlewares/validate.middleware';
import * as controller from '../controllers/doctor.controller';

const router = Router();

router.use(authenticate);
router.get('/', authorize(Roles.MANAGER, Roles.ADMIN, Roles.STAFF, Roles.DOCTOR), controller.listDoctors);
router.get('/:id', authorize(Roles.MANAGER, Roles.ADMIN, Roles.STAFF, Roles.DOCTOR), controller.getDoctor);
router.post('/', authorize(Roles.MANAGER, Roles.ADMIN), validate(controller.createDoctorSchema), controller.createDoctor);
router.patch('/:id', authorize(Roles.MANAGER, Roles.ADMIN), validate(controller.updateDoctorSchema), controller.updateDoctor);
router.delete('/:id', authorize(Roles.MANAGER), controller.deleteDoctor);

export default router;
