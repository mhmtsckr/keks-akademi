import {db} from '@/lib/db';

export type MonthlyReportAudience='STUDENT'|'COACH'|'PARENT';

type Period={start:Date;end:Date;label:string;key:string};

function monthPeriod(base:Date,offset=0):Period{
  // Türkiye sabit UTC+3 kullanır. Ay sınırlarını İstanbul yerel saatine göre UTC'ye çeviriyoruz.
  const shifted=new Date(base.getTime()+3*3600000);
  const y=shifted.getUTCFullYear();
  const m=shifted.getUTCMonth()+offset;
  const start=new Date(Date.UTC(y,m,1,-3,0,0));
  const end=new Date(Date.UTC(y,m+1,1,-3,0,0));
  const label=new Intl.DateTimeFormat('tr-TR',{timeZone:'Europe/Istanbul',month:'long',year:'numeric'}).format(start);
  const key=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit'}).format(start);
  return {start,end,label,key};
}
function obj(v:unknown):Record<string,any>{
  return v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,any>:{};
}
function n(v:unknown){
  const x=Number(v);
  return Number.isFinite(x)?x:null;
}
function round(v:number,d=1){
  const p=10**d;
  return Math.round(v*p)/p;
}
function examNet(payload:unknown){
  const p=obj(payload);
  return n(p.net)??n(p.totalNet)??n(p.score);
}
function weightedAccuracy(rows:{correct:number;total:number}[]){
  const total=rows.reduce((s,x)=>s+x.total,0);
  if(total<=0)return null;
  return round(rows.reduce((s,x)=>s+x.correct,0)/total*100,1);
}
function avg(values:number[]){
  return values.length?round(values.reduce((a,b)=>a+b,0)/values.length,2):null;
}
function dayKey(v:Date){
  return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(v);
}
function delta(current:number|null,previous:number|null){
  return current!=null&&previous!=null?round(current-previous,1):null;
}
function percentage(done:number,total:number){
  return total?Math.round(done/total*100):0;
}

