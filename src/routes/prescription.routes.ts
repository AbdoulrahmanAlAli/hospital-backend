import { Router } from 'express';
import { Roles } from '../constants/roles';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import * as controller from '../controllers/prescription.controller';

const router = Router();

router.use(authenticate);

router.get('/', authorize(Roles.MANAGER, Roles.ADMIN, Roles.STAFF, Roles.DOCTOR, Roles.PATIENT), controller.listPrescriptions);
router.get('/:id', authorize(Roles.MANAGER, Roles.ADMIN, Roles.STAFF, Roles.DOCTOR, Roles.PATIENT), controller.getPrescription);

export default router;
