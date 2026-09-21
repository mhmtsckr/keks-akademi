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
    // PayTR ayni bildirimi yeniden gonderebilir. Kosullu updateMany iyimser
    // kilit gorevi gorur: eszamanli iki bildirimden yalnizca biri satiri
    // PAID'e cevirebilir, digeri count 0 alir ve ikinci bir test erisimi acmaz.
    await db.$transaction(async tx => {
      const claim = await tx.payment.updateMany({
        where: { id: payment.id, status: { not: 'PAID' } },
        data: { status: 'PAID', providerPayload: params }
      });
      if (claim.count !== 1) return;
      await tx.testAccess.create({ data: { studentId: payment.studentId, source: 'PAID', paymentId: payment.id } });
    });
  } else if (params.status !== 'success' && payment.status === 'PENDING') {
    await db.payment.update({ where: { id: payment.id }, data: { status: 'FAILED', providerPayload: params } });
  }
  return new NextResponse('OK');
}
