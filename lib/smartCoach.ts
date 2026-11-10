import { db } from '@/lib/db';
import {buildCoachEvidence} from '@/lib/coachEvidence';
import {buildLearningDiagnostics} from '@/lib/learningDiagnostics';
import {allocateWeeklyPriorities} from '@/lib/weeklyPlanPriorities';
import { buildCapacityProfile,buildSubjectLearningModels,dailyPracticeQuestionTarget } from '@/lib/learningEngine';
import {publicEducationContext,resolveEducationLevelProfile,scalePracticeQuestionsForEducationLevel,subjectMatchesEducationLevel} from '@/lib/educationLevelProfile';

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
  const [student,practice,topics,reviews,goal,capacity,subjectModels,coachingActions]=await Promise.all([
    db.student.findUnique({where:{id:studentId}}),
    db.practiceLog.findMany({where:{studentId},orderBy:{date:'desc'},take:100}),
    db.topicProgress.findMany({where:{studentId}}),
    db.reviewQueueItem.findMany({where:{studentId,status:{in:['DUE','PENDING']},dueAt:{lte:new Date(Date.now()+8*86400000)}},orderBy:{dueAt:'asc'},take:120,select:{id:true,dueAt:true}}),
    computeGoalProgress(studentId),
    buildCapacityProfile(studentId),
    buildSubjectLearningModels(studentId),
    db.coachingAction.findMany({
      where:{studentId,status:'ACTIVE',submission:{is:null},periodEnd:{gte:new Date(Date.now()-7*86400000)}},
      select:{id:true,title:true,subject:true,topic:true,metricType:true,targetValue:true,taskDate:true,periodEnd:true},
      orderBy:{periodEnd:'asc'},take:100
    })
  ]);
  if(!student) throw new Error('Öğrenci bulunamadı');
  const educationProfile=resolveEducationLevelProfile(student.gradeLevel,student.academicTrack);
  const eligiblePractice=educationProfile?practice.filter(x=>subjectMatchesEducationLevel(x.subject,educationProfile)):practice;
  const eligibleTopics=educationProfile?topics.filter(x=>subjectMatchesEducationLevel(x.subject,educationProfile)):topics;
  const evidence=buildCoachEvidence(eligiblePractice);
  const topicDiagnostics=buildLearningDiagnostics(eligiblePractice);
  // A single bad question is not enough to label a subject weak.
  const weak=evidence.subjects.filter(x=>x.confidence!=='LOW'&&(x.priority==='REVIEW'||x.priority==='MONITOR'))
    .map(x=>({subject:x.subject,accuracy:x.accuracy/100,questions:x.questions,priority:x.priority,reason:x.reason}));
  const incomplete=eligibleTopics.filter(x=>!x.completed);
  const subjectModelMap=new Map(subjectModels.map(x=>[x.subject,x]));
  // Date arithmetic is anchored at Istanbul-local noon, not the Vercel server timezone.
  const dayKey=(d:Date)=>new Intl.DateTimeFormat('en-CA',{
    timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'
  }).format(d);
  const [year,month,day]=dayKey(new Date()).split('-').map(Number);
  const today=new Date(Date.UTC(year,month-1,day,12,0,0));
  const lowCompletion=new Map((capacity.lowCompletionDays||[]).map(x=>[x.day,x.completionRate]));
  const weekday=(date:Date)=>new Intl.DateTimeFormat('en-US',{timeZone:'Europe/Istanbul',weekday:'short'}).format(date);
  const calendar=Array.from({length:7},(_,i)=>{
    const date=new Date(today);date.setUTCDate(date.getUTCDate()+i);
    const historicalCompletion=lowCompletion.get(weekday(date))??null;
    const dayFactor=historicalCompletion!=null&&historicalCompletion<60?.75:historicalCompletion!=null&&historicalCompletion<75?.9:1;
    return {date,key:dayKey(date),historicalCompletion,
      dayBudget:Math.max(30,Math.min(360,Math.round((capacity.suggestedDailyMinutes||60)*dayFactor)))};
  });
  const priorities=allocateWeeklyPriorities(
    calendar.map(d=>({key:d.key,budgetMinutes:d.dayBudget})),
    coachingActions,reviews
  );
  const selectedTopicIds=new Set<string>();
  const days=[] as any[];
  for(let i=0;i<calendar.length;i++){
    const {date,key,historicalCompletion,dayBudget}=calendar[i];
    const reservation=priorities.byDay[key];
    const tasks:any[]=[...reservation.tasks];
    let used=reservation.reservedMinutes;
    const add=(task:any)=>{
      if(used+task.duration>dayBudget)return false;
      tasks.push(task);used+=task.duration;return true;
    };
    const weakSub=weak.length?weak[i%weak.length]:undefined;
    const topicCandidates=incomplete.filter(x=>!selectedTopicIds.has(x.id));
    const topic=topicCandidates.find(x=>weakSub&&x.subject===weakSub.subject)
      ||topicCandidates[0];
    const focusDuration=Math.min(capacity.recommendedFocusBlockMinutes||35,dayBudget);
    if(topic&&add({type:'TOPIC',title:`${topic.subject} · ${topic.topic}`,duration:focusDuration,reason:capacity.focusDropAfterMinutes
      ?`Uzun oturumlarda doğruluk düşüşü görüldüğü için konu bloğu ${focusDuration} dk ile sınırlandı.`
      :'Konu ilerleme kaydında henüz tamamlanmadığı için gözlenen odak kapasitesine göre plana alındı.'})))selectedTopicIds.add(topic.id);
    if(weakSub&&i%2===0){
      const model=subjectModelMap.get(weakSub.subject);
      const questions=scalePracticeQuestionsForEducationLevel(dailyPracticeQuestionTarget({
        questionCapacity:capacity.questionCapacity,
        accuracy:Math.round(weakSub.accuracy*100)
      }),educationProfile);
      const duration=Math.max(15,Math.min(30,Math.round(questions*1.5)));
      const family=model?.family||'GENERAL';
      const weakestType=model?.weakestQuestionType?.questionType;
      const weakestTopic=model?.weakestTopic?.topic;
      const literatureWeak=(model?.literatureConnections||[]).filter((x:any)=>x.evidence>0).sort((x:any,y:any)=>(x.accuracy??101)-(y.accuracy??101))[0];

      if(family==='MATHEMATICS'){
        add({
          type:'MATH_SPEED_ACCURACY',
          title:weakestType?weakSub.subject+' · '+weakestType+' süreli problem seti':weakSub.subject+' · süreli problem seti',
          duration,questions,
          reason:model?.recommendedAction||'Matematikte hız, doğruluk ve problem tipi birlikte ölçülür.'
        });
      }else if(family==='TURKISH'){
        add({
          type:'TURKISH_TIMED_TYPE',
          title:weakestType?weakSub.subject+' · '+weakestType+' süreli mini set':weakSub.subject+' · soru türü bazlı süreli set',
          duration,questions,
          reason:model?.recommendedAction||'Türkçede soru türü ve çözüm süresi ayrı izlenir.'
        });
      }else if(family==='HISTORY'){
        add({
          type:'HISTORY_ACTIVE_RECALL',
          title:weakestTopic?weakSub.subject+' · '+weakestTopic+' aktif hatırlama':weakSub.subject+' · aktif hatırlama + tekrar',
          duration:Math.min(duration,25),
          questions:Math.min(questions,10),
          reason:model?.recommendedAction||'Tarihte aktif hatırlama ve tekrar başarısı birlikte izlenir.'
        });
      }else if(family==='LITERATURE'){
        add({
          type:'LITERATURE_CONNECTIONS',
          title:literatureWeak?weakSub.subject+' · '+literatureWeak.dimension+' bağlantı çalışması':weakSub.subject+' · dönem–yazar–eser bağlantı çalışması',
          duration:Math.min(duration,25),
          questions:Math.min(questions,12),
          reason:model?.recommendedAction||'Edebiyatta dönem, yazar ve eser bağlantıları ayrı izlenir.'
        });
      }else if(family==='SCIENCE'){
        add({
          type:'SCIENCE_CONCEPT_CHECK',
          title:weakestTopic?weakSub.subject+' · '+weakestTopic+' kavram kontrolü':weakSub.subject+' · kavram kontrolü',
          duration,questions:Math.min(questions,15),
          reason:model?.recommendedAction||'Fen derslerinde konu ve olası kavram yanılgıları ayrı izlenir.'
        });
      }else{
        add({
          type:'PRACTICE',
          title:weakSub.subject+' kısa test',
          duration,questions,
          reason:'Son kayıtlarındaki '+weakSub.questions+' soruda doğruluk %'+Math.round(weakSub.accuracy*100)+'; soru hacmi gerçek günlük kapasiteye göre ayarlandı.'
        });
      }
    }
    if(i===6)add({type:'REVIEW_WEEK',title:'Haftalık değerlendirme ve yeni hedef kontrolü',duration:20,reason:'Haftanın sonunda uygulanan plan ile gerçekleşen performansı karşılaştırmak için.'});
    days.push({
      date:date.toISOString(),
      recommendedWindow:capacity.bestWindow,
      plannedMinutes:used,
      capacityMinutes:dayBudget,
      availableMinutes:dayBudget-used,
      coachReservedMinutes:reservation.tasks.filter(x=>x.type==='COACH_ACTION').reduce((n,x)=>n+x.duration,0),
      reviewReservedMinutes:reservation.tasks.filter(x=>x.type==='REVIEW').reduce((n,x)=>n+x.duration,0),
      historicalCompletion,
      tasks
    });
  }
  return {
    educationContext:publicEducationContext(educationProfile),
    evidence:{windowDays:evidence.windowDays,confidence:evidence.confidence,message:evidence.message,eligibleRecords:evidence.eligibleRecords,subjects:evidence.subjects.slice(0,8)},
    topicDiagnostics,
    prioritySummary:{
      coachTasksConsidered:coachingActions.length,
      coachTasksIncluded:calendar.reduce((n,d)=>n+priorities.byDay[d.key].tasks.filter(x=>x.type==='COACH_ACTION').length,0),
      coachTasksNeedingDecision:priorities.unallocatedCoachTasks,
      allocatedReviewCount:priorities.allocatedReviewCount,
      pendingReviewCount:priorities.pendingReviewCount,
      reviewQueueTruncated:reviews.length===120,
      coachQueueTruncated:coachingActions.length===100
    },
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
    explanation:'Bu öneri taslağı; '+(educationProfile?educationProfile.label+' ders ve çalışma profilini, ':'')+'önce koç tarafından atanmış görevleri, ardından vadesi gelen tekrarları günlük kapasiteye sığdırır. Geriye kalan süreye tamamlanmamış konular bir kez dağıtılır ve yeterli kanıt bulunan zayıf alanlar için dönüşümlü test önerilir. Koç görevlerinin ve tekrarların gerçek tarihleri değiştirilmez; sığmayan yük için koç kararı gerekir. Beyan edilen süre tek başına plan kapasitesi değildir.',
    inputs:{practiceRecords:eligiblePractice.length,incompleteTopics:incomplete.length,pendingReviews:reviews.length,capacityEvidenceDays:capacity.evidenceDays,subjectModels:subjectModels.length},
    days
  };
}
