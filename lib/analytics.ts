import { db } from '@/lib/db';

export async function buildStudentInsights(studentId:string){
  const [practice,topics,target,exam,alerts]=await Promise.all([
    db.practiceLog.findMany({where:{studentId},orderBy:{date:'desc'},take:120}),
    db.topicProgress.findMany({where:{studentId}}),
    db.studentTarget.findFirst({where:{studentId,active:true},orderBy:{createdAt:'desc'}}),
    db.examResult.findFirst({where:{studentId},orderBy:{createdAt:'desc'}}),
    db.coachAlert.findMany({where:{studentId,resolved:false},orderBy:{createdAt:'desc'},take:10})
  ]);
  const bySubject=new Map<string,{c:number;w:number;b:number;n:number;count:number}>();
  for(const p of practice){
    const x=bySubject.get(p.subject)||{c:0,w:0,b:0,n:0,count:0};
    x.c+=p.correct;x.w+=p.wrong;x.b+=p.blank;x.n+=p.net;x.count++;
    bySubject.set(p.subject,x);
  }
  const subjects=[...bySubject.entries()].map(([subject,x])=>({
    subject,
    accuracy:(x.c+x.w+x.b)?Math.round((x.c/(x.c+x.w+x.b))*100):0,
    avgNet:x.count?Number((x.n/x.count).toFixed(2)):0,
    questions:x.c+x.w+x.b
  })).sort((a,b)=>a.accuracy-b.accuracy);
  const weakSubjects=subjects.filter(x=>x.questions>=10&&x.accuracy<60).slice(0,3);
  const incomplete=topics.filter(x=>!x.completed);
  const suggestion=weakSubjects[0]
    ? `Öncelik: ${weakSubjects[0].subject}. Son kayıtlarda doğruluk %${weakSubjects[0].accuracy}. Bu derste tamamlanmamış bir konudan 10–15 soruluk kısa test çöz.`
    : incomplete[0]
      ? `Öncelik: ${incomplete[0].subject} · ${incomplete[0].topic}. Konuyu tamamla ve ardından kısa test çöz.`
      : 'Konu takibi ve soru kayıtları düzenli görünüyor. Karma deneme ile genel seviyeyi ölç.';
  return {subjects,weakSubjects,incomplete,target,exam,alerts,suggestion};
}

export async function refreshCoachAlerts(studentId:string){
  const insights=await buildStudentInsights(studentId);
  const activeKeys=new Set<string>();
  for(const s of insights.weakSubjects){
    const key='WEAK_SUBJECT:'+s.subject; activeKeys.add(key);
    const existing=await db.coachAlert.findFirst({where:{studentId,kind:key,resolved:false}});
    if(!existing) await db.coachAlert.create({data:{studentId,kind:key,severity:s.accuracy<45?'HIGH':'MEDIUM',title:s.subject+' performansı düşük',message:`Son soru kayıtlarında doğruluk %${s.accuracy}. Ortalama net: ${s.avgNet}. Ders programında önceliklendirme önerilir.`}});
  }
  if(insights.incomplete.length>=8){
    const key='TOPIC_BACKLOG'; activeKeys.add(key);
    const existing=await db.coachAlert.findFirst({where:{studentId,kind:key,resolved:false}});
    if(!existing) await db.coachAlert.create({data:{studentId,kind:key,severity:'MEDIUM',title:'Tamamlanmamış konu birikimi',message:`${insights.incomplete.length} konu tamamlanmamış görünüyor. Haftalık planın sadeleştirilmesi önerilir.`}});
  }
  return buildStudentInsights(studentId);
}