export async function buildMonthlyDevelopmentReport(
  studentId:string,
  audience:MonthlyReportAudience='COACH',
  baseDate=new Date()
){
  const current=monthPeriod(baseDate,0);
  const previous=monthPeriod(baseDate,-1);
  const from=previous.start;
  const to=current.end;

  const student=await db.student.findUnique({
    where:{id:studentId},
    select:{
      id:true,fullName:true,studentCode:true,gradeLevel:true,goal:true,
      examResults:{
        where:{createdAt:{gte:from,lt:to}},
        orderBy:{createdAt:'asc'},
        select:{examType:true,payload:true,createdAt:true}
      },
      practiceLogs:{
        where:{date:{gte:from,lt:to}},
        orderBy:{date:'asc'},
        select:{subject:true,topic:true,correct:true,wrong:true,blank:true,total:true,net:true,date:true}
      },
      coachingActions:{
        where:{taskDate:{gte:from,lt:to}},
        select:{id:true,taskDate:true,status:true,subject:true,topic:true,submission:{select:{submittedAt:true,completionRate:true,accuracy:true,totalQuestions:true}}}
      },
      techniqueSessions:{
        where:{createdAt:{gte:from,lt:to}},
        select:{createdAt:true,activeSeconds:true,durationMinutes:true,completed:true}
      },
      reviewQueue:{
        where:{OR:[
          {completedAt:{gte:from,lt:to}},
          {dueAt:{gte:from,lt:to}},
          {status:{in:['DUE','PENDING']}}
        ]},
        select:{dueAt:true,status:true,completedAt:true,lastCorrect:true,question:{select:{subject:true,topic:true}}}
      },
      topicProgress:{
        where:{updatedAt:{gte:from,lt:to}},
        select:{subject:true,topic:true,completed:true,completedAt:true,updatedAt:true}
      },
      weeklyReflections:{
        where:{weekStart:{gte:from,lt:to}},
        select:{weekStart:true,selfRating:true,planRealistic:true,bestThing:true,biggestChallenge:true,nextWeekChange:true,systemSnapshot:true}
      },
      coachingSessions:{
        where:{startsAt:{gte:current.start,lt:current.end},OR:[{status:'COMPLETED'},{completedAt:{not:null}}]},
        select:{id:true,startsAt:true,title:true}
      },
      targets:{where:{active:true},orderBy:{createdAt:'desc'},take:1,select:{institutionName:true,departmentName:true,examLevel:true}}
    }
  });
  if(!student)return null;

  const inPeriod=<T extends {createdAt?:Date;date?:Date;taskDate?:Date|null;weekStart?:Date}>(rows:T[],p:Period,field:'createdAt'|'date'|'taskDate'|'weekStart')=>
    rows.filter(x=>{
      const v=x[field] as Date|null|undefined;
      return Boolean(v&&v>=p.start&&v<p.end);
    });

  const currentExams=inPeriod(student.examResults,current,'createdAt');
  const previousExams=inPeriod(student.examResults,previous,'createdAt');
  const examValues=(rows:typeof currentExams)=>rows.map(x=>examNet(x.payload)).filter((x):x is number=>x!=null);
  const currentExamAvg=avg(examValues(currentExams));
  const previousExamAvg=avg(examValues(previousExams));

  const currentPractice=inPeriod(student.practiceLogs,current,'date');
  const previousPractice=inPeriod(student.practiceLogs,previous,'date');
  const currentAccuracy=weightedAccuracy(currentPractice);
  const previousAccuracy=weightedAccuracy(previousPractice);

  const currentActions=inPeriod(student.coachingActions,current,'taskDate');
  const previousActions=inPeriod(student.coachingActions,previous,'taskDate');
  const completedAction=(x:(typeof currentActions)[number])=>Boolean(x.submission||x.status==='COMPLETED');
  const currentTaskCompletion=percentage(currentActions.filter(completedAction).length,currentActions.length);
  const previousTaskCompletion=percentage(previousActions.filter(completedAction).length,previousActions.length);

  const currentTechnique=inPeriod(student.techniqueSessions,current,'createdAt');
  const previousTechnique=inPeriod(student.techniqueSessions,previous,'createdAt');
  const focus=(rows:typeof currentTechnique)=>Math.round(rows.reduce((s,x)=>s+(x.activeSeconds||0),0)/60);
  const currentFocus=focus(currentTechnique);
  const previousFocus=focus(previousTechnique);

  const activeDays=(period:Period,practice:typeof currentPractice,actions:typeof currentActions,technique:typeof currentTechnique)=>{
    const set=new Set<string>();
    practice.forEach(x=>set.add(dayKey(x.date)));
    actions.forEach(x=>x.submission&&set.add(dayKey(x.submission.submittedAt)));
    technique.forEach(x=>x.activeSeconds>0&&set.add(dayKey(x.createdAt)));
    return set.size;
  };
  const currentActiveDays=activeDays(current,currentPractice,currentActions,currentTechnique);
  const previousActiveDays=activeDays(previous,previousPractice,previousActions,previousTechnique);

  const currentReviews=student.reviewQueue.filter(x=>x.completedAt&&x.completedAt>=current.start&&x.completedAt<current.end);
  const previousReviews=student.reviewQueue.filter(x=>x.completedAt&&x.completedAt>=previous.start&&x.completedAt<previous.end);
  const overdueReviews=student.reviewQueue.filter(x=>['DUE','PENDING'].includes(x.status)&&x.dueAt<baseDate).length;
  const currentReviewCorrect=currentReviews.filter(x=>x.lastCorrect===true).length;
  const previousReviewCorrect=previousReviews.filter(x=>x.lastCorrect===true).length;
  const reviewSuccess=currentReviews.length?Math.round(currentReviewCorrect/currentReviews.length*100):null;
  const previousReviewSuccess=previousReviews.length?Math.round(previousReviewCorrect/previousReviews.length*100):null;

  const subjectMap=new Map<string,{curCorrect:number;curTotal:number;prevCorrect:number;prevTotal:number}>();
  for(const x of currentPractice){
    const key=x.subject||'Genel';
    const row=subjectMap.get(key)||{curCorrect:0,curTotal:0,prevCorrect:0,prevTotal:0};
    row.curCorrect+=x.correct;row.curTotal+=x.total;subjectMap.set(key,row);
  }
  for(const x of previousPractice){
    const key=x.subject||'Genel';
    const row=subjectMap.get(key)||{curCorrect:0,curTotal:0,prevCorrect:0,prevTotal:0};
    row.prevCorrect+=x.correct;row.prevTotal+=x.total;subjectMap.set(key,row);
  }
  const subjectTrends=[...subjectMap.entries()].map(([subject,x])=>{
    const currentAcc=x.curTotal?round(x.curCorrect/x.curTotal*100,1):null;
    const previousAcc=x.prevTotal?round(x.prevCorrect/x.prevTotal*100,1):null;
    return {subject,currentAcc,previousAcc,delta:delta(currentAcc,previousAcc),currentQuestions:x.curTotal,previousQuestions:x.prevTotal};
  });

  const strongAreas=subjectTrends
    .filter(x=>x.currentQuestions>=10&&x.previousQuestions>=10&&x.delta!=null&&x.delta>=5)
    .sort((a,b)=>(b.delta||0)-(a.delta||0))
    .slice(0,3)
    .map(x=>({title:x.subject,detail:`Doğruluk %${x.previousAcc} → %${x.currentAcc} · +${x.delta} puan`}));

  if(currentExamAvg!=null&&previousExamAvg!=null&&currentExamAvg-previousExamAvg>=3){
    strongAreas.unshift({title:'Deneme performansı',detail:`Aylık ortalama ${previousExamAvg} → ${currentExamAvg} · +${round(currentExamAvg-previousExamAvg,1)} net`});
  }
  if(currentTaskCompletion>=75&&currentTaskCompletion-previousTaskCompletion>=10){
    strongAreas.push({title:'Çalışma davranışı',detail:`Görev tamamlama %${previousTaskCompletion} → %${currentTaskCompletion}`});
  }

  const interventionAreas:{title:string;detail:string;priority:number}[]=[];
  subjectTrends.filter(x=>x.currentQuestions>=10&&x.currentAcc!=null&&x.currentAcc<65)
    .forEach(x=>interventionAreas.push({title:x.subject,detail:`Bu ay doğruluk %${x.currentAcc} · ${x.currentQuestions} soru`,priority:100-(x.currentAcc||0)}));
  if(overdueReviews>=3)interventionAreas.push({title:'Tekrar disiplini',detail:`${overdueReviews} gecikmiş tekrar bulunuyor.`,priority:95});
  if(currentActions.length>=3&&currentTaskCompletion<60)interventionAreas.push({title:'Görev sürekliliği',detail:`Bu ay görev tamamlama %${currentTaskCompletion}.`,priority:90});
  if(currentActiveDays<8)interventionAreas.push({title:'Çalışma sürekliliği',detail:`Bu ay ${currentActiveDays} farklı günde kayıtlı çalışma var.`,priority:85});
  if(currentFocus>0&&previousFocus>0&&currentFocus<previousFocus*0.7)interventionAreas.push({title:'Odak süresi',detail:`Kayıtlı odak süresi ${previousFocus} dk → ${currentFocus} dk.`,priority:80});

  interventionAreas.sort((a,b)=>b.priority-a.priority);

  const nextGoals:string[]=[];
  const weakest=interventionAreas[0];
  if(weakest?.title==='Tekrar disiplini')nextGoals.push(`Gecikmiş tekrarları ${overdueReviews} kayıttan 0–2 aralığına indirmek.`);
  else if(weakest?.title==='Görev sürekliliği')nextGoals.push(`Aylık görev tamamlama oranını en az %${Math.min(85,currentTaskCompletion+15)} düzeyine çıkarmak.`);
  else if(weakest?.title==='Çalışma sürekliliği')nextGoals.push('Haftada en az 4 gün düzenli çalışma kaydı oluşturmak.');
  else if(weakest&&subjectTrends.some(x=>x.subject===weakest.title))nextGoals.push(`${weakest.title} doğruluğunu gelecek ay en az 8 puan artırmak.`);

  if(overdueReviews>0&&!nextGoals.some(x=>x.includes('tekrar')))nextGoals.push('0–1–3–7–14–28 tekrar takvimindeki gecikmeleri haftalık olarak kapatmak.');
  const lowSubject=subjectTrends.filter(x=>x.currentQuestions>=10&&x.currentAcc!=null).sort((a,b)=>(a.currentAcc||0)-(b.currentAcc||0))[0];
  if(lowSubject&&!nextGoals.some(x=>x.includes(lowSubject.subject)))nextGoals.push(`${lowSubject.subject} alanında en az 40 nitelikli soru çözüp doğruluk trendini yükseltmek.`);
  if(!nextGoals.some(x=>x.includes('görev'))&&currentActions.length>0)nextGoals.push(`Görev tamamlama oranını %${Math.max(75,Math.min(90,currentTaskCompletion+10))} veya üzerine taşımak.`);
  if(nextGoals.length<3)nextGoals.push('Haftalık öz değerlendirmeyi düzenli tamamlayıp ay sonunda davranış verisiyle karşılaştırmak.');
  if(nextGoals.length<3)nextGoals.push('Ay boyunca en az iki deneme sonucu girip gelişimi aynı sınav türünde karşılaştırmak.');

  const target=student.targets[0];
  const reflections=inPeriod(student.weeklyReflections,current,'weekStart');
  const avgSelf=avg(reflections.map(x=>x.selfRating));
  const avgRealism=avg(reflections.map(x=>x.planRealistic).filter((x):x is number=>x!=null));

  const dataConfidence=
    currentPractice.reduce((s,x)=>s+x.total,0)>=20||currentExams.length>=2||currentActions.length>=4
      ?'YETERLİ'
      :(currentPractice.length||currentExams.length||currentActions.length?'SINIRLI':'YETERSİZ');

  return {
    student:{id:student.id,name:student.fullName,code:student.studentCode,gradeLevel:student.gradeLevel,goal:student.goal,target:target?target.institutionName+(target.departmentName?' · '+target.departmentName:''):null},
    period:{key:current.key,label:current.label,start:current.start,end:current.end,previousLabel:previous.label},
    confidence:dataConfidence,
    academic:{
      examCount:currentExams.length,
      examAverage:audience==='PARENT'?null:currentExamAvg,
      examDelta:delta(currentExamAvg,previousExamAvg),
      practiceQuestions:currentPractice.reduce((s,x)=>s+x.total,0),
      accuracy:currentAccuracy,
      accuracyDelta:delta(currentAccuracy,previousAccuracy),
      completedTopics:student.topicProgress.filter(x=>x.completed&&x.completedAt&&x.completedAt>=current.start&&x.completedAt<current.end).length
    },
    behavior:{
      taskCount:currentActions.length,
      taskCompletion:currentTaskCompletion,
      taskCompletionDelta:currentTaskCompletion-previousTaskCompletion,
      focusMinutes:currentFocus,
      focusDelta:currentFocus-previousFocus,
      activeDays:currentActiveDays,
      activeDaysDelta:currentActiveDays-previousActiveDays,
      selfRating:avgSelf,
      planRealism:avgRealism
    },
    review:{
      completed:currentReviews.length,
      success:reviewSuccess,
      successDelta:delta(reviewSuccess,previousReviewSuccess),
      overdue:overdueReviews
    },
    strongAreas:strongAreas.slice(0,3),
    interventionAreas:interventionAreas.slice(0,4).map(({title,detail})=>({title,detail})),
    nextMonthGoals:nextGoals.slice(0,3),
    coaching:{completedSessions:student.coachingSessions.length},
    generatedAt:baseDate
  };
}
