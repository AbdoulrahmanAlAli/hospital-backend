import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { ApiError } from '../utils/ApiError';

export const validate = (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction): void => {
  const result = schema.safeParse({ body: req.body, params: req.params, query: req.query });
  if (!result.success) {
    const message = result.error.errors.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
    return next(new ApiError(400, message));
  }
  req.body = result.data.body ?? req.body;
  req.params = result.data.params ?? req.params;
  req.query = result.data.query ?? req.query;
  next();
};
