import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { createPaytrToken } from '@/lib/paytr';
import { merchantOid } from '@/lib/security';

export async function POST(req: Request) {
  const user = await requireRole(['STUDENT']);
  if (!user.student) return NextResponse.json({ error: 'Öğrenci profili yok.' }, { status: 400 });
  if (!process.env.PAYTR_MERCHANT_ID) return NextResponse.json({ error: 'PayTR henüz yapılandırılmadı.' }, { status: 503 });
  const amountKurus = Number(process.env.TEST_PRICE_KURUS || 35000);
  const oid = merchantOid();
  await db.payment.create({ data: { studentId: user.student.id, merchantOid: oid, amountKurus } });
  const email = user.email || 'student@example.invalid';
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
  const basket = Buffer.from(JSON.stringify([['KEKS Eğilim Taraması', (amountKurus/100).toFixed(2), 1]])).toString('base64');
  const token = createPaytrToken({ merchantOid: oid, email, amountKurus, userIp: ip, basketJson: basket, noInstallment: '1', maxInstallment: '0', currency: 'TL', testMode: process.env.PAYTR_TEST_MODE || '1' });
  return NextResponse.json({ merchantOid: oid, merchantId: process.env.PAYTR_MERCHANT_ID, token, amountKurus, basket });
}
