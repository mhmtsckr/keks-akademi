export type SessionActionEvidence={
  id:string;title:string;status:string;periodEnd:Date;updatedAt:Date;
  submission:{id:string;submittedAt:Date}|null;
};

export function summarizeSessionActions(rows:SessionActionEvidence[],now=new Date()){
  const since=new Date(now.getTime()-7*86400000);
  const completed=rows.filter(x=>
    Boolean(x.submission)&&x.submission!.submittedAt>=since||
    x.status==='COMPLETED'&&x.updatedAt>=since
  );
  const notCompleted=rows.filter(x=>
    x.status==='ACTIVE'&&!x.submission&&x.periodEnd<now
  );
  return {
    completed:completed.map(x=>({id:x.id,title:x.title,at:x.submission?.submittedAt||x.updatedAt})),
    notCompleted:notCompleted.map(x=>({id:x.id,title:x.title,dueAt:x.periodEnd})),
    completedCount:completed.length,
    notCompletedCount:notCompleted.length
  };
}

export type SessionReviewEvidence={
  id:string;status:string;dueAt:Date;completedAt:Date|null;lastCorrect:boolean|null;
  question:{subject:string;topic:string|null};
};

export function summarizeSessionReviews(rows:SessionReviewEvidence[],now=new Date()){
  const since=new Date(now.getTime()-7*86400000);
  const dayStart=new Date(now);dayStart.setHours(0,0,0,0);
  const nextDay=new Date(dayStart.getTime()+86400000);
  const completed=rows.filter(x=>x.status==='COMPLETED'&&x.completedAt&&x.completedAt>=since);
  const dueToday=rows.filter(x=>['DUE','PENDING'].includes(x.status)&&x.dueAt>=dayStart&&x.dueAt<nextDay);
  const overdue=rows.filter(x=>['DUE','PENDING'].includes(x.status)&&x.dueAt<dayStart);
  const successful=completed.filter(x=>x.lastCorrect===true).length;
  return {
    completedCount:completed.length,
    successfulCount:successful,
    successPercent:completed.length?Math.round(successful/completed.length*100):null,
    dueTodayCount:dueToday.length,
    overdueCount:overdue.length,
    dueToday:dueToday.slice(0,5).map(x=>({subject:x.question.subject,topic:x.question.topic,dueAt:x.dueAt})),
    overdue:overdue.slice(0,5).map(x=>({subject:x.question.subject,topic:x.question.topic,dueAt:x.dueAt}))
  };
}

function examValue(exam:{payload:unknown}|null|undefined){
  const p=exam?.payload&&typeof exam.payload==='object'&&!Array.isArray(exam.payload)?exam.payload as Record<string,unknown>:{};
  const n=Number(p.net??p.score);
  return Number.isFinite(n)?n:null;
}

export function buildExamNetChange(exams:{examType:string;createdAt:Date;payload:unknown}[]){
  for(let i=0;i<exams.length;i++){
    const current=exams[i];
    const currentValue=examValue(current);
    if(currentValue==null)continue;
    const previous=exams.slice(i+1).find(x=>x.examType===current.examType&&examValue(x)!=null);
    if(!previous)continue;
    const previousValue=examValue(previous)!;
    return {
      examType:current.examType,
      current:currentValue,
      previous:previousValue,
      delta:Number((currentValue-previousValue).toFixed(2)),
      currentAt:current.createdAt,
      previousAt:previous.createdAt
    };
  }
  const latest=exams.find(x=>examValue(x)!=null);
  return latest?{examType:latest.examType,current:examValue(latest),previous:null,delta:null,currentAt:latest.createdAt,previousAt:null}:null;
}

export function previousSessionDecisions(value:unknown){
  return Array.isArray(value)?value.filter((x):x is string=>typeof x==='string'&&x.trim().length>0).map(x=>x.trim()):[];
}
