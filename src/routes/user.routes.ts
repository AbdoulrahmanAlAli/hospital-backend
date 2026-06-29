import { Router } from 'express';
import { Roles } from '../constants/roles';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { validate } from '../middlewares/validate.middleware';
import * as controller from '../controllers/user.controller';

const router = Router();

router.use(authenticate, authorize(Roles.MANAGER, Roles.ADMIN));
router.get('/', controller.listUsers);
router.post('/', validate(controller.createUserSchema), controller.createUser);
router.get('/:id', controller.getUser);
router.patch('/:id', validate(controller.updateUserSchema), controller.updateUser);
router.delete('/:id', authorize(Roles.MANAGER), controller.deleteUser);

export default router;
