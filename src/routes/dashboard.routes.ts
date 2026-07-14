import { Router } from 'express';
import { Roles } from '../constants/roles';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import * as controller from '../controllers/dashboard.controller';

const router = Router();

router.use(authenticate, authorize(Roles.MANAGER, Roles.ADMIN, Roles.STAFF));
router.get('/overview', controller.getDashboardOverview);

export default router;
