import { withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';

async function GET__handler(){
  await requireRole(['ADMIN']);
  let database='OK';
  try{await db.$queryRawUnsafe('SELECT 1')}catch{database='ERROR'}
  const recentAudit=await db.auditLog.count({where:{createdAt:{gte:new Date(Date.now()-24*60*60*1000)}}});
  const [gmailConfig,paytrConfig]=await Promise.all([
    db.emailSenderConfig.findUnique({where:{id:'gmail'}}),
    db.paytrConfig.findUnique({where:{id:'paytr'}})
  ]);
  const gmailReady=Boolean(process.env.GMAIL_APP_PASSWORD||gmailConfig?.enabled);
  const paytrEnvReady=Boolean(process.env.PAYTR_MERCHANT_ID&&process.env.PAYTR_MERCHANT_KEY&&process.env.PAYTR_MERCHANT_SALT);
  const paytrReady=Boolean(paytrEnvReady||paytrConfig?.enabled);
  return NextResponse.json({ok:true,health:{
    database,
    authSecret:Boolean(process.env.AUTH_SECRET),
    paytr:paytrReady,
    paytrMerchantId:paytrEnvReady?process.env.PAYTR_MERCHANT_ID:paytrConfig?.merchantId||null,
    paytrTestMode:paytrEnvReady?(process.env.PAYTR_TEST_MODE||'1')==='1':paytrConfig?.testMode??true,
    paytrSource:paytrEnvReady?'ENV':paytrConfig?.enabled?'ADMIN_CONFIG':'NONE',
    emailConfigured:gmailReady,
    gmail:gmailReady,
    gmailAddress:gmailConfig?.email||process.env.KEKS_CONTACT_EMAIL||'keksakademi@gmail.com',
    gmailStatus:gmailReady?'READY':'APP_PASSWORD_REQUIRED',
    reportEmail:gmailReady,
    reportEmailAddress:gmailConfig?.email||process.env.KEKS_CONTACT_EMAIL||'keksakademi@gmail.com',
    reportEmailProvider:'GMAIL',
    reportEmailStatus:gmailReady?'READY':'GMAIL_CONNECTION_REQUIRED',
    appUrl:Boolean(process.env.APP_URL||process.env.VERCEL_URL||process.env.VERCEL_PROJECT_PRODUCTION_URL),
    recentAudit
  }});
}

export const GET = withApiErrors(GET__handler);
