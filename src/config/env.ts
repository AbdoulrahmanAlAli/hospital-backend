import dotenv from 'dotenv';

dotenv.config();

type NodeEnv = 'development' | 'test' | 'production';

const required = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env = {
  nodeEnv: (process.env.NODE_ENV ?? 'development') as NodeEnv,
  port: Number(process.env.PORT ?? 5000),
  apiPrefix: process.env.API_PREFIX ?? '/api/v1',
  mongoUri: required('MONGODB_URI', 'mongodb://127.0.0.1:27017/hospital_management'),
  jwtAccessSecret: required('JWT_ACCESS_SECRET', 'dev_access_secret_change_me'),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  jwtRefreshSecret: required('JWT_REFRESH_SECRET', 'dev_refresh_secret_change_me'),
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  fileEncryptionKeyBase64: required('FILE_ENCRYPTION_KEY_BASE64', Buffer.alloc(32, 1).toString('base64')),
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 300),
  seedManagerName: process.env.SEED_MANAGER_NAME ?? 'Main Manager',
  seedManagerEmail: process.env.SEED_MANAGER_EMAIL ?? 'manager@hospital.local',
  seedManagerPassword: process.env.SEED_MANAGER_PASSWORD ?? 'Admin@123456'
};

export const isProduction = env.nodeEnv === 'production';
