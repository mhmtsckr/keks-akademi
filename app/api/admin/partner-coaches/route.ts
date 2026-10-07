import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireRole} from '@/lib/auth';
import {readJson,withApiErrors} from '@/lib/apiGuard';
import {db} from '@/lib/db';
import {writeAudit} from '@/lib/audit';
import {buildCoachQualityOperationsBatch} from '@/lib/coachQualityOperations';

function list(value:unknown){
  return Array.isArray(value)?value.filter((x):x is string=>typeof x==='string'):[];
}

const patchSchema=z.object({
  coachId:z.string().min(1),
  partnerStatus:z.enum(['ACTIVE','PAUSED','REVIEW']),
  acceptingStudents:z.boolean().optional()
});

async function GET__handler(){
  await requireRole(['ADMIN']);
  const coaches=await db.coachProfile.findMany({
    where:{user:{role:'COACH'}},
    select:{
      id:true,displayTitle:true,bio:true,specialties:true,supportedEducationLevels:true,
      maxActiveStudents:true,acceptingStudents:true,partnerStatus:true,responseTargetHours:true,
      operationsStandardVersion:true,profileUpdatedAt:true,createdAt:true,
      user:{select:{id:true,name:true,email:true,status:true}},
      _count:{select:{students:true}}
    },
    orderBy:{user:{name:'asc'}},
    take:100
  });

  const qualityByCoach=await buildCoachQualityOperationsBatch(coaches.map(x=>x.id));
  const rows=coaches.map(coach=>{
    const quality=qualityByCoach[coach.id];
    const response=quality?.metrics.find(x=>x.key==='RESPONSE_TIME')||null;
    const sessions=quality?.metrics.find(x=>x.key==='SESSION_COMPLETION')||null;
    const specialties=list(coach.specialties);
    const levels=list(coach.supportedEducationLevels);
    const completeness=[
      Boolean(coach.displayTitle?.trim()),
      Boolean(coach.bio?.trim()&&coach.bio.trim().length>=30),
      specialties.length>0,
      levels.length>0
    ].filter(Boolean).length*25;
    return {
      id:coach.id,
      user:coach.user,
      displayTitle:coach.displayTitle,
      specialties,
      supportedEducationLevels:levels,
      maxActiveStudents:coach.maxActiveStudents,
      studentCount:coach._count.students,
      availableSlots:Math.max(0,coach.maxActiveStudents-coach._count.students),
      acceptingStudents:coach.acceptingStudents,
      partnerStatus:coach.partnerStatus,
      responseTargetHours:coach.responseTargetHours,
      responseTime:response?.value||'Veri yok',
      responseStatus:response?.status||'NO_DATA',
      sessionCompletion:sessions?.value||'Veri yok',
      sessionStatus:sessions?.status||'NO_DATA',
      standardsMet:quality?.summary?.standardsMet||0,
      standardsMeasured:quality?.summary?.standardsMeasured||0,
      operationalSamples:quality?.summary?.operationalSamples||0,
      profileCompleteness:completeness,
      operationsStandardVersion:coach.operationsStandardVersion,
      profileUpdatedAt:coach.profileUpdatedAt
    };
  });

  return NextResponse.json({ok:true,coaches:rows});
}

async function PATCH__handler(req:Request){
  const admin=await requireRole(['ADMIN']);
  const input=await readJson(req,patchSchema);
  const before=await db.coachProfile.findUnique({
    where:{id:input.coachId},
    select:{id:true,partnerStatus:true,acceptingStudents:true,user:{select:{name:true,role:true}}}
  });
  if(!before||before.user.role!=='COACH')return NextResponse.json({error:'Partner Koç bulunamadı.'},{status:404});

  const updated=await db.coachProfile.update({
    where:{id:input.coachId},
    data:{
      partnerStatus:input.partnerStatus,
      ...(typeof input.acceptingStudents==='boolean'?{acceptingStudents:input.acceptingStudents}:{})
    },
    select:{id:true,partnerStatus:true,acceptingStudents:true}
  });

  await writeAudit({
    actorUserId:admin.id,
    action:'PARTNER_COACH_NETWORK_STATUS_UPDATED',
    entityType:'CoachProfile',
    entityId:updated.id,
    summary:before.user.name+' Partner Koç ağ durumu '+updated.partnerStatus+' olarak güncellendi.',
    metadata:{
      before:{partnerStatus:before.partnerStatus,acceptingStudents:before.acceptingStudents},
      after:{partnerStatus:updated.partnerStatus,acceptingStudents:updated.acceptingStudents}
    }
  });

  return NextResponse.json({ok:true,coach:updated});
}

export const GET=withApiErrors(GET__handler);
export const PATCH=withApiErrors(PATCH__handler);
