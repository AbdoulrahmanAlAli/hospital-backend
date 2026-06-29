import type { Model } from 'mongoose';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { buildSearchFilter, getPagination } from '../utils/query';
import { writeAuditLog } from '../middlewares/audit.middleware';

export const createCrudController = <T>(model: Model<T>, entity: string, searchFields: string[] = []) => ({
  list: asyncHandler(async (req, res) => {
    const { page, limit, skip, sort } = getPagination(req.query);
    const filter = buildSearchFilter<T>(req.query.search, searchFields);
    const [items, total] = await Promise.all([
      model.find(filter).sort(sort).skip(skip).limit(limit),
      model.countDocuments(filter)
    ]);

    return sendSuccess(res, { items, meta: { page, limit, total, pages: Math.ceil(total / limit) } }, `${entity} list`);
  }),

  getById: asyncHandler(async (req, res) => {
    const item = await model.findById(req.params.id);
    if (!item) throw new ApiError(404, `${entity} not found`);
    return sendSuccess(res, item, `${entity} details`);
  }),

  create: asyncHandler(async (req, res) => {
    const item = await model.create(req.body);
    await writeAuditLog(req, 'create', entity, (item as any)._id?.toString());
    return sendSuccess(res, item, `${entity} created successfully`, 201);
  }),

  update: asyncHandler(async (req, res) => {
    const item = await model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) throw new ApiError(404, `${entity} not found`);
    await writeAuditLog(req, 'update', entity, req.params.id);
    return sendSuccess(res, item, `${entity} updated successfully`);
  }),

  remove: asyncHandler(async (req, res) => {
    const item = await model.findByIdAndDelete(req.params.id);
    if (!item) throw new ApiError(404, `${entity} not found`);
    await writeAuditLog(req, 'delete', entity, req.params.id);
    return sendSuccess(res, null, `${entity} deleted successfully`);
  })
});
