import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { resolvePaytrCredentials,verifyPaytrCallback } from '@/lib/paytr';
import { withApiErrors } from '@/lib/apiGuard';

async function POST__handler(req: Request) {
  const text = await req.text();
  const params=Object.fromEntries(new URLSearchParams(text).entries());
  const paytr=await resolvePaytrCredentials();
  if(!paytr)return new NextResponse('PAYTR configuration unavailable',{status:503});
  if(!verifyPaytrCallback(params,paytr))return new NextResponse('PAYTR notification failed: bad hash',{status:400});
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
      const pendingSubscription=await tx.subscription.findFirst({where:{provider:'PAYTR',providerReference:payment.merchantOid,status:'PENDING'}});
      if(pendingSubscription){
        const startsAt=new Date();
        const endsAt=new Date(startsAt); endsAt.setMonth(endsAt.getMonth()+1);
        await tx.subscription.update({where:{id:pendingSubscription.id},data:{status:'ACTIVE',startsAt,endsAt}});
      }
    });
  } else if (params.status !== 'success' && payment.status === 'PENDING') {
    await db.$transaction([
      db.payment.update({where:{id:payment.id},data:{status:'FAILED',providerPayload:params}}),
      db.subscription.updateMany({where:{provider:'PAYTR',providerReference:payment.merchantOid,status:'PENDING'},data:{status:'FAILED'}})
    ]);
  }
  return new NextResponse('OK');
}

export const POST=withApiErrors(POST__handler);
