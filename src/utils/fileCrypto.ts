import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env';
import { ApiError } from './ApiError';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

const getKey = (): Buffer => {
  const key = Buffer.from(env.fileEncryptionKeyBase64, 'base64');
  if (key.length !== 32) {
    throw new Error('FILE_ENCRYPTION_KEY_BASE64 must decode to exactly 32 bytes');
  }
  return key;
};

export interface EncryptedFileResult {
  storedName: string;
  storedPath: string;
  iv: string;
  authTag: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export const encryptAndStoreFile = async (params: {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  destinationDir: string;
  storedName: string;
}): Promise<EncryptedFileResult> => {
  await fs.mkdir(params.destinationDir, { recursive: true });
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(params.buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const storedPath = path.join(params.destinationDir, params.storedName);

  await fs.writeFile(storedPath, encrypted);

  return {
    storedName: params.storedName,
    storedPath,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    originalName: params.originalName,
    mimeType: params.mimeType,
    size: params.buffer.length
  };
};

export const decryptStoredFile = async (params: { storedPath: string; iv: string; authTag: string }): Promise<Buffer> => {
  try {
    const encrypted = await fs.readFile(params.storedPath);
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(params.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(params.authTag, 'base64'));
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  } catch {
    throw new ApiError(500, 'Unable to decrypt requested file');
  }
};
