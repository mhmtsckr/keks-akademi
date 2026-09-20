import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { buildStudentCommandCenter,rebalanceMissedTasks } from '@/lib/studentCommandCenter';

const schema=z.discriminatedUnion('action',[
  z.object({action:z.literal('rebalance')}),
  z.object({
    action:z.literal('reflection'),
    selfRating:z.number().int().min(1).max(5),
    bestThing:z.string().max(1000).optional(),
    biggestChallenge:z.string().max(1000).optional(),
    repeatedDelay:z.string().max(1000).optional(),
    nextWeekChange:z.string().max(1000).optional()
  })
]);

function weekStartUtc(){
  const now=new Date();
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(now).split('-').map(Number);
  const d=new Date(Date.UTC(parts[0],parts[1]-1,parts[2]));
  const day=d.getUTCDay();
  const diff=day===0?-6:1-day;
  d.setUTCDate(d.getUTCDate()+diff);
  return d;
}

export async function GET(){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  return NextResponse.json({ok:true,...await buildStudentCommandCenter(user.student.id)});
}

export async function POST(req:Request){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const input=schema.parse(await req.json());

  if(input.action==='rebalance'){
    const moved=await rebalanceMissedTasks(user.student.id);
    if(moved.length){
      await db.coachAlert.create({data:{
        studentId:user.student.id,
        kind:'AUTO_RESCHEDULE:'+Date.now(),
        severity:'MEDIUM',
        title:'Kaçırılan görevler otomatik yeniden planlandı',
        message:moved.length+' kaçırılan görev, kalan yük korunarak ileri günlere dağıtıldı. Koç panelinden değişiklikleri kontrol edebilirsiniz.'
      }});
    }
    return NextResponse.json({ok:true,moved,...await buildStudentCommandCenter(user.student.id)});
  }

  const start=weekStartUtc();
  const end=new Date(start);end.setUTCDate(end.getUTCDate()+7);
  const [actions,submissions,techniques,reviews]=await Promise.all([
    db.coachingAction.findMany({where:{studentId:user.student.id,taskDate:{gte:start,lt:end}},include:{submission:true}}),
    db.taskSubmission.findMany({where:{studentId:user.student.id,submittedAt:{gte:start,lt:end}}}),
    db.techniquePracticeSession.findMany({where:{studentId:user.student.id,createdAt:{gte:start,lt:end}}}),
    db.reviewQueueItem.findMany({where:{studentId:user.student.id,updatedAt:{gte:start,lt:end}}})
  ]);
  const totalTasks=actions.length;
  const completedTasks=actions.filter(x=>x.submission||x.status==='COMPLETED').length;
  const completionRate=totalTasks?Math.round(completedTasks/totalTasks*100):0;
  const totalQ=submissions.reduce((n,x)=>n+x.totalQuestions,0);
  const correct=submissions.reduce((n,x)=>n+x.correct,0);
  const accuracy=totalQ?Math.round(correct/totalQ*100):0;
  const focusMinutes=Math.round(techniques.reduce((n,x)=>n+(x.activeSeconds||0),0)/60);
  const reviewDone=reviews.filter(x=>x.status==='COMPLETED').length;
  const snapshot={totalTasks,completedTasks,completionRate,totalQuestions:totalQ,accuracy,focusMinutes,reviewDone};
  const actualRating=completionRate>=85&&accuracy>=70?5:completionRate>=70?4:completionRate>=50?3:completionRate>=30?2:1;
  const delta=input.selfRating-actualRating;
  const comparison={
    actualRating,
    delta,
    label:Math.abs(delta)<=1?'Öz değerlendirme ile çalışma verileri genel olarak uyumlu.':delta>=2?'Kendi performans algın verilerden daha yüksek; gelecek hafta görev tamamlama ve odak kayıtlarını daha yakından izle.':'Kendi performansını verilerin gösterdiğinden daha düşük değerlendiriyorsun; tamamlanan görevleri ve gelişimi görünür takip et.'
  };

  const reflection=await db.weeklyReflection.upsert({
    where:{studentId_weekStart:{studentId:user.student.id,weekStart:start}},
    create:{
      studentId:user.student.id,weekStart:start,selfRating:input.selfRating,
      bestThing:input.bestThing||null,biggestChallenge:input.biggestChallenge||null,
      repeatedDelay:input.repeatedDelay||null,nextWeekChange:input.nextWeekChange||null,
      systemSnapshot:snapshot as any,comparison:comparison as any
    },
    update:{
      selfRating:input.selfRating,bestThing:input.bestThing||null,biggestChallenge:input.biggestChallenge||null,
      repeatedDelay:input.repeatedDelay||null,nextWeekChange:input.nextWeekChange||null,
      systemSnapshot:snapshot as any,comparison:comparison as any
    }
  });

  await db.studentReport.create({data:{
    studentId:user.student.id,
    title:'Haftalık Öz Değerlendirme',
    summary:'Görev tamamlama %'+completionRate+' · Doğruluk %'+accuracy+' · Odak '+focusMinutes+' dk',
    content:[
      'Öğrenci öz puanı: '+input.selfRating+'/5',
      'Veriye dayalı karşılık: '+actualRating+'/5',
      comparison.label,
      '',
      'En iyi giden: '+(input.bestThing||'—'),
      'En çok zorlayan: '+(input.biggestChallenge||'—'),
      'Tekrarlanan erteleme: '+(input.repeatedDelay||'—'),
      'Gelecek hafta değiştirmek istediği: '+(input.nextWeekChange||'—')
    ].join('\n'),
    createdByUserId:user.id,
    visibleToStudent:true,
    visibleToParent:false
  }});

  await db.coachAlert.create({data:{
    studentId:user.student.id,
    kind:'WEEKLY_REFLECTION:'+reflection.id,
    severity:Math.abs(delta)>=2?'MEDIUM':'LOW',
    title:'Haftalık öğrenci öz değerlendirmesi tamamlandı',
    message:'Öz puan '+input.selfRating+'/5 · Veri karşılığı '+actualRating+'/5 · Görev tamamlama %'+completionRate+' · Doğruluk %'+accuracy+' · Odak '+focusMinutes+' dk.'
  }});

  return NextResponse.json({ok:true,reflection,comparison,snapshot});
}
