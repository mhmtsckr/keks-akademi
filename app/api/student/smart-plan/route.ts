import { withApiErrors,readJson,HttpError } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { buildWeeklyPlan } from '@/lib/smartCoach';
import { isFeatureEnabled } from '@/lib/systemConfig';

const schema=z.object({action:z.enum(['PREVIEW','REQUEST_REVIEW']).default('PREVIEW')});

async function studentContext(){
  const user=await requireRole(['STUDENT']);
  if(!user.student)throw new HttpError(400,'Öğrenci profili yok.');
  if(!(await isFeatureEnabled('SMART_COACH',user.student.studentCode)))
    throw new HttpError(403,'Akıllı Koç bu hesap için etkin değil.');
  return user.student;
}

async function POST__handler(req:Request){
  const student=await studentContext();
  const input=req.headers.get('content-type')?.includes('application/json')
    ?await readJson(req,schema)
    :{action:'PREVIEW' as const};
  const plan=await buildWeeklyPlan(student.id);
  // The student can only prepare a draft: no active study plan is created.
  if(input.action==='PREVIEW'){
    return NextResponse.json({
      ok:true,plan,previewOnly:true,
      note:'Bu bir öneri taslağıdır. Mevcut koç planı değiştirilmedi.'
    },{headers:{'Cache-Control':'private, no-store'}});
  }
  const owner=await db.student.findUnique({where:{id:student.id},select:{coachId:true}});
  if(!owner?.coachId)throw new HttpError(409,'Taslağı değerlendirecek atanmış bir koç bulunmuyor.');
  const existing=await db.coachTask.findFirst({
    where:{studentId:student.id,coachId:owner.coachId,sourceType:'SMART_COACH_PLAN_REVIEW',
      status:'OPEN',createdAt:{gte:new Date(Date.now()-24*3600000)}},
    select:{id:true}
  });
  if(existing)return NextResponse.json({ok:true,reviewRequested:true,alreadyPending:true,coachTaskId:existing.id});
  const preview=plan.days.slice(0,3).flatMap((day:any)=>day.tasks.slice(0,2).map((task:any)=>task.title)).slice(0,6);
  const row=await db.coachTask.create({data:{
    studentId:student.id,coachId:owner.coachId,sourceType:'SMART_COACH_PLAN_REVIEW',
    title:'Akıllı Eğitim Koçu · Haftalık taslak incelemesi',
    description:[
      'Öğrenci haftalık taslağın koç tarafından incelenmesini talep etti.',
      'İlk 3 gün önerileri: '+(preview.join(' · ')||'Kayıt oluşmadı'),
      'Kanıt güveni: '+(plan.evidence?.confidence||'LOW'),
      plan.evidence?.message||'',
      'Taslak hiçbir aktif koç programını değiştirmedi.'
    ].join('\n'),
    priority:'MEDIUM',status:'OPEN',dueAt:new Date(Date.now()+24*3600000)
  }});
  return NextResponse.json({ok:true,reviewRequested:true,alreadyPending:false,coachTaskId:row.id});
}

async function GET__handler(){
  const student=await studentContext();
  const [plan,active]=await Promise.all([
    buildWeeklyPlan(student.id),
    db.studyPlan.findFirst({
      where:{studentId:student.id,active:true,title:{startsWith:'Akıllı Haftalık Program'}},
      orderBy:{createdAt:'desc'},
      select:{id:true,title:true,createdAt:true,payload:true}
    })
  ]);
  // The student's dynamic suggestion is never labeled as the approved plan.
  const stored=active?.payload&&typeof active.payload==='object'&&!Array.isArray(active.payload)
    ?active.payload as Record<string,unknown>:null;
  const days=stored&&Array.isArray(stored.days)?stored.days.slice(0,14):[];
  const activePlan=active?{
    id:active.id,title:active.title,createdAt:active.createdAt,
    days
  }:null;
  return NextResponse.json({ok:true,plan,activePlan,previewOnly:true},
    {headers:{'Cache-Control':'private, no-store'}});
}

export const POST=withApiErrors(POST__handler);
export const GET=withApiErrors(GET__handler);
