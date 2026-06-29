import { Router } from 'express';
import { Roles } from '../constants/roles';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { validate } from '../middlewares/validate.middleware';
import * as controller from '../controllers/staff.controller';

const router = Router();

router.use(authenticate, authorize(Roles.MANAGER, Roles.ADMIN));
router.get('/', controller.listStaff);
router.post('/', validate(controller.createStaffSchema), controller.createStaff);
router.get('/:id', controller.getStaff);
router.patch('/:id', validate(controller.updateStaffSchema), controller.updateStaff);
router.delete('/:id', authorize(Roles.MANAGER), controller.deleteStaff);

export default router;
