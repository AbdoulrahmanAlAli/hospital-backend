import { Router } from 'express';
import { Roles } from '../constants/roles';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { validate } from '../middlewares/validate.middleware';
import * as controller from '../controllers/notification.controller';

const router = Router();

router.use(authenticate);
router.get('/me', controller.listMyNotifications);
router.patch('/:id/read', controller.markAsRead);
router.post('/', authorize(Roles.MANAGER, Roles.ADMIN, Roles.STAFF, Roles.DOCTOR), validate(controller.createNotificationSchema), controller.createNotification);

export default router;
