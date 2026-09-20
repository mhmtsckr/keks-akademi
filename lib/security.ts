import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

function b64url(buf: Buffer) {
  return buf.toString('base64url');
}

export async function hashSecret(value: string) {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(value, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${b64url(salt)}$${b64url(derived)}`;
}

export async function verifySecret(value: string, hash: string) {
  if (hash.startsWith('scrypt$')) {
    const [, n, r, p, saltB64, keyB64] = hash.split('$');
    const salt = Buffer.from(saltB64, 'base64url');
    const expected = Buffer.from(keyB64, 'base64url');
    const actual = crypto.scryptSync(value, salt, expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    });
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  }
  return bcrypt.compare(value, hash);
}

export const randomCode = (prefix = 'KEKS') => `${prefix}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
export const merchantOid = () => `KEKS${Date.now()}${crypto.randomBytes(4).toString('hex')}`;


function appCipherKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET_MISSING');
  return crypto.createHash('sha256').update(secret).digest();
}

export function encryptPrivateCode(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', appCipherKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map(b64url).join('.');
}

export function decryptPrivateCode(value: string) {
  const [ivB64, tagB64, dataB64] = value.split('.');
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('INVALID_PRIVATE_CODE');
  const decipher = crypto.createDecipheriv('aes-256-gcm', appCipherKey(), Buffer.from(ivB64, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64url')), decipher.final()]).toString('utf8');
}
