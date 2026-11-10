import { HttpError,readJson,withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { dailyTaskStatus } from '@/lib/dailyTaskStatus';
import { evaluateTaskSubmission } from '@/lib/taskEvaluation';
import { awardXp } from '@/lib/gamification';
import { PARAGRAF_COACH_ACTION_SOURCE } from '@/lib/paragrafInterventionImpact';

const schema=z.object({
  actionId:z.string().min(1),
  confirmed:z.literal(true),
  totalQuestions:z.number().int().min(0).max(2000),
  wrong:z.number().int().min(0).max(2000),
  blank:z.number().int().min(0).max(2000),
  achievedValue:z.number().int().min(0).max(10000).optional(),
  // Accepted only for compatibility with older clients; never trusted to calculate results.
  correct:z.number().int().min(0).max(2000).optional(),
  errorReason:z.enum(['BILGI_EKSIKLIGI','ISLEM_HATASI','DIKKAT','SORU_KOKU','SURE','YONTEM_BILMEME','UNUTMA','SORUYU_ANLAMA','STRATEJI','DIGER']).nullable().optional()
});

async function GET__handler(){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const rows=await db.taskSubmission.findMany({
    where:{studentId:user.student.id},
    include:{action:{select:{id:true,title:true,subject:true,topic:true,targetValue:true,taskDate:true,periodEnd:true}}},
    orderBy:{submittedAt:'desc'},
    take:100
  });
  return NextResponse.json({ok:true,rows:rows.map(row=>({
    ...row,
    dailyStatus:dailyTaskStatus({
      taskDate:row.action.taskDate,periodEnd:row.action.periodEnd,submittedAt:row.submittedAt
    })
  }))},{headers:{'Cache-Control':'private, no-store'}});
}

async function POST__handler(req:Request){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const input=await readJson(req,schema);
  const correct=input.totalQuestions-input.wrong-input.blank;

  if(correct<0||(input.correct!==undefined&&input.correct!==correct)){
    return NextResponse.json({error:'Yanlış ve boş toplamı, çözülen toplam soru sayısını aşamaz. Doğru sayısı otomatik hesaplanır.'},{status:400});
  }

  const action=await db.coachingAction.findFirst({
    where:{id:input.actionId,studentId:user.student.id},
    include:{submission:true}
  });
  if(!action)return NextResponse.json({error:'Görev bulunamadı.'},{status:404});
  if(action.submission)return NextResponse.json({error:'Bu görev daha önce kaydedildi. Öğrenci tamamlanma durumunu veya teslim zamanını değiştiremez.'},{status:409});
  if(!['ACTIVE','COMPLETED','RESCHEDULED'].includes(action.status)){
    return NextResponse.json({error:'Bu görev artık teslim almıyor.'},{status:409});
  }
  if(action.metricType==='QUESTIONS'&&input.totalQuestions===0){
    return NextResponse.json({error:'Soru çözme görevini onaylamak için en az bir soru sonucu girmelisiniz.'},{status:400});
  }

  // The server decides both the timestamp and the completion state; no client-provided
  // completed/late/status/date field is ever accepted or persisted.
  const now=new Date();
  const before=dailyTaskStatus({taskDate:action.taskDate,periodEnd:action.periodEnd,submittedAt:null},now);
  if(before==='UPCOMING'){
    return NextResponse.json({error:'İleri tarihli görevler görev günü geldiğinde kaydedilebilir.'},{status:409});
  }
  const dailyStatus=dailyTaskStatus({
    taskDate:action.taskDate,periodEnd:action.periodEnd,submittedAt:now
  },now);
  const late=dailyStatus==='LATE_COMPLETED';
  const paragraphCoachAction=action.planSource===PARAGRAF_COACH_ACTION_SOURCE;
  if(action.metricType==='QUESTIONS'&&input.achievedValue!==undefined){
    return NextResponse.json({error:'Soru görevlerinde ilerleme, sunucu tarafından soru toplamından hesaplanır.'},{status:400});
  }
  const achievedValue=action.metricType==='QUESTIONS'
    ?input.totalQuestions
    :input.achievedValue??action.targetValue;
  const evaluation=action.metricType==='QUESTIONS'
    ?evaluateTaskSubmission({
      totalQuestions:input.totalQuestions,correct,wrong:input.wrong,blank:input.blank,
      targetValue:action.targetValue,late
    })
    :input.totalQuestions>0
      ?evaluateTaskSubmission({
        totalQuestions:input.totalQuestions,correct,wrong:input.wrong,blank:input.blank,
        targetValue:input.totalQuestions,late
      })
      :{
        net:0,accuracy:0,completionRate:100,
        flags:late?['23.00 sonrası geç giriş']:[],
        level:'İYİ',
        summary:'Soru içermeyen görev, öğrenci tarafından tamamlandı olarak bildirildi.',
        late
      };
  const subject=action.subject||action.title;
  const topic=action.topic||null;
  const content=[
    late?'Geç tamamlandı: Öğrenci görevi Türkiye saatiyle 23.00 veya sonrasında kaydetti.':'Tamamlandı: Görev 23.00 öncesinde kaydedildi.',
    'Görev: '+action.title,
    'Ders: '+subject+(topic?' · Konu: '+topic:''),
    'Toplam soru: '+input.totalQuestions,
    'Gerçekleşen hedef miktarı: '+achievedValue+' / '+action.targetValue+' '+(action.metricType==='MINUTES'?'dakika':'birim'),
    'Doğru: '+correct+' · Yanlış: '+input.wrong+' · Boş: '+input.blank,
    input.totalQuestions>0
      ?'Net: '+evaluation.net+' · Doğruluk: %'+evaluation.accuracy+' · Hedef ilerlemesi: %'+evaluation.completionRate
      :'Soru çözümü bildirilmedi; tamamlanma onayı ve teslim zamanı kaydedildi.',
    'Değerlendirme: '+evaluation.level+' — '+evaluation.summary,
    evaluation.flags.length?'Sinyaller: '+evaluation.flags.join(', '):'Sinyal yok.',
    'Veri kaynağı: Öğrenci beyanı. Görev durumu ve teslim zamanı sistem tarafından belirlenmiştir.'
  ].join('\n');

  let submission;
  try{
    submission=await db.$transaction(async tx=>{
      // Paragraph remediation is only closed by a coach; the student's task receipt
      // can be completed while the separate intervention remains open.
      if(paragraphCoachAction){
        const open=await tx.coachingAction.updateMany({
          where:{id:action.id,studentId:user.student!.id,status:'ACTIVE'},
          data:{currentValue:Math.min(input.totalQuestions,action.targetValue)}
        });
        if(!open.count)throw new HttpError(409,'Koç müdahalesi zaten kapatılmış.');
      }
      // Unique actionId ensures concurrent POSTs cannot overwrite the first receipt.
      const saved=await tx.taskSubmission.create({
        data:{
          actionId:action.id,studentId:user.student!.id,subject,topic,
          totalQuestions:input.totalQuestions,correct,wrong:input.wrong,blank:input.blank,
          errorReason:input.errorReason||null,
          net:evaluation.net,accuracy:evaluation.accuracy,completionRate:evaluation.completionRate,
          submittedAt:now,late,
          alarmLevel:late?'RED':evaluation.level==='MÜDAHALE GEREKLİ'?'HIGH':evaluation.level==='İZLEM'?'MEDIUM':'NORMAL',
          evaluation:{...evaluation,achievedValue,metricType:action.metricType,source:'STUDENT_SELF_REPORT'}
        }
      });
      if(!paragraphCoachAction){
        await tx.coachingAction.update({
          where:{id:action.id},
          data:{currentValue:Math.min(achievedValue,action.targetValue),status:'COMPLETED'}
        });
      }
      await tx.practiceLog.create({data:{
        taskSubmissionId:saved.id,studentId:user.student!.id,examType:'GÖREV',subject,topic,
        correct,wrong:input.wrong,blank:input.blank,total:input.totalQuestions,
        net:evaluation.net,errorReason:input.errorReason||null,date:now
      }});
      await tx.studentReport.create({data:{
        studentId:user.student!.id,
        title:'Görev Değerlendirmesi · '+action.title,
        summary:(late?'GEÇ TAMAMLANDI · ':'TAMAMLANDI · ')+(input.totalQuestions>0?'%'+evaluation.accuracy+' doğruluk · '+evaluation.net+' net':'Soru kaydı yok'),
        content,createdByUserId:user.id,visibleToStudent:true,visibleToParent:false
      }});
      if(late||evaluation.level!=='İYİ'){
        await tx.coachAlert.create({data:{
          studentId:user.student!.id,kind:'TASK_SUBMISSION:'+action.id+':'+saved.id,
          severity:late||evaluation.level==='MÜDAHALE GEREKLİ'?'HIGH':'MEDIUM',
          title:(late?'Geç tamamlanan görev':'Görev performansı izlem gerektiriyor')+' · '+action.title,
          message:content
        }});
      }
      return saved;
    });
  }catch(error){
    if((error as {code?:string})?.code==='P2002'){
      return NextResponse.json({error:'Bu görev zaten kaydedilmiş. Mevcut teslim durumu değiştirilemez.'},{status:409});
    }
    throw error;
  }

  if(action.metricType!=='QUESTIONS'||input.totalQuestions>=action.targetValue){
    try{await awardXp(user.student.id,'ACTION_SUBMISSION',submission.id,late?25:50);}
    catch(error){console.error('TASK_XP_AWARD_FAILED',{actionId:action.id,error});}
  }
  return NextResponse.json({
    ok:true,submission,evaluation,dailyStatus,late,achievedValue,
    requiresCoachClosure:paragraphCoachAction,
    evidenceSource:'STUDENT_SELF_REPORT',
    note:paragraphCoachAction?'Öz bildirim tamamlandı; paragraf müdahalesinin koç tarafından kapatılması ayrı bir süreçtir.':null
  },{headers:{'Cache-Control':'private, no-store'}});
}

export const GET=withApiErrors(GET__handler);
export const POST=withApiErrors(POST__handler);
