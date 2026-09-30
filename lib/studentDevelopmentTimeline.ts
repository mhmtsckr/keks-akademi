import {db} from '@/lib/db';

export type TimelineAudience='STUDENT'|'COACH'|'PARENT';
export type TimelineKind='REGISTRATION'|'ASSESSMENT'|'PLAN'|'EXAM'|'TARGET'|'SESSION';

export type StudentTimelineEvent={
  id:string;
  kind:TimelineKind;
  date:Date;
  title:string;
  detail:string;
  badge?:string|null;
  positive?:boolean;
};

function record(v:unknown):Record<string,unknown>{
  return v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
}
function numberFrom(v:unknown){
  const n=Number(v);
  return Number.isFinite(n)?n:null;
}
export function examNet(payload:unknown){
  const p=record(payload);
  return numberFrom(p.net)??numberFrom(p.totalNet)??numberFrom(p.score);
}
function round(n:number){return Number(n.toFixed(2))}
function targetName(target:{institutionName:string;departmentName:string|null}){
  return target.institutionName+(target.departmentName?' · '+target.departmentName:'');
}

export async function buildStudentDevelopmentTimeline(
  studentId:string,
  audience:TimelineAudience,
  now=new Date()
){
  const yearAgo=new Date(now.getTime()-365*86400000);
  const student=await db.student.findUnique({
    where:{id:studentId},
    select:{
      id:true,fullName:true,createdAt:true,
      assessments:{orderBy:{completedAt:'asc'},select:{id:true,completedAt:true,formVersion:true}},
      plans:{orderBy:{createdAt:'asc'},select:{id:true,title:true,createdAt:true}},
      examResults:{where:{createdAt:{gte:yearAgo,lte:now}},orderBy:{createdAt:'asc'},take:60,select:{id:true,examType:true,payload:true,createdAt:true}},
      targets:{orderBy:{createdAt:'asc'},select:{id:true,institutionName:true,departmentName:true,examLevel:true,createdAt:true}},
      coachingSessions:{
        where:{startsAt:{gte:yearAgo,lte:now},OR:[{status:'COMPLETED'},{completedAt:{not:null}}]},
        orderBy:{startsAt:'asc'},take:60,
        select:{id:true,title:true,startsAt:true,outcome:true,nextStep:true}
      }
    }
  });
  if(!student)return null;

  const events:StudentTimelineEvent[]=[];

  events.push({
    id:'registration:'+student.id,
    kind:'REGISTRATION',
    date:student.createdAt,
    title:'KEKS yolculuğu başladı',
    detail:'Öğrenci kaydı oluşturuldu.',
    badge:'KAYIT'
  });

  student.assessments.forEach((a,index)=>{
    events.push({
      id:'assessment:'+a.id,
      kind:'ASSESSMENT',
      date:a.completedAt,
      title:index===0?'İlk değerlendirme tamamlandı':'Yeni dönem değerlendirmesi tamamlandı',
      detail:index===0?'Başlangıç eğitsel değerlendirme verileri sisteme kaydedildi.':'Öğrencinin güncel eğitsel değerlendirmesi yenilendi.',
      badge:index===0?'İLK DEĞERLENDİRME':'DEĞERLENDİRME'
    });
  });

  student.plans.forEach((p,index)=>{
    events.push({
      id:'plan:'+p.id,
      kind:'PLAN',
      date:p.createdAt,
      title:index===0?'İlk çalışma planı oluşturuldu':'Çalışma planı güncellendi',
      detail:audience==='PARENT'
        ?'Çalışma programı öğrencinin güncel ihtiyaçlarına göre düzenlendi.'
        :p.title,
      badge:index===0?'İLK PLAN':'PLAN'
    });
  });

  const previousByType=new Map<string,number>();
  for(const exam of student.examResults){
    const net=examNet(exam.payload);
    const previous=previousByType.get(exam.examType);
    const delta=net!=null&&previous!=null?round(net-previous):null;
    const gain=delta!=null&&delta>0;
    let detail='Deneme sonucu kaydedildi.';
    if(audience==='PARENT'){
      if(gain)detail=exam.examType+' denemesinde önceki aynı sınava göre +'+delta+' net gelişim kaydedildi.';
      else if(delta!=null&&delta===0)detail=exam.examType+' denemesinde önceki sonuçla aynı düzey korundu.';
      else if(delta!=null)detail=exam.examType+' denemesi tamamlandı; sonuç koç tarafından izleniyor.';
      else detail=exam.examType+' denemesi tamamlandı.';
    }else{
      detail=net!=null?exam.examType+' · '+net+' net':'Deneme sonucu kaydedildi.';
      if(delta!=null)detail+=' · önceki '+exam.examType+' denemesine göre '+(delta>0?'+':'')+delta+' net';
    }
    events.push({
      id:'exam:'+exam.id,
      kind:'EXAM',
      date:exam.createdAt,
      title:gain?'Net artışı · '+exam.examType:'Deneme · '+exam.examType,
      detail,
      badge:gain?'NET ARTIŞI':'DENEME',
      positive:gain
    });
    if(net!=null)previousByType.set(exam.examType,net);
  }

  student.targets.forEach((t,index)=>{
    events.push({
      id:'target:'+t.id,
      kind:'TARGET',
      date:t.createdAt,
      title:index===0?'İlk hedef belirlendi':'Yeni hedef belirlendi',
      detail:targetName(t),
      badge:index===0?'HEDEF':'YENİ HEDEF'
    });
  });

  for(const session of student.coachingSessions){
    const details:string[]=[];
    if(audience!=='PARENT'&&session.outcome)details.push(session.outcome);
    if(audience!=='PARENT'&&session.nextStep)details.push('Sonraki adım: '+session.nextStep);
    events.push({
      id:'session:'+session.id,
      kind:'SESSION',
      date:session.startsAt,
      title:'Koç görüşmesi · '+session.title,
      detail:audience==='PARENT'
        ?'Öğrenciyle planlı koçluk görüşmesi gerçekleştirildi.'
        :(details.join(' · ')||'Koçluk görüşmesi tamamlandı.'),
      badge:'KOÇ GÖRÜŞMESİ'
    });
  }

  events.sort((a,b)=>a.date.getTime()-b.date.getTime());

  const visible=events.filter(event=>event.kind==='REGISTRATION'||event.date>=yearAgo);
  const firstExam=student.examResults.find(x=>examNet(x.payload)!=null);
  const lastExam=[...student.examResults].reverse().find(x=>examNet(x.payload)!=null);
  const firstNet=firstExam?examNet(firstExam.payload):null;
  const lastNet=lastExam?examNet(lastExam.payload):null;
  const netChange=firstNet!=null&&lastNet!=null?round(lastNet-firstNet):null;

  return {
    studentId:student.id,
    studentName:student.fullName,
    from:yearAgo,
    to:now,
    events:visible,
    summary:{
      assessmentCount:student.assessments.length,
      planCount:student.plans.length,
      examCount:student.examResults.length,
      sessionCount:student.coachingSessions.length,
      targetCount:student.targets.length,
      netChange
    }
  };
}
