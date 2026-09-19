import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(){
  await requireRole(['ADMIN']);
  let database='OK';
  try{await db.$queryRawUnsafe('SELECT 1')}catch{database='ERROR'}
  const recentAudit=await db.auditLog.count({where:{createdAt:{gte:new Date(Date.now()-24*60*60*1000)}}});
  return NextResponse.json({ok:true,health:{
    database,
    authSecret:Boolean(process.env.AUTH_SECRET),
    paytr:Boolean(process.env.PAYTR_MERCHANT_ID&&process.env.PAYTR_MERCHANT_KEY&&process.env.PAYTR_MERCHANT_SALT),
    resend:Boolean(process.env.RESEND_API_KEY&&process.env.REPORT_FROM),
    appUrl:Boolean(process.env.APP_URL||process.env.VERCEL_URL||process.env.VERCEL_PROJECT_PRODUCTION_URL),
    recentAudit
  }});
}
