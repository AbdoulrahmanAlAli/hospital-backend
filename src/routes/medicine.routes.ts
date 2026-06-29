import { Router } from 'express';
import { Roles } from '../constants/roles';
import { MedicineModel } from '../models/Medicine.model';
import { createCrudController } from '../controllers/crud.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';

const controller = createCrudController(MedicineModel, 'Medicine', ['name', 'code', 'category', 'manufacturer']);
const router = Router();

router.use(authenticate);
router.get('/', authorize(Roles.MANAGER, Roles.ADMIN, Roles.STAFF, Roles.DOCTOR), controller.list);
router.post('/', authorize(Roles.MANAGER, Roles.ADMIN, Roles.STAFF), controller.create);
router.get('/:id', authorize(Roles.MANAGER, Roles.ADMIN, Roles.STAFF, Roles.DOCTOR), controller.getById);
router.patch('/:id', authorize(Roles.MANAGER, Roles.ADMIN, Roles.STAFF), controller.update);
router.delete('/:id', authorize(Roles.MANAGER, Roles.ADMIN), controller.remove);

export default router;
