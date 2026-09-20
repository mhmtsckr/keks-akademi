import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { syncOfficialTarget } from '@/lib/officialTargetSync';

const schema=z.object({
 examLevel:z.enum(['LGS','YKS','KPSS','AGS_OBAT']),
 institutionName:z.string().min(2).max(200),
 departmentName:z.string().max(200).optional(),
 programCode:z.string().max(50).optional(),
 source:z.enum(['YOKATLAS','MEB','OSYM','MANUAL']),
 sourceUrl:z.string().url().optional(),
 dataYear:z.number().int().min(2020).max(2100).optional(),
 score:z.number().optional(),
 ranking:z.number().int().optional(),
 percentile:z.number().optional(),
 benchmarkNets:z.record(z.string(),z.number()).optional(),
 qualificationLevel:z.enum(['ORTAOGRETIM','ONLISANS','LISANS']).optional(),
 officialPeriod:z.string().max(50).optional(),
});

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 const user=await requireRole(['COACH','ADMIN']);
 if(!user.coachProfile) return NextResponse.json({error:'Koç profili yok.'},{status:400});
 const {id}=await params;
 const student=await db.student.findFirst({where:{id,coachId:user.coachProfile.id}});
 if(!student) return NextResponse.json({error:'Öğrenci bulunamadı.'},{status:404});
 const input=schema.parse(await req.json());
 await db.studentTarget.updateMany({where:{studentId:id,active:true},data:{active:false}});
 let row=await db.studentTarget.create({data:{
   studentId:id,...input,
   source:input.examLevel==='KPSS'?'OSYM':input.examLevel==='AGS_OBAT'?'MEB':input.source,
   benchmarkNets:input.benchmarkNets||undefined,
   active:true,
   syncedAt:new Date()
 }});
 await db.student.update({where:{id},data:{goal:input.departmentName?input.institutionName+' · '+input.departmentName:input.institutionName}});
 let syncMessage:string|undefined;
 if(input.examLevel==='KPSS'||input.examLevel==='AGS_OBAT'){
   try{
     row=await syncOfficialTarget(row.id);
     syncMessage=row.syncStatus==='SYNCED'?'Resmî hedef verileri otomatik güncellendi.':'Hedef kaydedildi; resmî veri eşleşmesi doğrulama bekliyor.';
   }catch(e:any){
     row=await db.studentTarget.update({where:{id:row.id},data:{syncStatus:'SYNC_ERROR',syncedAt:new Date()}});
     syncMessage='Hedef kaydedildi; resmî kaynak şu anda otomatik okunamadı.';
   }
 }
 return NextResponse.json({ok:true,row,message:syncMessage});
}
