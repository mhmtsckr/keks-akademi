import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';

const schema=z.object({
 examLevel:z.enum(['LGS','YKS']),
 institutionName:z.string().min(2).max(200),
 departmentName:z.string().max(200).optional(),
 programCode:z.string().max(50).optional(),
 source:z.enum(['YOKATLAS','MEB','MANUAL']),
 sourceUrl:z.string().url().optional(),
 dataYear:z.number().int().min(2020).max(2100).optional(),
 score:z.number().optional(),
 ranking:z.number().int().optional(),
 percentile:z.number().optional(),
 benchmarkNets:z.record(z.string(),z.number()).optional(),
});

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 const user=await requireRole(['COACH','ADMIN']);
 if(!user.coachProfile) return NextResponse.json({error:'Koç profili yok.'},{status:400});
 const {id}=await params;
 const student=await db.student.findFirst({where:{id,coachId:user.coachProfile.id}});
 if(!student) return NextResponse.json({error:'Öğrenci bulunamadı.'},{status:404});
 const input=schema.parse(await req.json());
 await db.studentTarget.updateMany({where:{studentId:id,active:true},data:{active:false}});
 const row=await db.studentTarget.create({data:{studentId:id,...input,benchmarkNets:input.benchmarkNets||undefined,active:true,syncedAt:new Date()}});
 await db.student.update({where:{id},data:{goal:input.departmentName?input.institutionName+' · '+input.departmentName:input.institutionName}});
 return NextResponse.json({ok:true,row});
}
