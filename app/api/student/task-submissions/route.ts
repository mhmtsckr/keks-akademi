import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { evaluateTaskSubmission } from '@/lib/taskEvaluation';
import { awardXp } from '@/lib/gamification';

const schema=z.object({
  actionId:z.string(),
  totalQuestions:z.number().int().min(0).max(2000),
  correct:z.number().int().min(0).max(2000),
  wrong:z.number().int().min(0).max(2000),
  blank:z.number().int().min(0).max(2000)
});

function deadlineForAction(action:{taskDate:Date|null;periodEnd:Date}){
  const base=action.taskDate||action.periodEnd;
  const y=base.getUTCFullYear(),m=base.getUTCMonth(),d=base.getUTCDate();
  return new Date(Date.UTC(y,m,d,20,0,0)); // 23:00 Europe/Istanbul
}

export async function GET(){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const rows=await db.taskSubmission.findMany({
    where:{studentId:user.student.id},
    include:{action:{select:{id:true,title:true,subject:true,topic:true,targetValue:true,taskDate:true,periodEnd:true}}},
    orderBy:{submittedAt:'desc'},
    take:100
  });
  return NextResponse.json({ok:true,rows});
}

export async function POST(req:Request){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const input=schema.parse(await req.json());
  if(input.correct+input.wrong+input.blank!==input.totalQuestions){
    return NextResponse.json({error:'Doğru + yanlış + boş toplamı, toplam soru sayısına eşit olmalıdır.'},{status:400});
  }
  const action=await db.coachingAction.findFirst({
    where:{id:input.actionId,studentId:user.student.id},
    include:{submission:true}
  });
  if(!action)return NextResponse.json({error:'Görev bulunamadı.'},{status:404});
  const now=new Date();
  const lateNow=now>deadlineForAction(action);
  const late=Boolean(action.submission?.late||lateNow);
  const evaluation=evaluateTaskSubmission({...input,targetValue:action.targetValue,late});
  const subject=action.subject||action.title;
  const topic=action.topic||null;

  const submission=await db.taskSubmission.upsert({
    where:{actionId:action.id},
    create:{
      actionId:action.id,studentId:user.student.id,subject,topic,
      totalQuestions:input.totalQuestions,correct:input.correct,wrong:input.wrong,blank:input.blank,
      net:evaluation.net,accuracy:evaluation.accuracy,completionRate:evaluation.completionRate,
      submittedAt:now,late,alarmLevel:late?'RED':evaluation.level==='MÜDAHALE GEREKLİ'?'HIGH':evaluation.level==='İZLEM'?'MEDIUM':'NORMAL',
      evaluation
    },
    update:{
      subject,topic,totalQuestions:input.totalQuestions,correct:input.correct,wrong:input.wrong,blank:input.blank,
      net:evaluation.net,accuracy:evaluation.accuracy,completionRate:evaluation.completionRate,
      submittedAt:now,late,alarmLevel:late?'RED':evaluation.level==='MÜDAHALE GEREKLİ'?'HIGH':evaluation.level==='İZLEM'?'MEDIUM':'NORMAL',
      evaluation
    }
  });

  await db.coachingAction.update({where:{id:action.id},data:{
    currentValue:Math.min(input.totalQuestions,action.targetValue),
    status:input.totalQuestions>=action.targetValue?'COMPLETED':'ACTIVE'
  }});

  await db.practiceLog.create({data:{
    studentId:user.student.id,examType:'GÖREV',subject,topic,
    correct:input.correct,wrong:input.wrong,blank:input.blank,total:input.totalQuestions,net:evaluation.net,date:now
  }});

  const content=[
    late?'KIRMIZI ALARM: Öğrenci görevi 23.00 sonrasında kaydetti.':'Teslim zamanında kaydedildi.',
    'Görev: '+action.title,
    'Ders: '+subject+(topic?' · Konu: '+topic:''),
    'Toplam soru: '+input.totalQuestions,
    'Doğru: '+input.correct+' · Yanlış: '+input.wrong+' · Boş: '+input.blank,
    'Net: '+evaluation.net+' · Doğruluk: %'+evaluation.accuracy+' · Hedef tamamlama: %'+evaluation.completionRate,
    'Değerlendirme: '+evaluation.level+' — '+evaluation.summary,
    evaluation.flags.length?'Sinyaller: '+evaluation.flags.join(', '):'Sinyal yok.'
  ].join('\n');

  await db.studentReport.create({data:{
    studentId:user.student.id,
    title:'Görev Değerlendirmesi · '+action.title,
    summary:(late?'KIRMIZI ALARM · ':'')+'%'+evaluation.accuracy+' doğruluk · '+evaluation.net+' net',
    content,
    createdByUserId:user.id,
    visibleToStudent:true,
    visibleToParent:false
  }});

  if(late||evaluation.level!=='İYİ'){
    const kind='TASK_SUBMISSION:'+action.id+':'+submission.id;
    const existing=await db.coachAlert.findFirst({where:{studentId:user.student.id,kind,resolved:false}});
    if(!existing)await db.coachAlert.create({data:{
      studentId:user.student.id,kind,
      severity:late||evaluation.level==='MÜDAHALE GEREKLİ'?'HIGH':'MEDIUM',
      title:(late?'Geç görev teslimi':'Görev performansı izlem gerektiriyor')+' · '+action.title,
      message:content
    }});
  }

  if(input.totalQuestions>=action.targetValue)await awardXp(user.student.id,'ACTION_SUBMISSION',submission.id,late?25:50);
  return NextResponse.json({ok:true,submission,evaluation,late});
}
