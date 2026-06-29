import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { isProduction } from '../config/env';

export const errorMiddleware = (error: Error, _req: Request, res: Response, _next: NextFunction): void => {
  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  const message = error instanceof ApiError ? error.message : 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(isProduction ? {} : { stack: error.stack })
  });
};
