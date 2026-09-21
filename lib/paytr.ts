import crypto from 'node:crypto';

export function verifyPaytrCallback(body: Record<string,string>) {
  const key = process.env.PAYTR_MERCHANT_KEY || '';
  const salt = process.env.PAYTR_MERCHANT_SALT || '';
  const base = `${body.merchant_oid}${salt}${body.status}${body.total_amount}`;
  const expected = Buffer.from(crypto.createHmac('sha256', key).update(base).digest('base64'));
  const received = Buffer.from(body.hash || '');
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

export function createPaytrToken(params: { merchantOid: string; email: string; amountKurus: number; userIp: string; basketJson: string; noInstallment: string; maxInstallment: string; currency: string; testMode: string; }) {
  const merchantId = process.env.PAYTR_MERCHANT_ID || '';
  const key = process.env.PAYTR_MERCHANT_KEY || '';
  const salt = process.env.PAYTR_MERCHANT_SALT || '';
  const base = `${merchantId}${params.userIp}${params.merchantOid}${params.email}${params.amountKurus}${params.basketJson}${params.noInstallment}${params.maxInstallment}${params.currency}${params.testMode}`;
  return crypto.createHmac('sha256', key).update(base + salt).digest('base64');
}
