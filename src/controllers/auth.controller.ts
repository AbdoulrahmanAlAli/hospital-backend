import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import * as authService from '../services/auth.service';
import { UserModel } from '../models/User.model';
import { ApiError } from '../utils/ApiError';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6)
  })
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(20)
  })
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(8)
  })
});

export const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body.email, req.body.password);
  return sendSuccess(res, data, 'Logged in successfully');
});

export const refresh = asyncHandler(async (req, res) => {
  const data = await authService.refresh(req.body.refreshToken);
  return sendSuccess(res, data, 'Token refreshed successfully');
});

export const me = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.user?.userId).select('-password');
  return sendSuccess(res, user, 'Current user');
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.user?.userId).select('+password');
  if (!user) throw new ApiError(404, 'User not found');

  const valid = await user.comparePassword(req.body.currentPassword);
  if (!valid) throw new ApiError(400, 'Current password is incorrect');

  user.password = req.body.newPassword;
  await user.save();
  return sendSuccess(res, null, 'Password changed successfully');
});
