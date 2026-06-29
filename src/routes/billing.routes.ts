import { Router } from 'express';
import { Roles } from '../constants/roles';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { validate } from '../middlewares/validate.middleware';
import * as controller from '../controllers/billing.controller';

const router = Router();

router.use(authenticate);
router.get('/', authorize(Roles.MANAGER, Roles.ADMIN, Roles.STAFF, Roles.PATIENT), controller.listBillings);
router.post('/', authorize(Roles.MANAGER, Roles.ADMIN, Roles.STAFF), validate(controller.createBillingSchema), controller.createBilling);
router.get('/:id', authorize(Roles.MANAGER, Roles.ADMIN, Roles.STAFF, Roles.PATIENT), controller.getBilling);
router.patch('/:id', authorize(Roles.MANAGER, Roles.ADMIN, Roles.STAFF), validate(controller.updateBillingSchema), controller.updateBilling);
router.delete('/:id', authorize(Roles.MANAGER, Roles.ADMIN), controller.deleteBilling);

export default router;
