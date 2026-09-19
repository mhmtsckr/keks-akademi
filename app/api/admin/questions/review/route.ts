import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { writeAudit } from '@/lib/audit';

const patch=z.object({
  id:z.string(),
  action:z.enum(['APPROVE','REJECT','PENDING']),
  note:z.string().max(1000).optional()
});

export async function GET(req:Request){
  await requireRole(['ADMIN']);
  const {searchParams}=new URL(req.url);
  const status=searchParams.get('status')||'PENDING';
  const where:any={};
  if(status!=='ALL')where.reviewStatus=status;
  const items=await db.questionBankItem.findMany({where,orderBy:{createdAt:'desc'},take:200});
  const counts=await db.questionBankItem.groupBy({by:['reviewStatus'],_count:{_all:true}});
  return NextResponse.json({ok:true,items,counts});
}

export async function PATCH(req:Request){
  const admin=await requireRole(['ADMIN']);
  const input=patch.parse(await req.json());
  const row=await db.questionBankItem.findUnique({where:{id:input.id}});
  if(!row)return NextResponse.json({error:'Soru bulunamadı.'},{status:404});
  const status=input.action==='APPROVE'?'APPROVED':input.action==='REJECT'?'REJECTED':'PENDING';
  const updated=await db.questionBankItem.update({where:{id:input.id},data:{
    reviewStatus:status,
    reviewedAt:status==='PENDING'?null:new Date(),
    reviewedByUserId:status==='PENDING'?null:admin.id,
    reviewNote:input.note||null,
    active:status==='APPROVED'
  }});
  await writeAudit({actorUserId:admin.id,action:'QUESTION_REVIEW',entityType:'QuestionBankItem',entityId:updated.id,summary:'Soru '+status+' durumuna alındı.',metadata:{subject:updated.subject,topic:updated.topic,note:input.note||null}});
  return NextResponse.json({ok:true,item:updated});
}
