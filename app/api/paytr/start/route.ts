import { readJson, withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { createPaytrToken,resolvePaytrCredentials } from '@/lib/paytr';
import { merchantOid } from '@/lib/security';
import { turkeyMonthWindow } from '@/lib/monthlyAccess';
import { keksMonthlyProduct,productKeyFromReport } from '@/lib/monthlyProduct';

const schema = z.object({
  email: z.string().email(),
  userName: z.string().min(2).max(120),
  userAddress: z.string().min(5).max(400),
  userPhone: z.string().min(7).max(30),
});

async function POST__handler(req: Request) {
  const user = await requireRole(['STUDENT']);
  if (!user.student) return NextResponse.json({ error: 'Öğrenci profili yok.' }, { status: 400 });

  const paytr=await resolvePaytrCredentials();
  const appUrl=process.env.APP_URL||(process.env.VERCEL_PROJECT_PRODUCTION_URL?`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`:process.env.VERCEL_URL?`https://${process.env.VERCEL_URL}`:'');
  if(!paytr||!appUrl){
    return NextResponse.json({error:'PayTR henüz yapılandırılmadı.'},{status:503});
  }
  const merchantId=paytr.merchantId;
  const input = await readJson(req, schema);
  const now=new Date();
  const month=turkeyMonthWindow(now);
  const product=keksMonthlyProduct(now);

  const [existingPayment,existingAccess,latestAssessment]=await Promise.all([
    db.payment.findFirst({
      where:{studentId:user.student.id,createdAt:{gte:month.start,lt:month.end},status:{in:['PENDING','PAID']}},
      orderBy:{createdAt:'desc'}
    }),
    db.testAccess.findFirst({
      where:{studentId:user.student.id,createdAt:{gte:month.start,lt:month.end},status:{in:['READY','USED']}},
      orderBy:{createdAt:'desc'}
    }),
    db.assessment.findFirst({
      where:{studentId:user.student.id},
      orderBy:{completedAt:'desc'},
      select:{completedAt:true,report:true}
    })
  ]);

  if(existingAccess||latestAssessment&&productKeyFromReport(latestAssessment.report,latestAssessment.completedAt)===product.key){
    return NextResponse.json({error:'Bu ayın KEKS test ürünü hesabınızda zaten tanımlı veya tamamlanmış. Aynı aylık ürün ikinci kez satın alınamaz.',product},{status:409});
  }
  if(existingPayment){
    return NextResponse.json({error:existingPayment.status==='PAID'?'Bu ayın ürünü için ödemeniz zaten alınmış.':'Bu ayın ürünü için devam eden bir ödeme kaydınız var. Yeni ödeme başlatılamaz.',product},{status:409});
  }

  const amountKurus = product.priceKurus;
  const oid = merchantOid();
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
  const testMode=paytr.testMode;
  const noInstallment = '1';
  const maxInstallment = '0';
  const currency = 'TL';
  const basketJson = JSON.stringify([[product.name, (amountKurus / 100).toFixed(2), 1]]);
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
  },paytr);

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
    product
  });
}

export const POST = withApiErrors(POST__handler);
