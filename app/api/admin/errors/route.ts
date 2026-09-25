import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { withApiErrors } from '@/lib/apiGuard';

function meta(v:unknown){return v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{}}

async function GET__handler(req:Request){
  await requireRole(['ADMIN']);
  const q=(new URL(req.url).searchParams.get('q')||'').trim().toLowerCase();
  const rows=await db.auditLog.findMany({
    where:{action:'API_ERROR_500',entityType:'ApiError'},
    orderBy:{createdAt:'desc'},
    take:150,
    select:{id:true,entityId:true,summary:true,metadata:true,createdAt:true}
  });
  const errors=rows.map(row=>{
    const m=meta(row.metadata);
    return {
      id:row.id,
      requestId:String(m.requestId||row.entityId||''),
      endpoint:String(m.endpoint||'unknown'),
      method:String(m.method||'UNKNOWN'),
      errorClass:String(m.errorClass||'UnknownError'),
      errorCode:m.errorCode?String(m.errorCode):null,
      message:m.message?String(m.message):null,
      environment:m.environment?String(m.environment):null,
      deployment:m.deployment?String(m.deployment):null,
      createdAt:row.createdAt
    };
  }).filter(x=>!q||[x.requestId,x.endpoint,x.method,x.errorClass,x.errorCode||''].some(v=>v.toLowerCase().includes(q)));
  return NextResponse.json({ok:true,errors:errors.slice(0,100)});
}

export const GET=withApiErrors(GET__handler);
