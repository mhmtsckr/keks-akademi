import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPaytrCallback } from '@/lib/paytr';

export async function POST(req: Request) {
  const text = await req.text();
  const params = Object.fromEntries(new URLSearchParams(text).entries());
  if (!verifyPaytrCallback(params)) return new NextResponse('PAYTR notification failed: bad hash', { status: 400 });
  const payment = await db.payment.findUnique({ where: { merchantOid: params.merchant_oid } });
  if (!payment) return new NextResponse('OK');
  if (params.status === 'success' && payment.status !== 'PAID') {
    await db.$transaction([
      db.payment.update({ where: { id: payment.id }, data: { status: 'PAID', providerPayload: params } }),
      db.testAccess.create({ data: { studentId: payment.studentId, source: 'PAID', paymentId: payment.id } })
    ]);
  } else if (params.status !== 'success' && payment.status === 'PENDING') {
    await db.payment.update({ where: { id: payment.id }, data: { status: 'FAILED', providerPayload: params } });
  }
  return new NextResponse('OK');
}
