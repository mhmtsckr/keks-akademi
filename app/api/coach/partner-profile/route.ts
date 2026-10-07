import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireRole} from '@/lib/auth';
import {readJson,withApiErrors} from '@/lib/apiGuard';
import {db} from '@/lib/db';
import {writeAudit} from '@/lib/audit';
import {ADULT_EXAM_GROUPS} from '@/lib/agsExamOptions';
import {EDUCATION_LEVEL_OPTIONS} from '@/lib/educationLevels';
import {KEKS_PARTNER_OPERATION_STANDARDS,KEKS_PARTNER_SPECIALTIES,KEKS_PARTNER_STANDARD_VERSION} from '@/lib/partnerCoachNetwork';

const allowedLevels=[...EDUCATION_LEVEL_OPTIONS,...ADULT_EXAM_GROUPS] as string[];
const allowedSpecialties=[...KEKS_PARTNER_SPECIALTIES] as string[];

const schema=z.object({
  displayTitle:z.string().trim().max(120).nullable().optional(),
  bio:z.string().trim().max(1000).nullable().optional(),
  specialties:z.array(z.string().trim().min(1).max(120)).max(8),
  supportedEducationLevels:z.array(z.string().trim().min(1).max(120)).min(1).max(20),
  maxActiveStudents:z.number().int().min(1).max(100),
  acceptingStudents:z.boolean()
}).superRefine((value,ctx)=>{
  for(const item of value.specialties){
    if(!allowedSpecialties.includes(item))ctx.addIssue({code:'custom',path:['specialties'],message:'Geçersiz uzmanlık alanı: '+item});
  }
  for(const item of value.supportedEducationLevels){
    if(!allowedLevels.includes(item))ctx.addIssue({code:'custom',path:['supportedEducationLevels'],message:'Geçersiz eğitim düzeyi: '+item});
  }
});

async function GET__handler(){
  const user=await requireRole(['COACH']);
  if(!user.coachProfile)return NextResponse.json({error:'Koç profili bulunamadı.'},{status:404});
  const profile=await db.coachProfile.findUnique({
    where:{id:user.coachProfile.id},
    select:{
      id:true,displayTitle:true,bio:true,specialties:true,supportedEducationLevels:true,
      maxActiveStudents:true,acceptingStudents:true,partnerStatus:true,responseTargetHours:true,
      operationsStandardVersion:true,profileUpdatedAt:true,_count:{select:{students:true}}
    }
  });
  return NextResponse.json({
    ok:true,
    profile,
    options:{specialties:allowedSpecialties,educationLevels:allowedLevels},
    standardVersion:KEKS_PARTNER_STANDARD_VERSION,
    operationStandards:KEKS_PARTNER_OPERATION_STANDARDS
  });
}

async function PATCH__handler(req:Request){
  const user=await requireRole(['COACH']);
  if(!user.coachProfile)return NextResponse.json({error:'Koç profili bulunamadı.'},{status:404});
  const input=await readJson(req,schema);
  const updated=await db.coachProfile.update({
    where:{id:user.coachProfile.id},
    data:{
      displayTitle:input.displayTitle||null,
      bio:input.bio||null,
      specialties:input.specialties,
      supportedEducationLevels:input.supportedEducationLevels,
      maxActiveStudents:input.maxActiveStudents,
      acceptingStudents:input.acceptingStudents,
      operationsStandardVersion:KEKS_PARTNER_STANDARD_VERSION,
      profileUpdatedAt:new Date()
    },
    select:{
      id:true,displayTitle:true,bio:true,specialties:true,supportedEducationLevels:true,
      maxActiveStudents:true,acceptingStudents:true,partnerStatus:true,responseTargetHours:true,
      operationsStandardVersion:true,profileUpdatedAt:true,_count:{select:{students:true}}
    }
  });
  await writeAudit({
    actorUserId:user.id,
    action:'PARTNER_COACH_PROFILE_UPDATED',
    entityType:'CoachProfile',
    entityId:updated.id,
    summary:'KEKS Partner Koç profili ve öğrenci kabul ayarları güncellendi.',
    metadata:{
      specialties:input.specialties,
      supportedEducationLevels:input.supportedEducationLevels,
      maxActiveStudents:input.maxActiveStudents,
      acceptingStudents:input.acceptingStudents,
      standardVersion:KEKS_PARTNER_STANDARD_VERSION
    }
  });
  return NextResponse.json({ok:true,profile:updated});
}

export const GET=withApiErrors(GET__handler);
export const PATCH=withApiErrors(PATCH__handler);
