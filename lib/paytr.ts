import crypto from 'node:crypto';

export function verifyPaytrCallback(body: Record<string,string>) {
  const key = process.env.PAYTR_MERCHANT_KEY || '';
  const salt = process.env.PAYTR_MERCHANT_SALT || '';
  const base = `${body.merchant_oid}${salt}${body.status}${body.total_amount}`;
  const expected = crypto.createHmac('sha256', key).update(base).digest('base64');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(body.hash || ''));
}

export function createPaytrToken(params: { merchantOid: string; email: string; amountKurus: number; userIp: string; basketJson: string; noInstallment: string; maxInstallment: string; currency: string; testMode: string; }) {
  const merchantId = process.env.PAYTR_MERCHANT_ID || '';
  const key = process.env.PAYTR_MERCHANT_KEY || '';
  const salt = process.env.PAYTR_MERCHANT_SALT || '';
  const base = `${merchantId}${params.userIp}${params.merchantOid}${params.email}${params.amountKurus}${params.basketJson}${params.noInstallment}${params.maxInstallment}${params.currency}${params.testMode}`;
  return crypto.createHmac('sha256', key).update(base + salt).digest('base64');
}
