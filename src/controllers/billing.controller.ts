import { z } from 'zod';
import { Roles } from '../constants/roles';
import { BillingModel } from '../models/Billing.model';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { getPagination } from '../utils/query';
import { generateInvoiceNumber } from '../services/invoice.service';
import { writeAuditLog } from '../middlewares/audit.middleware';

export const createBillingSchema = z.object({
  body: z.object({
    patient: z.string().min(10),
    items: z.array(z.object({ description: z.string().min(1), quantity: z.number().min(1), unitPrice: z.number().min(0) })).min(1),
    discount: z.number().min(0).optional(),
    status: z.enum(['paid', 'unpaid']).optional(),
    paidAt: z.string().datetime().optional(),
    notes: z.string().optional()
  })
});

export const updateBillingSchema = z.object({
  body: createBillingSchema.shape.body.partial()
});

const scopedBillingFilter = (req: any) => {
  if (req.user.role === Roles.PATIENT) return { patient: req.user.patientId };
  return {};
};

export const listBillings = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = getPagination(req.query);
  const filter: Record<string, unknown> = { ...scopedBillingFilter(req) };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.patient) filter.patient = req.query.patient;
  const [items, total] = await Promise.all([
    BillingModel.find(filter).populate('patient').sort(sort).skip(skip).limit(limit),
    BillingModel.countDocuments(filter)
  ]);
  return sendSuccess(res, { items, meta: { page, limit, total, pages: Math.ceil(total / limit) } }, 'Billing list');
});

export const createBilling = asyncHandler(async (req, res) => {
  const billing = await BillingModel.create({ ...req.body, invoiceNumber: generateInvoiceNumber() });
  await writeAuditLog(req, 'create', 'Billing', billing._id.toString());
  return sendSuccess(res, billing, 'Invoice created successfully', 201);
});

export const getBilling = asyncHandler(async (req, res) => {
  const billing = await BillingModel.findById(req.params.id).populate('patient');
  if (!billing) throw new ApiError(404, 'Invoice not found');
  if (req.user?.role === Roles.PATIENT && billing.patient._id.toString() !== req.user.patientId) throw new ApiError(403, 'Forbidden');
  return sendSuccess(res, billing, 'Invoice details');
});

export const updateBilling = asyncHandler(async (req, res) => {
  const billing = await BillingModel.findById(req.params.id);
  if (!billing) throw new ApiError(404, 'Invoice not found');
  Object.assign(billing, req.body);
  await billing.save();
  await writeAuditLog(req, 'update', 'Billing', req.params.id);
  return sendSuccess(res, billing, 'Invoice updated successfully');
});

export const deleteBilling = asyncHandler(async (req, res) => {
  const billing = await BillingModel.findByIdAndDelete(req.params.id);
  if (!billing) throw new ApiError(404, 'Invoice not found');
  await writeAuditLog(req, 'delete', 'Billing', req.params.id);
  return sendSuccess(res, null, 'Invoice deleted successfully');
});
