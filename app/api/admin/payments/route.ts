import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { writeAudit } from '@/lib/audit';

const patch=z.object({paymentId:z.string(),status:z.enum(['PENDING','PAID','FAILED','REFUNDED'])});

export async function GET(req:Request){
  await requireRole(['ADMIN']);
  const {searchParams}=new URL(req.url);
  const status=searchParams.get('status') as any;
  const where:any={};
  if(status&&['PENDING','PAID','FAILED','REFUNDED'].includes(status))where.status=status;
  const payments=await db.payment.findMany({
    where,orderBy:{createdAt:'desc'},take:200,
    include:{student:{select:{fullName:true,studentCode:true}}}
  });
  const totals=await db.payment.groupBy({by:['status'],_count:{_all:true},_sum:{amountKurus:true}});
  return NextResponse.json({ok:true,payments,totals});
}

export async function PATCH(req:Request){
  const admin=await requireRole(['ADMIN']);
  const input=patch.parse(await req.json());
  const before=await db.payment.findUnique({where:{id:input.paymentId}});
  if(!before)return NextResponse.json({error:'Ödeme bulunamadı.'},{status:404});
  const row=await db.payment.update({where:{id:input.paymentId},data:{status:input.status}});
  await writeAudit({actorUserId:admin.id,action:'PAYMENT_STATUS_UPDATE',entityType:'Payment',entityId:row.id,summary:'Ödeme durumu '+input.status+' olarak güncellendi.',metadata:{merchantOid:row.merchantOid,before:before.status,after:row.status}});
  return NextResponse.json({ok:true,row});
}
