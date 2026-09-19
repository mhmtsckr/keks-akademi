import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { refreshCoachAlerts } from '@/lib/analytics';

export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
 const user=await requireRole(['COACH','ADMIN']);
 if(!user.coachProfile) return NextResponse.json({error:'Koç profili yok.'},{status:400});
 const {id}=await params;
 const student=await db.student.findFirst({where:{id,coachId:user.coachProfile.id}});
 if(!student) return NextResponse.json({error:'Öğrenci bulunamadı.'},{status:404});
 const insights=await refreshCoachAlerts(id);
 return NextResponse.json({ok:true,insights});
}
const patchSchema=z.object({alertId:z.string(),resolved:z.boolean()});
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
 const user=await requireRole(['COACH','ADMIN']);
 if(!user.coachProfile) return NextResponse.json({error:'Koç profili yok.'},{status:400});
 const {id}=await params;
 const student=await db.student.findFirst({where:{id,coachId:user.coachProfile.id}});
 if(!student) return NextResponse.json({error:'Öğrenci bulunamadı.'},{status:404});
 const input=patchSchema.parse(await req.json());
 const alert=await db.coachAlert.findFirst({where:{id:input.alertId,studentId:id}});
 if(!alert) return NextResponse.json({error:'Uyarı bulunamadı.'},{status:404});
 const row=await db.coachAlert.update({where:{id:alert.id},data:{resolved:input.resolved,resolvedAt:input.resolved?new Date():null}});
 return NextResponse.json({ok:true,row});
}
