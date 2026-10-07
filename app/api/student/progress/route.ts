import { readJson, withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { calcNet } from '@/lib/performance';
import { REVIEW_DAYS } from '@/lib/smartCoach';
import { calculateLearningSnapshot } from '@/lib/learningModel';
import { inferPracticeErrorReason } from '@/lib/learningEngine';
import {findCurriculumPath,getEducationCurriculum} from '@/lib/educationCurriculumMap';

const TOPIC_REVIEW_SOURCE='TOPIC_REVIEW_01371428';

function turkeyDayStart(offsetDays=0){
 const key=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const d=new Date(key+'T00:00:00+03:00');
 d.setUTCDate(d.getUTCDate()+offsetDays);
 return d;
}

const schema=z.discriminatedUnion('action',[
 z.object({action:z.literal('topic'),examType:z.string().min(2),subject:z.string().min(2),topic:z.string().min(2),completed:z.boolean()}),
 z.object({action:z.literal('practice'),examType:z.string().min(2),subject:z.string().min(2),unit:z.string().max(200).optional(),topic:z.string().optional(),subTopic:z.string().max(160).optional(),acquisition:z.string().max(400).optional(),acquisitionId:z.string().max(120).optional(),correct:z.number().int().min(0),wrong:z.number().int().min(0),blank:z.number().int().min(0),errorReason:z.enum(['BILGI_EKSIKLIGI','ISLEM_HATASI','DIKKAT','SORU_KOKU','SURE','YONTEM_BILMEME','UNUTMA']).optional(),durationSeconds:z.number().int().min(0).max(7200).optional(),questionType:z.string().max(120).optional(),problemType:z.string().max(120).optional(),activeRecallScore:z.number().min(0).max(100).optional(),reviewSuccessScore:z.number().min(0).max(100).optional(),connectionScore:z.number().min(0).max(100).optional(),conceptScore:z.number().min(0).max(100).optional(),misconception:z.string().max(300).optional(),difficulty:z.number().int().min(1).max(5).optional()}),
]);

async function POST__handler(req:Request){
 const user=await requireRole(['STUDENT']);
 if(!user.student) return NextResponse.json({error:'Öğrenci profili bulunamadı.'},{status:400});
 const studentId:string=user.student.id;
 const input=await readJson(req, schema);
 if(input.action==='topic'){
   const completedAt=input.completed?new Date():null;
   const row=await db.$transaction(async tx=>{
    const progress=await tx.topicProgress.upsert({
      where:{studentId_examType_subject_topic:{studentId:studentId,examType:input.examType,subject:input.subject,topic:input.topic}},
      create:{studentId:studentId,examType:input.examType,subject:input.subject,topic:input.topic,completed:input.completed,completedAt},
      update:{completed:input.completed,completedAt},
    });

    await tx.coachingAction.updateMany({
      where:{
        studentId:studentId,
        subject:input.subject,
        topic:input.topic,
        planSource:TOPIC_REVIEW_SOURCE,
        status:'ACTIVE'
      },
      data:{status:'CANCELLED'}
    });

    if(input.completed){
      for(const day of REVIEW_DAYS){
        const taskDate=turkeyDayStart(day);
        const periodEnd=new Date(taskDate);periodEnd.setUTCDate(periodEnd.getUTCDate()+1);
        await tx.coachingAction.create({data:{
          studentId:studentId,
          createdByUserId:user.id,
          title:`${input.subject} · ${input.topic} · ${day}. gün konu tekrarı`,
          description:`0–1–3–7–14–28. Gün Tekrar Sistemi · ${day}. gün · ${input.subject} / ${input.topic}`,
          metricType:'COUNT',
          targetValue:1,
          currentValue:0,
          cadence:'SPACED_REVIEW',
          periodStart:taskDate,
          periodEnd,
          subject:input.subject,
          topic:input.topic,
          taskDate,
          planSource:TOPIC_REVIEW_SOURCE
        }});
      }
    }
    return progress;
   });

   const reviewSchedule=input.completed?REVIEW_DAYS.map(day=>({
     day,
     label:day+'. gün',
     date:turkeyDayStart(day).toISOString()
   })):[];
   return NextResponse.json({ok:true,row,reviewSchedule});
 }
 const curriculum=getEducationCurriculum(user.student.gradeLevel,user.student.academicTrack);
 const selectedPath=input.examType===curriculum?.examType?findCurriculumPath({
   curriculum,
   subject:input.subject,
   unit:input.unit,
   topic:input.topic,
   subTopic:input.subTopic,
   acquisition:input.acquisitionId||input.acquisition,
   questionType:input.questionType||input.problemType
 }):null;
 if(input.examType===curriculum?.examType&&!selectedPath){
   return NextResponse.json({error:'Seçilen ders/ünite/konu/kazanım yolu bu eğitim düzeyinin müfredat haritasında bulunmuyor.'},{status:400});
 }
 const canonical={
   unit:selectedPath?.unit||input.unit||null,
   topic:selectedPath?.topic||input.topic||null,
   subTopic:selectedPath?.subTopic||input.subTopic||null,
   acquisition:selectedPath?.acquisition||input.acquisition||null,
   acquisitionId:selectedPath?.acquisitionId||input.acquisitionId||null,
   questionType:selectedPath?.questionType||input.questionType||null,
   sourceUrl:selectedPath?.sourceUrl||null
 };
 const total=input.correct+input.wrong+input.blank;
 const net=calcNet(input.correct,input.wrong);
 const inferredReason=input.errorReason||inferPracticeErrorReason(input);
 if(input.wrong>0&&!inferredReason){
   return NextResponse.json({
     error:'Yanlış sorular için neden seçin veya sistemin çıkarım yapabilmesi için süre/kavram/tekrar verisi girin.'
   },{status:400});
 }
 const errorReasonSource=input.errorReason?'STUDENT':'SYSTEM';
 const since=new Date(Date.now()-28*86400000);
 const learningLogs=await db.dailyLog.findMany({
   where:{studentId,date:{gte:since}},orderBy:{date:'desc'},take:120,select:{date:true,payload:true}
 });
 const history=learningLogs.flatMap(log=>{
   const p=(log.payload&&typeof log.payload==='object'&&!Array.isArray(log.payload)?log.payload:{}) as Record<string,any>;
   if(p.type!=='LEARNING_METRIC'||p.examType!==input.examType||p.subject!==input.subject)return [];
   if((canonical.topic||'')!==String(p.topic||''))return [];
   if(canonical.acquisitionId&&String(p.acquisitionId||'')!==canonical.acquisitionId)return [];
   return [{date:log.date,masteryScore:typeof p.masteryScore==='number'?p.masteryScore:null,metricPayload:p}];
 });
 const snapshot=calculateLearningSnapshot({...input,topic:canonical.topic||undefined,questionType:canonical.questionType||undefined},history);
 const metricPayload={
   type:'LEARNING_METRIC',
   examType:input.examType,
   subject:input.subject,
   educationLevelKey:curriculum?.educationLevelKey||null,
   educationLevelLabel:curriculum?.educationLevelLabel||user.student.gradeLevel||null,
   unit:canonical.unit,
   topic:canonical.topic,
   durationSeconds:input.durationSeconds??null,
   subTopic:canonical.subTopic,
   acquisition:canonical.acquisition,
   acquisitionId:canonical.acquisitionId,
   questionType:canonical.questionType,
   curriculumSourceUrl:canonical.sourceUrl,
   problemType:input.problemType||null,
   activeRecallScore:input.activeRecallScore??null,
   reviewSuccessScore:input.reviewSuccessScore??null,
   connectionScore:input.connectionScore??null,
   conceptScore:input.conceptScore??null,
   misconception:input.misconception||null,
   difficulty:input.difficulty??null,
   masteryScore:snapshot.score,
   masteryState:snapshot.state,
   diagnostics:snapshot.diagnostics,
   nextAction:snapshot.nextAction,
   priority:snapshot.priority,
   errorReason:inferredReason,
   errorReasonSource
 };
 const result=await db.$transaction(async tx=>{
   const row=await tx.practiceLog.create({data:{
     studentId,examType:input.examType,subject:input.subject,topic:canonical.topic,
     correct:input.correct,wrong:input.wrong,blank:input.blank,total,net,errorReason:inferredReason
   }});
   await tx.dailyLog.create({data:{
     studentId,date:new Date(),payload:{...metricPayload,practiceLogId:row.id}
   }});
   return row;
 });
 return NextResponse.json({ok:true,row:result,learning:snapshot,errorReason:inferredReason,errorReasonSource});
}

export const POST = withApiErrors(POST__handler);
