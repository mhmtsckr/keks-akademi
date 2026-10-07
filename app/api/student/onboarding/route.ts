import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireRole} from '@/lib/auth';
import {readJson,withApiErrors} from '@/lib/apiGuard';
import {db} from '@/lib/db';
import {encodeResourceMeta} from '@/lib/resourceTracking';
import {publicEducationContext,resolveEducationLevelProfile} from '@/lib/educationLevelProfile';
import {buildPartnerCoachDirectory} from '@/lib/partnerCoachNetwork';
import {
  buildSevenDayStarterPlan,
  defaultExamTypeForOnboarding,
  studentOnboardingState,
  subjectsForOnboarding,
  STUDENT_ONBOARDING_VERSION
} from '@/lib/studentOnboarding';
import {writeAudit} from '@/lib/audit';

const resourceSchema=z.object({
  title:z.string().trim().min(2).max(160),
  subject:z.string().trim().min(2).max(80),
  publisher:z.string().trim().max(120).optional().nullable()
});

const examSchema=z.object({
  examType:z.string().trim().min(1).max(40),
  totalNet:z.number().min(-100).max(500),
  durationMinutes:z.number().int().min(1).max(600).optional().nullable()
});

const completeSchema=z.object({
  action:z.literal('complete'),
  goal:z.string().trim().min(3).max(240),
  gradeLevel:z.string().trim().min(1).max(100),
  academicTrack:z.string().trim().max(120).optional().nullable(),
  dailyMinutes:z.number().int().min(30).max(480),
  weakSubjects:z.array(z.string().trim().min(1).max(80)).min(1).max(5),
  resources:z.array(resourceSchema).max(8),
  lastExam:examSchema.optional().nullable(),
  preferredDays:z.array(z.enum(['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar'])).min(1).max(7),
  studyStart:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  studyEnd:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  coachId:z.string().min(1)
}).superRefine((value,ctx)=>{
  if(value.studyEnd<=value.studyStart){
    ctx.addIssue({code:'custom',path:['studyEnd'],message:'Çalışma bitiş saati başlangıç saatinden sonra olmalıdır.'});
  }
});

function obj(value:unknown){
  return value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,any>:{};
}

async function GET__handler(){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const student=await db.student.findUnique({
    where:{id:user.student.id},
    select:{id:true,gradeLevel:true,academicTrack:true,goal:true,coachId:true,profile:true}
  });
  if(!student)return NextResponse.json({error:'Öğrenci bulunamadı.'},{status:404});
  const education=resolveEducationLevelProfile(student.gradeLevel,student.academicTrack);
  return NextResponse.json({
    ok:true,
    state:studentOnboardingState(student.profile),
    student:{
      gradeLevel:student.gradeLevel,
      academicTrack:student.academicTrack,
      goal:student.goal,
      coachId:student.coachId
    },
    subjects:subjectsForOnboarding(student.gradeLevel,student.academicTrack),
    educationContext:publicEducationContext(education)
  });
}

