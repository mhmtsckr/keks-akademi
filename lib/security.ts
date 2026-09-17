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
