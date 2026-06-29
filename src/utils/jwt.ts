import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import type { Role } from '../constants/roles';

export interface JwtPayload {
  sub: string;
  role: Role;
  email: string;
}

const sign = (payload: JwtPayload, secret: string, expiresIn: string): string => {
  const options: SignOptions = { expiresIn: expiresIn as any };
  return jwt.sign(payload, secret, options);
};

export const signAccessToken = (payload: JwtPayload): string => sign(payload, env.jwtAccessSecret, env.jwtAccessExpiresIn);
export const signRefreshToken = (payload: JwtPayload): string => sign(payload, env.jwtRefreshSecret, env.jwtRefreshExpiresIn);

export const verifyAccessToken = (token: string): JwtPayload => {
  const decoded = jwt.verify(token, env.jwtAccessSecret) as JwtPayload;
  return decoded;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  const decoded = jwt.verify(token, env.jwtRefreshSecret) as JwtPayload;
  return decoded;
};
