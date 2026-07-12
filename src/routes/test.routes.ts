import { Router } from 'express';
import { Roles } from '../constants/roles';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import * as controller from '../controllers/medicalTest.controller';

const router = Router();

router.use(authenticate);

router.get('/', authorize(Roles.DOCTOR, Roles.PATIENT), controller.listMedicalTests);

export default router;
