import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';

const schema=z.object({
  recipientLabel:z.string().min(2).max(120),
  expiresDays:z.number().int().min(1).max(365).default(30),
  scope:z.object({
    overview:z.boolean().default(true),
    exams:z.boolean().default(true),
    actions:z.boolean().default(true),
    gamification:z.boolean().default(false)
  })
});

function tokenHash(token:string){return crypto.createHash('sha256').update(token).digest('hex')}

export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireRole(['COACH','ADMIN']);if(!user.coachProfile)return NextResponse.json({error:'Koç profili yok.'},{status:403});
  const {id}=await params;const student=await db.student.findFirst({where:{id,coachId:user.coachProfile.id}});if(!student)return NextResponse.json({error:'Öğrenci bulunamadı.'},{status:404});
  const rows=await db.progressShare.findMany({where:{studentId:id},orderBy:{createdAt:'desc'},take:50});
  return NextResponse.json({ok:true,rows});
}

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireRole(['COACH','ADMIN']);if(!user.coachProfile)return NextResponse.json({error:'Koç profili yok.'},{status:403});
  const {id}=await params;const student=await db.student.findFirst({where:{id,coachId:user.coachProfile.id}});if(!student)return NextResponse.json({error:'Öğrenci bulunamadı.'},{status:404});
  const input=schema.parse(await req.json());
  const token=crypto.randomBytes(24).toString('base64url');
  const row=await db.progressShare.create({data:{studentId:id,createdByUserId:user.id,recipientLabel:input.recipientLabel,scope:input.scope,tokenHash:tokenHash(token),expiresAt:new Date(Date.now()+input.expiresDays*86400000)}});
  const base=process.env.APP_URL||('https://'+(process.env.VERCEL_PROJECT_PRODUCTION_URL||process.env.VERCEL_URL||'localhost:3000'));
  return NextResponse.json({ok:true,id:row.id,url:base+'/paylasim/'+token});
}

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireRole(['COACH','ADMIN']);if(!user.coachProfile)return NextResponse.json({error:'Koç profili yok.'},{status:403});
  const {id}=await params;const body=await req.json();const share=await db.progressShare.findFirst({where:{id:body.shareId,student:{id,coachId:user.coachProfile.id}}});if(!share)return NextResponse.json({error:'Paylaşım bulunamadı.'},{status:404});
  const row=await db.progressShare.update({where:{id:share.id},data:{revokedAt:new Date()}});
  return NextResponse.json({ok:true,row});
}
