import { Router } from 'express';
import { Roles } from '../constants/roles';
import { InventoryItemModel } from '../models/InventoryItem.model';
import { createCrudController } from '../controllers/crud.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';

const controller = createCrudController(InventoryItemModel, 'InventoryItem', ['batchNumber', 'location']);
const router = Router();

router.use(authenticate, authorize(Roles.MANAGER, Roles.ADMIN, Roles.STAFF));
router.get('/low-stock', asyncHandler(async (_req, res) => {
  const items = await InventoryItemModel.find({ $expr: { $lte: ['$quantity', '$minimumQuantity'] } }).populate('medicine');
  return sendSuccess(res, items, 'Low stock inventory items');
}));
router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.getById);
router.patch('/:id', controller.update);
router.delete('/:id', authorize(Roles.MANAGER, Roles.ADMIN), controller.remove);

export default router;
