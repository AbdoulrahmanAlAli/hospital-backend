import { UserModel } from '../models/User.model';
import { ApiError } from '../utils/ApiError';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';

export const login = async (email: string, password: string) => {
  const user = await UserModel.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !user.isActive) throw new ApiError(401, 'Invalid email or password');

  const isValid = await user.comparePassword(password);
  if (!isValid) throw new ApiError(401, 'Invalid email or password');

  user.lastLoginAt = new Date();
  await user.save();

  const payload = { sub: user._id.toString(), role: user.role, email: user.email };

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload)
  };
};

export const refresh = async (refreshToken: string) => {
  const payload = verifyRefreshToken(refreshToken);
  const user = await UserModel.findById(payload.sub);
  if (!user || !user.isActive) throw new ApiError(401, 'Invalid refresh token');

  const nextPayload = { sub: user._id.toString(), role: user.role, email: user.email };
  return {
    accessToken: signAccessToken(nextPayload),
    refreshToken: signRefreshToken(nextPayload)
  };
};
