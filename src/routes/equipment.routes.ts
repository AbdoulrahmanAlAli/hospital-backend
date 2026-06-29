import { Router } from 'express';
import { Roles } from '../constants/roles';
import { EquipmentModel } from '../models/Equipment.model';
import { createCrudController } from '../controllers/crud.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';

const controller = createCrudController(EquipmentModel, 'Equipment', ['name', 'code', 'category', 'location']);
const router = Router();

router.use(authenticate, authorize(Roles.MANAGER, Roles.ADMIN, Roles.STAFF));
router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.getById);
router.patch('/:id', controller.update);
router.delete('/:id', authorize(Roles.MANAGER, Roles.ADMIN), controller.remove);

export default router;
