import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { encryptPrivateCode } from '@/lib/security';
import { writeAudit } from '@/lib/audit';
import { readJson,withApiErrors } from '@/lib/apiGuard';

const schema=z.object({
  merchantId:z.string().trim().min(2).max(64),
  merchantKey:z.string().trim().min(8).max(256),
  merchantSalt:z.string().trim().min(8).max(256),
  testMode:z.boolean().default(true)
});

async function GET__handler(){
  await requireRole(['ADMIN']);
  const envReady=Boolean(process.env.PAYTR_MERCHANT_ID&&process.env.PAYTR_MERCHANT_KEY&&process.env.PAYTR_MERCHANT_SALT);
  const config=await db.paytrConfig.findUnique({where:{id:'paytr'}});
  return NextResponse.json({
    ok:true,
    configured:Boolean(envReady||config?.enabled),
    merchantId:envReady?process.env.PAYTR_MERCHANT_ID:config?.merchantId||null,
    testMode:envReady?(process.env.PAYTR_TEST_MODE||'1')==='1':config?.testMode??true,
    source:envReady?'ENV':config?.enabled?'ADMIN_CONFIG':'NONE',
    updatedAt:config?.updatedAt||null
  });
}

async function POST__handler(req:Request){
  const admin=await requireRole(['ADMIN']);
  const input=await readJson(req,schema);

  await db.paytrConfig.upsert({
    where:{id:'paytr'},
    update:{
      merchantId:input.merchantId,
      merchantKeyCiphertext:encryptPrivateCode(input.merchantKey),
      merchantSaltCiphertext:encryptPrivateCode(input.merchantSalt),
      testMode:input.testMode,
      enabled:true
    },
    create:{
      id:'paytr',
      merchantId:input.merchantId,
      merchantKeyCiphertext:encryptPrivateCode(input.merchantKey),
      merchantSaltCiphertext:encryptPrivateCode(input.merchantSalt),
      testMode:input.testMode,
      enabled:true
    }
  });

  await writeAudit({
    actorUserId:admin.id,
    action:'PAYTR_CONFIG_UPDATED',
    entityType:'PaytrConfig',
    entityId:'paytr',
    summary:'PayTR ödeme entegrasyonu yönetici panelinden yapılandırıldı.',
    metadata:{merchantId:input.merchantId,testMode:input.testMode}
  });

  return NextResponse.json({
    ok:true,
    merchantId:input.merchantId,
    testMode:input.testMode,
    message:'PayTR kimlik bilgileri şifreli olarak kaydedildi. Ödeme başlatma ve callback doğrulaması bu yapılandırmayı kullanacak.'
  });
}

export const GET=withApiErrors(GET__handler);
export const POST=withApiErrors(POST__handler);
