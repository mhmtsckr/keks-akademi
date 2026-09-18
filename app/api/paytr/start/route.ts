import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { createPaytrToken } from '@/lib/paytr';
import { merchantOid } from '@/lib/security';

const schema = z.object({
  email: z.string().email(),
  userName: z.string().min(2).max(120),
  userAddress: z.string().min(5).max(400),
  userPhone: z.string().min(7).max(30),
});

export async function POST(req: Request) {
  const user = await requireRole(['STUDENT']);
  if (!user.student) return NextResponse.json({ error: 'Öğrenci profili yok.' }, { status: 400 });

  const merchantId = process.env.PAYTR_MERCHANT_ID;
  const appUrl = process.env.APP_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
  if (!merchantId || !process.env.PAYTR_MERCHANT_KEY || !process.env.PAYTR_MERCHANT_SALT || !appUrl) {
    return NextResponse.json({ error: 'PayTR henüz yapılandırılmadı.' }, { status: 503 });
  }

  const input = schema.parse(await req.json());
  const amountKurus = Number(process.env.TEST_PRICE_KURUS || 35000);
  const oid = merchantOid();
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
  const testMode = process.env.PAYTR_TEST_MODE || '1';
  const noInstallment = '1';
  const maxInstallment = '0';
  const currency = 'TL';
  const basketJson = JSON.stringify([['KEKS Eğilim Taraması', (amountKurus / 100).toFixed(2), 1]]);
  const basket = Buffer.from(basketJson).toString('base64');

  await db.payment.create({
    data: { studentId: user.student.id, merchantOid: oid, amountKurus },
  });

  const paytrToken = createPaytrToken({
    merchantOid: oid,
    email: input.email,
    amountKurus,
    userIp: ip,
    basketJson: basket,
    noInstallment,
    maxInstallment,
    currency,
    testMode,
  });

  const form = new URLSearchParams({
    merchant_id: merchantId,
    user_ip: ip,
    merchant_oid: oid,
    email: input.email,
    payment_amount: String(amountKurus),
    paytr_token: paytrToken,
    user_basket: basket,
    debug_on: testMode === '1' ? '1' : '0',
    no_installment: noInstallment,
    max_installment: maxInstallment,
    user_name: input.userName,
    user_address: input.userAddress,
    user_phone: input.userPhone,
    merchant_ok_url: `${appUrl}/ogrenci?payment=success`,
    merchant_fail_url: `${appUrl}/ogrenci?payment=failed`,
    timeout_limit: '30',
    currency,
    test_mode: testMode,
    lang: 'tr',
    iframe_v2: '1',
  });

  const response = await fetch('https://www.paytr.com/odeme/api/get-token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: form,
    cache: 'no-store',
  });

  const result = await response.json().catch(() => null) as { status?: string; token?: string; reason?: string } | null;

  if (!response.ok || result?.status !== 'success' || !result.token) {
    await db.payment.update({
      where: { merchantOid: oid },
      data: { status: 'FAILED', providerPayload: result ?? { httpStatus: response.status } },
    });
    return NextResponse.json({ error: result?.reason || 'PayTR ödeme oturumu başlatılamadı.' }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    merchantOid: oid,
    iframeToken: result.token,
    iframeUrl: `https://www.paytr.com/odeme/guvenli/${result.token}`,
    amountKurus,
  });
}
