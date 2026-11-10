/** Descriptive, not causal, follow-up evidence around a coach-created recheck. */
export type OutcomePractice = {
  subject:string;
  topic:string|null;
  date:Date|string;
  total:number;
  correct:number;
  wrong:number;
  blank:number;
  taskSubmissionId?:string|null;
};
export type OutcomeReviewTask={
  id:string;
  subject:string;
  topic:string;
  createdAt:Date|string;
  dueAt:Date|string|null;
  status:string;
};
export type OutcomeState='WAITING_FOR_RECHECK'|'INSUFFICIENT_DATA'|'IMPROVED_SIGNAL'|'DECLINED_SIGNAL'|'NO_CLEAR_CHANGE';
type EvidenceWindow={
  questions:number;correct:number;wrong:number;blank:number;
  accuracy:number|null;blankRate:number|null;studyDays:number;lastAt:string|null;
  studentReportedQuestions:number;
};
export type LearningInterventionOutcome={
  taskId:string;subject:string;topic:string;
  state:OutcomeState;
  confidence:'INSUFFICIENT'|'DESCRIPTIVE_ONLY';
  taskStatus:string;
  openedAt:string;dueAt:string|null;
  baseline:EvidenceWindow;followUp:EvidenceWindow;
  accuracyDelta:number|null;
  blankRateDelta:number|null;
  note:string;
  nextAction:string;
};
const DAY=86400000;
const dayKey=(date:Date)=>new Intl.DateTimeFormat('en-CA',{
  timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'
}).format(date);
const norm=(v:string)=>v.trim().toLocaleLowerCase('tr-TR');
function summary(rows:OutcomePractice[]):EvidenceWindow{
  const questions=rows.reduce((n,x)=>n+x.total,0);
  const correct=rows.reduce((n,x)=>n+x.correct,0);
  const wrong=rows.reduce((n,x)=>n+x.wrong,0);
  const blank=rows.reduce((n,x)=>n+x.blank,0);
  const studyDays=new Set(rows.map(x=>dayKey(new Date(x.date)))).size;
  const studentReportedQuestions=rows.reduce((n,x)=>n+(x.taskSubmissionId?x.total:0),0);
  const lastAt=rows.length?new Date(Math.max(...rows.map(x=>new Date(x.date).getTime()))).toISOString():null;
  return {
    questions,correct,wrong,blank,
    accuracy:questions?Math.round(correct/questions*100):null,
    blankRate:questions?Math.round(blank/questions*100):null,
    studyDays,lastAt,studentReportedQuestions
  };
}
export function evaluateLearningInterventionOutcome(
  task:OutcomeReviewTask,rows:OutcomePractice[],now=new Date()
):LearningInterventionOutcome{
  const started=new Date(task.createdAt);
  const end=new Date(Math.min(now.getTime(),started.getTime()+21*DAY));
  const baselineStart=started.getTime()-14*DAY;
  const matching=rows.filter(row=>{
    const d=new Date(row.date).getTime();
    return norm(row.subject)===norm(task.subject)&&norm(row.topic||'')===norm(task.topic)
      &&Number.isFinite(d)&&d<=now.getTime()
      &&Number.isSafeInteger(row.total)&&row.total>0
      &&[row.correct,row.wrong,row.blank].every(x=>Number.isSafeInteger(x)&&x>=0)
      &&row.correct+row.wrong+row.blank===row.total;
  });
  const before=summary(matching.filter(x=>{
    const t=new Date(x.date).getTime();
    return t>=baselineStart&&t<started.getTime();
  }));
  const after=summary(matching.filter(x=>{
    const t=new Date(x.date).getTime();
    return t>=started.getTime()&&t<=end.getTime();
  }));
  const enoughBefore=before.questions>=12&&before.studyDays>=2;
  const enoughAfter=after.questions>=12&&after.studyDays>=2;
  const sufficient=enoughBefore&&enoughAfter;
  const accuracyDelta=sufficient&&before.accuracy!=null&&after.accuracy!=null
    ?after.accuracy-before.accuracy:null;
  const blankRateDelta=sufficient&&before.blankRate!=null&&after.blankRate!=null
    ?after.blankRate-before.blankRate:null;
  const due=task.dueAt?new Date(task.dueAt).getTime():started.getTime()+3*DAY;
  let state:OutcomeState;
  if(sufficient&&accuracyDelta!=null){
    if(accuracyDelta>=10&&after.accuracy!>=70)state='IMPROVED_SIGNAL';
    else if(accuracyDelta<=-10)state='DECLINED_SIGNAL';
    else state='NO_CLEAR_CHANGE';
  }else if(now.getTime()<due){
    state='WAITING_FOR_RECHECK';
  }else{
    state='INSUFFICIENT_DATA';
  }
  const explanation=sufficient
    ?'Aynı konuda önce '+before.questions+' soru / '+before.studyDays+' gün; sonra '+after.questions+' soru / '+after.studyDays+' gün. Doğruluk '+before.accuracy+'% → '+after.accuracy+'% ('+(accuracyDelta!>0?'+':'')+accuracyDelta+' puan).'
    :'Karşılaştırma için hem önce hem sonra en az 12 soru ve 2 farklı gün kaydı gerekir. Önce '+before.questions+' soru / '+before.studyDays+' gün; sonra '+after.questions+' soru / '+after.studyDays+' gün.';
  const provenance=before.studentReportedQuestions+after.studentReportedQuestions;
  const note=explanation+' '
    +(provenance?'Toplam '+provenance+' soru öğrenci beyanından geliyor. ':'')
    +'Kontrol işinin açılması ölçümün uygulandığını kanıtlamaz; diğer çalışma kayıtları da bağımsız sınav sayılmaz. '
    +'Değişim gözlemsel bir ilişkiyi gösterir, koç müdahalesinin nedensel etkisini kanıtlamaz.';
  const nextActions:Record<OutcomeState,string>={
    WAITING_FOR_RECHECK:'Önerilen kontrol tarihinde farklı sorularla sonucu kaydet; henüz etki ölçümü yapma.',
    INSUFFICIENT_DATA:'Eksik önce/sonra verisini ayrı günlerde kısa soru setleriyle topla; gelişme hükmü verme.',
    IMPROVED_SIGNAL:'Olumlu sinyali 7 gün sonra yeni ve farklı soru türleriyle yeniden doğrula.',
    DECLINED_SIGNAL:'Koçla hata türlerini incele; zorluk ve çalışma koşulları karşılaştırılabilir yeni bir kontrol uygula.',
    NO_CLEAR_CHANGE:'Önceki çözüm yöntemini ve soru türlerini gözden geçir; iki ayrı günde yeni ölçüm yap.'
  };
  return {
    taskId:task.id,subject:task.subject,topic:task.topic,state,
    confidence:sufficient?'DESCRIPTIVE_ONLY':'INSUFFICIENT',
    taskStatus:task.status,
    openedAt:started.toISOString(),
    dueAt:task.dueAt?new Date(task.dueAt).toISOString():null,
    baseline:before,followUp:after,accuracyDelta,blankRateDelta,
    note,nextAction:nextActions[state]
  };
}
