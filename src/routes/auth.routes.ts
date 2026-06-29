import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import * as controller from '../controllers/auth.controller';

const router = Router();

router.post('/login', validate(controller.loginSchema), controller.login);
router.post('/refresh', validate(controller.refreshSchema), controller.refresh);
router.get('/me', authenticate, controller.me);
router.patch('/change-password', authenticate, validate(controller.changePasswordSchema), controller.changePassword);

export default router;
