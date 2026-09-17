import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

export const hashSecret = (value: string) => bcrypt.hash(value, 12);
export const verifySecret = (value: string, hash: string) => bcrypt.compare(value, hash);
export const randomCode = (prefix = 'KEKS') => `${prefix}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
export const merchantOid = () => `KEKS${Date.now()}${crypto.randomBytes(4).toString('hex')}`;
