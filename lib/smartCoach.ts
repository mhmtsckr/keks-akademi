import { db } from '@/lib/db';

export const REVIEW_DAYS=[0,1,3,7,14,28];

function clamp(n:number,min=0,max=100){return Math.max(min,Math.min(max,n));}
function num(v:any){const n=Number(v);return Number.isFinite(n)?n:null;}

export async function computeGoalProgress(studentId:string){
  const [target,latest,practice]=await Promise.all([
    db.studentTarget.findFirst({where:{studentId,active:true},orderBy:{createdAt:'desc'}}),
    db.examResult.findFirst({where:{studentId},orderBy:{createdAt:'desc'}}),
    db.practiceLog.findMany({where:{studentId},orderBy:{date:'desc'},take:60})
  ]);
  if(!target) return {percent:null,label:'Hedef tanımlı değil',details:[] as string[]};
  const p:any=latest?.payload||{};
  const scores:number[]=[]; const details:string[]=[];
  if(target.examLevel==='LGS'){
    if(target.score!=null && num(p.score)!=null){
      const pct=clamp((num(p.score)!/target.score)*100);scores.push(pct);details.push('Puan yaklaşımı %'+Math.round(pct));
    }
    if(target.percentile!=null && num(p.percentile)!=null && num(p.percentile)!>0){
      const pct=clamp((target.percentile/num(p.percentile)!)*100);scores.push(pct);details.push('Yüzdelik yaklaşımı %'+Math.round(pct));
    }
  }else{
    const effectiveScore=target.examLevel==='KPSS'
      ? (target.officialMinScore??target.score)
      : target.examLevel==='AGS_OBAT'
        ? (target.officialEligibilityScore??target.score)
        : target.score;
    if((target.examLevel==='KPSS'||target.examLevel==='AGS_OBAT')&&effectiveScore!=null && num(p.score)!=null){
      const pct=clamp((num(p.score)!/effectiveScore)*100);scores.push(pct);details.push((target.examLevel==='KPSS'?'Resmî yerleşme puanına':'Resmî başvuru eşiğine')+' yaklaşım %'+Math.round(pct));
    }
    if(target.examLevel!=='KPSS'&&target.examLevel!=='AGS_OBAT'&&target.score!=null && num(p.score)!=null){
      const pct=clamp((num(p.score)!/target.score)*100);scores.push(pct);details.push('Puan yaklaşımı %'+Math.round(pct));
    }
    if(target.examLevel!=='KPSS'&&target.examLevel!=='AGS_OBAT'&&target.ranking!=null && num(p.ranking)!=null && num(p.ranking)!>0){
      const pct=clamp((target.ranking/num(p.ranking)!)*100);scores.push(pct);details.push('Sıralama yaklaşımı %'+Math.round(pct));
    }
    const nets=(target.benchmarkNets||{}) as Record<string,number>;
    if(Object.keys(nets).length){
      const examNets=(p.subjectNets||{}) as Record<string,number>;
      const current:Record<string,number>={...examNets};
      if(!Object.keys(current).length){
        const grouped=new Map<string,number[]>();
        for(const x of practice){const arr=grouped.get(x.subject)||[];arr.push(x.net);grouped.set(x.subject,arr);}
        for(const [subject,arr] of grouped) current[subject]=arr.slice(0,3).reduce((a,b)=>a+b,0)/Math.max(1,arr.slice(0,3).length);
      }
      const vals=Object.entries(nets).map(([s,t])=>t>0?clamp(((current[s]||0)/t)*100):100);
      if(vals.length){const pct=vals.reduce((a,b)=>a+b,0)/vals.length;scores.push(pct);details.push('Hedef net yaklaşımı %'+Math.round(pct));}
    }
  }
  if(!scores.length) return {percent:null,label:'Karşılaştırma için veri yetersiz',details};
  const percent=Math.round(scores.reduce((a,b)=>a+b,0)/scores.length);
  return {percent,label:percent>=100?'Hedef referansına ulaşıldı':percent>=80?'Hedef referansına yakın':percent>=60?'Hedef referansına doğru ilerliyor':'Hedef referansıyla arada fark var',details};
}

export async function buildWeeklyPlan(studentId:string){
  const [student,practice,topics,reviews,goal]=await Promise.all([
    db.student.findUnique({where:{id:studentId}}),
    db.practiceLog.findMany({where:{studentId},orderBy:{date:'desc'},take:100}),
    db.topicProgress.findMany({where:{studentId}}),
    db.reviewQueueItem.findMany({where:{studentId,status:{in:['DUE','PENDING']}},orderBy:{dueAt:'asc'},take:30}),
    computeGoalProgress(studentId)
  ]);
  if(!student) throw new Error('Öğrenci bulunamadı');
  const bySubject=new Map<string,{q:number;c:number;w:number;n:number}>();
  for(const p of practice){const x=bySubject.get(p.subject)||{q:0,c:0,w:0,n:0};x.q+=p.total;x.c+=p.correct;x.w+=p.wrong;x.n+=p.net;bySubject.set(p.subject,x);}
  const weak=[...bySubject.entries()].map(([subject,x])=>({subject,accuracy:x.q?x.c/x.q:1,net:x.n,questions:x.q})).sort((a,b)=>a.accuracy-b.accuracy);
  const incomplete=topics.filter(x=>!x.completed);
  const today=new Date();today.setHours(0,0,0,0);
  const days=[] as any[];
  for(let i=0;i<7;i++){
    const date=new Date(today);date.setDate(date.getDate()+i);
    const tasks:any[]=[];
    const due=reviews.filter(r=>new Date(r.dueAt).toDateString()===date.toDateString());
    if(due.length) tasks.push({type:'REVIEW',title:`${due.length} yanlış soru tekrarı`,duration:20,reason:'Bu soruların tekrar tarihi bugün olduğu için plana alındı.'});
    const weakSub=weak[i%Math.max(weak.length,1)];
    const topic=incomplete.find(t=>!weakSub||t.subject===weakSub.subject)||incomplete[i%Math.max(incomplete.length,1)];
    if(topic) tasks.push({type:'TOPIC',title:`${topic.subject} · ${topic.topic}`,duration:40,reason:'Konu ilerleme kaydında henüz tamamlanmadığı için plana alındı.'});
    if(weakSub) tasks.push({type:'PRACTICE',title:`${weakSub.subject} kısa test`,duration:30,questions:weakSub.accuracy<.5?10:15,reason:`Son kayıtlarındaki ${weakSub.questions} soruda doğruluk %${Math.round(weakSub.accuracy*100)} olduğu için kısa ölçüm önerildi.`});
    if(i===6) tasks.push({type:'REVIEW_WEEK',title:'Haftalık değerlendirme ve yeni hedef kontrolü',duration:20,reason:'Haftanın sonunda uygulanan plan ile gerçekleşen performansı karşılaştırmak için.'});
    days.push({date:date.toISOString(),tasks});
  }
  return {
    goal,
    explanation:'Bu plan; vadesi gelen tekrarlar, tamamlanmamış konular ve son soru kayıtlarındaki doğruluk verileri kullanılarak oluşturulur. Bir kesin başarı tahmini veya kişilik kararı değildir.',
    inputs:{practiceRecords:practice.length,incompleteTopics:incomplete.length,pendingReviews:reviews.length},
    days
  };
}