async function POST__handler(req:Request){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const input=await readJson(req,completeSchema);

  const student=await db.student.findUnique({
    where:{id:user.student.id},
    select:{id:true,profile:true,academicTrack:true,coachId:true}
  });
  if(!student)return NextResponse.json({error:'Öğrenci bulunamadı.'},{status:404});

  const currentState=studentOnboardingState(student.profile);
  if(currentState.status==='COMPLETED'){
    const existing=currentState.starterPlanId
      ?await db.studyPlan.findFirst({where:{id:currentState.starterPlanId,studentId:student.id}})
      :await db.studyPlan.findFirst({where:{studentId:student.id,title:'İlk 7 Günlük Başlangıç Planı'},orderBy:{createdAt:'desc'}});
    return NextResponse.json({ok:true,alreadyCompleted:true,plan:existing?.payload||null});
  }

  const effectiveAcademicTrack=(input.academicTrack||student.academicTrack||'').trim()||null;
  const education=resolveEducationLevelProfile(input.gradeLevel,effectiveAcademicTrack);
  if(['HIGH_11','HIGH_12','GRADUATE_YKS'].includes(education?.key||'')&&!effectiveAcademicTrack){
    return NextResponse.json({error:'Bu eğitim düzeyi için alan seçimi gereklidir.'},{status:400});
  }

  const partnerCoaches=await buildPartnerCoachDirectory({
    gradeLevel:input.gradeLevel,
    academicTrack:effectiveAcademicTrack,
    currentCoachId:student.coachId
  });
  const coach=partnerCoaches.find(x=>x.id===input.coachId)||null;
  if(!coach)return NextResponse.json({error:'Seçilen Partner Koç bu eğitim düzeyi için uygun, aktif veya açık kontenjanlı değil.'},{status:400});

  const allowedSubjects=subjectsForOnboarding(input.gradeLevel,effectiveAcademicTrack);
  const invalidWeak=input.weakSubjects.filter(x=>!allowedSubjects.includes(x));
  const invalidResources=input.resources.filter(x=>!allowedSubjects.includes(x.subject));
  if(invalidWeak.length||invalidResources.length){
    return NextResponse.json({error:'Zayıf ders veya kaynak dersi seçilen eğitim düzeyiyle uyumlu değil.'},{status:400});
  }

  const maxDaily=education?.study.maxDailyMinutes||480;
  if(input.dailyMinutes>maxDaily){
    return NextResponse.json({error:'Bu eğitim düzeyi için günlük süre çok yüksek. En fazla '+maxDaily+' dakika seçin.'},{status:400});
  }

  const starterPlan=buildSevenDayStarterPlan({
    gradeLevel:input.gradeLevel,
    academicTrack:effectiveAcademicTrack,
    goal:input.goal,
    dailyMinutes:input.dailyMinutes,
    weakSubjects:input.weakSubjects,
    resources:input.resources,
    preferredDays:input.preferredDays,
    studyStart:input.studyStart,
    studyEnd:input.studyEnd,
    lastExam:input.lastExam
  });
  const resourceExamType=input.lastExam?.examType||defaultExamTypeForOnboarding(input.gradeLevel);

  const result=await db.$transaction(async tx=>{
    const plan=await tx.studyPlan.create({
      data:{
        studentId:student.id,
        title:'İlk 7 Günlük Başlangıç Planı',
        payload:starterPlan as any,
        active:true
      }
    });

    if(input.resources.length){
      await tx.libraryItem.createMany({
        data:input.resources.map(resource=>({
          studentId:student.id,
          title:resource.title,
          note:encodeResourceMeta({
            examType:resourceExamType,
            subject:resource.subject,
            publisher:resource.publisher||null,
            totalPages:null
          }),
          createdByUserId:user.id
        }))
      });
    }

    if(input.lastExam){
      await tx.examResult.create({
        data:{
          studentId:student.id,
          examType:input.lastExam.examType,
          payload:{
            net:input.lastExam.totalNet,
            totalNet:input.lastExam.totalNet,
            ...(input.lastExam.durationMinutes?{usedDurationMinutes:input.lastExam.durationMinutes}:{}),
            entryMode:'FIRST_LOGIN_WIZARD'
          }
        }
      });
    }

    const actions=starterPlan.days.flatMap(day=>day.tasks.map((task:any,index:number)=>{
      const periodStart=new Date(day.date+'T'+input.studyStart+':00+03:00');
      const periodEnd=new Date(periodStart.getTime()+24*60*60*1000);
      return {
        studentId:student.id,
        createdByUserId:user.id,
        title:task.title,
        description:task.reason+' · Başlangıç planı '+day.day+'. gün / görev '+(index+1),
        metricType:task.questions>0?'QUESTIONS':'MINUTES',
        targetValue:task.questions>0?task.questions:task.minutes,
        currentValue:0,
        cadence:'DAILY',
        periodStart,
        periodEnd,
        status:'ACTIVE',
        subject:task.subject==='Genel'?null:task.subject,
        topic:null,
        taskDate:periodStart,
        planSource:'ONBOARDING_V1'
      };
    }));
    if(actions.length)await tx.coachingAction.createMany({data:actions});

    const root=obj(student.profile);
    const completedAt=new Date().toISOString();
    const profile={
      ...root,
      educationContext:publicEducationContext(education),
      plannedDailyMinutes:input.dailyMinutes,
      preferredStudyHours:{start:input.studyStart,end:input.studyEnd,days:input.preferredDays},
      weakSubjects:input.weakSubjects,
      onboarding:{
        version:STUDENT_ONBOARDING_VERSION,
        status:'COMPLETED',
        completedAt,
        starterPlanId:plan.id,
        inputs:{
          goal:input.goal,
          gradeLevel:input.gradeLevel,
          dailyMinutes:input.dailyMinutes,
          weakSubjects:input.weakSubjects,
          resources:input.resources.map(x=>({title:x.title,subject:x.subject,publisher:x.publisher||null})),
          lastExam:input.lastExam||null,
          preferredDays:input.preferredDays,
          studyStart:input.studyStart,
          studyEnd:input.studyEnd,
          coachId:coach.id
        }
      }
    };

    await tx.student.update({
      where:{id:student.id},
      data:{
        goal:input.goal,
        gradeLevel:input.gradeLevel,
        academicTrack:effectiveAcademicTrack,
        coachId:coach.id,
        profile:profile as any
      }
    });

    return {planId:plan.id,completedAt};
  });

  await writeAudit({
    actorUserId:user.id,
    action:'STUDENT_FIRST_LOGIN_ONBOARDING_COMPLETED',
    entityType:'Student',
    entityId:student.id,
    summary:'İlk giriş sihirbazı tamamlandı ve İlk 7 Günlük Başlangıç Planı üretildi.',
    metadata:{
      version:STUDENT_ONBOARDING_VERSION,
      gradeLevel:input.gradeLevel,
      academicTrack:effectiveAcademicTrack,
      dailyMinutes:input.dailyMinutes,
      weakSubjects:input.weakSubjects,
      resourceCount:input.resources.length,
      hasBaselineExam:Boolean(input.lastExam),
      coachId:coach.id,
      starterPlanId:result.planId
    }
  });

  return NextResponse.json({
    ok:true,
    planId:result.planId,
    completedAt:result.completedAt,
    coach:{id:coach.id,name:coach.name},
    plan:starterPlan
  });
}

export const GET=withApiErrors(GET__handler);
export const POST=withApiErrors(POST__handler);
