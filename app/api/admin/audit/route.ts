import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req:Request){
  await requireRole(['ADMIN']);
  const {searchParams}=new URL(req.url);
  const q=(searchParams.get('q')||'').trim();
  const where:any={};
  if(q)where.OR=[{action:{contains:q,mode:'insensitive'}},{entityType:{contains:q,mode:'insensitive'}},{summary:{contains:q,mode:'insensitive'}}];
  const logs=await db.auditLog.findMany({
    where,orderBy:{createdAt:'desc'},take:250,
    include:{actor:{select:{name:true,email:true,role:true}}}
  });
  return NextResponse.json({ok:true,logs});
}
