import { db } from '@/lib/db';
import { buildCapacityProfile,buildSubjectLearningModels,dailyPracticeQuestionTarget } from '@/lib/learningEngine';

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
  const [student,practice,topics,reviews,goal,capacity,subjectModels]=await Promise.all([
    db.student.findUnique({where:{id:studentId}}),
    db.practiceLog.findMany({where:{studentId},orderBy:{date:'desc'},take:100}),
    db.topicProgress.findMany({where:{studentId}}),
    db.reviewQueueItem.findMany({where:{studentId,status:{in:['DUE','PENDING']}},orderBy:{dueAt:'asc'},take:30}),
    computeGoalProgress(studentId),
    buildCapacityProfile(studentId),
    buildSubjectLearningModels(studentId)
  ]);
  if(!student) throw new Error('Öğrenci bulunamadı');
  const bySubject=new Map<string,{q:number;c:number;w:number;n:number}>();
  for(const p of practice){const x=bySubject.get(p.subject)||{q:0,c:0,w:0,n:0};x.q+=p.total;x.c+=p.correct;x.w+=p.wrong;x.n+=p.net;bySubject.set(p.subject,x);}
  const weak=[...bySubject.entries()].map(([subject,x])=>({subject,accuracy:x.q?x.c/x.q:1,net:x.n,questions:x.q})).sort((a,b)=>a.accuracy-b.accuracy);
  const incomplete=topics.filter(x=>!x.completed);
  const today=new Date();today.setHours(0,0,0,0);
  const lowCompletion=new Map((capacity.lowCompletionDays||[]).map(x=>[x.day,x.completionRate]));
  const weekday=(date:Date)=>new Intl.DateTimeFormat('en-US',{timeZone:'Europe/Istanbul',weekday:'short'}).format(date);
  const days=[] as any[];
  for(let i=0;i<7;i++){
    const date=new Date(today);date.setDate(date.getDate()+i);
    const historicalCompletion=lowCompletion.get(weekday(date))??null;
    const dayFactor=historicalCompletion!=null&&historicalCompletion<60?.75:historicalCompletion!=null&&historicalCompletion<75?.9:1;
    const dayBudget=Math.max(30,Math.round(capacity.suggestedDailyMinutes*dayFactor));
    const tasks:any[]=[];
    let used=0;
    const add=(task:any)=>{
      if(used+task.duration>dayBudget)return false;
      tasks.push(task);used+=task.duration;return true;
    };
    const due=reviews.filter(r=>new Date(r.dueAt).toDateString()===date.toDateString());
    if(due.length)add({type:'REVIEW',title:`${Math.min(due.length,4)} yanlış soru tekrarı`,duration:Math.min(20,Math.max(8,due.length*4)),reason:'Bu soruların tekrar tarihi bugün olduğu için plana alındı.'});
    const weakSub=weak[i%Math.max(weak.length,1)];
    const topic=incomplete.find(t=>!weakSub||t.subject===weakSub.subject)||incomplete[i%Math.max(incomplete.length,1)];
    const focusDuration=Math.min(capacity.recommendedFocusBlockMinutes||35,dayBudget);
    if(topic)add({type:'TOPIC',title:`${topic.subject} · ${topic.topic}`,duration:focusDuration,reason:capacity.focusDropAfterMinutes
      ?`Uzun oturumlarda doğruluk düşüşü görüldüğü için konu bloğu ${focusDuration} dk ile sınırlandı.`
      :'Konu ilerleme kaydında henüz tamamlanmadığı için gözlenen odak kapasitesine göre plana alındı.'});
    if(weakSub){
      const model:any=subjectModels.find((x:any)=>x.subject===weakSub.subject);
      const questions=dailyPracticeQuestionTarget({
        questionCapacity:capacity.questionCapacity,
        accuracy:Math.round(weakSub.accuracy*100)
      });
      const duration=Math.max(15,Math.min(30,Math.round(questions*1.5)));
      const reason=(model?.nextAction||`Son kayıtlarındaki ${weakSub.questions} soruda doğruluk %${Math.round(weakSub.accuracy*100)}.`)+' Soru hacmi gerçek günlük kapasiteye göre ayarlandı.';
      if(model?.family==='MATHEMATICS'){
        const label=model.weakestProblemType?.questionType||'karma';
        add({type:'MATH_SPEED_ACCURACY',title:`${weakSub.subject} · ${label} hız + doğruluk seti`,duration,questions,reason});
      }else if(model?.family==='TURKISH'){
        const label=model.slowestQuestionType?.questionType||model.weakestQuestionType?.questionType||'karma';
        add({type:'TURKISH_TIMED_SET',title:`${weakSub.subject} · ${label} süreli set`,duration,questions,reason});
      }else if(model?.family==='HISTORY'){
        add({type:'HISTORY_ACTIVE_RECALL',title:`${weakSub.subject} · aktif hatırlama + tekrar`,duration:Math.min(duration,25),reason});
      }else if(model?.family==='LITERATURE'){
        add({type:'LITERATURE_CONNECTION',title:`${weakSub.subject} · dönem–yazar–eser bağlantısı`,duration:Math.min(duration,25),reason});
      }else if(model?.family==='SCIENCE'){
        const label=model.misconceptions?.[0]?.topic||model.weakestTopics?.[0]?.topic||'kavram kontrolü';
        add({type:'SCIENCE_CONCEPT_CHECK',title:`${weakSub.subject} · ${label} kavram kontrolü`,duration,questions:Math.min(questions,15),reason});
      }else{
        add({type:'PRACTICE',title:`${weakSub.subject} kısa test`,duration,questions,reason});
      }
    }
    if(i===6)add({type:'REVIEW_WEEK',title:'Haftalık değerlendirme ve yeni hedef kontrolü',duration:20,reason:'Haftanın sonunda uygulanan plan ile gerçekleşen performansı karşılaştırmak için.'});
    days.push({
      date:date.toISOString(),
      recommendedWindow:capacity.bestWindow,
      plannedMinutes:used,
      capacityMinutes:dayBudget,
      historicalCompletion,
      tasks
    });
  }
  return {
    goal,
    capacityProfile:{
      plannedMinutes:capacity.plannedMinutes,
      actualAverageMinutes:capacity.actualAverageMinutes,
      suggestedDailyMinutes:capacity.suggestedDailyMinutes,
      bestWindow:capacity.bestWindow,
      focusDropAfterMinutes:capacity.focusDropAfterMinutes,
      recommendedFocusBlockMinutes:capacity.recommendedFocusBlockMinutes,
      lowCompletionDays:capacity.lowCompletionDays,
      confidence:capacity.confidence
    },
    explanation:'Bu plan; vadesi gelen tekrarlar ve akademik performansın yanında öğrencinin ölçülen gerçek çalışma süresi, verimli saat aralığı, odak bloğu ve haftanın düşük tamamlama günleri kullanılarak oluşturulur. Beyan edilen süre tek başına plan kapasitesi değildir.',
    inputs:{practiceRecords:practice.length,incompleteTopics:incomplete.length,pendingReviews:reviews.length,capacityEvidenceDays:capacity.evidenceDays,subjectModels:subjectModels.length},
    days
  };
}
