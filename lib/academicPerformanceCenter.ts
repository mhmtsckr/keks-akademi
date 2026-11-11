import {buildLearningDiagnostics,type LearningSignal} from '@/lib/learningDiagnostics';

/** Descriptive learning signals only. No mastery or causal claims. */
export type PerformancePractice={
  examType:string;subject:string;topic:string|null;date:Date|string;
  total:number;correct:number;wrong:number;blank:number;net:number;
  errorReason:string|null;taskSubmissionId?:string|null;
};
export type ExamEvidence={
  examType:string;subject:string;topic:string;questionType:string;
  examDate:Date|string;correct:number;wrong:number;blank:number;avgSeconds:number|null;
};
type Counts={questions:number;correct:number;wrong:number;blank:number;accuracy:number|null;blankRate:number|null;days:number};
type SubjectReport={
  examType:string;subject:string;counts:Counts;
  reportedQuestions:number;otherPracticeQuestions:number;
  previousSeven:Counts;recentSeven:Counts;accuracyDelta:number|null;
  signal:'MEASURE_MORE'|'IMPROVING'|'DECLINING'|'STEADY';
  priority:'COLLECT_EVIDENCE'|'REVIEW'|'MONITOR'|'MAINTAIN';
  explanation:string;
};
type TopicReport={
  examType:string;subject:string;topic:string;
  signal:LearningSignal;confidence:'INSUFFICIENT'|'MULTI_DAY';
  questions:number;days:number;lastEvidenceDay:string;
  previousAccuracy:number|null;recentAccuracy:number|null;changePoints:number|null;
  reason:string;nextAction:string;reportedQuestions:number;
};
const key=(date:Date)=>new Intl.DateTimeFormat('en-CA',{
  timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'
}).format(date);
const dayStart=(day:string)=>Date.parse(day+'T00:00:00Z');
const normalize=(s:string)=>s.trim().toLocaleLowerCase('tr-TR');
const eligible=(correct:number,wrong:number,blank:number,total:number)=>
  [correct,wrong,blank,total].every(x=>Number.isSafeInteger(x)&&x>=0)
  &&total>0&&correct+wrong+blank===total;
function count(rows:{date:Date|string;total:number;correct:number;wrong:number;blank:number}[]):Counts{
  const questions=rows.reduce((n,x)=>n+x.total,0);
  const correct=rows.reduce((n,x)=>n+x.correct,0);
  const wrong=rows.reduce((n,x)=>n+x.wrong,0);
  const blank=rows.reduce((n,x)=>n+x.blank,0);
  return {
    questions,correct,wrong,blank,
    accuracy:questions?Math.round(correct/questions*100):null,
    blankRate:questions?Math.round(blank/questions*100):null,
    days:new Set(rows.map(x=>key(new Date(x.date)))).size
  };
}
const priorityOrder={REVIEW:0,MONITOR:1,COLLECT_EVIDENCE:2,MAINTAIN:3};
const topicOrder:Record<LearningSignal,number>={
  REGRESSING:0,AT_RISK:1,MEASURE_MORE:2,MIXED:3,IMPROVING:4,CONSISTENT:5
};
const reasons:Record<string,string>={
  BILGI_EKSIKLIGI:'Bilgi eksikliği',
  ISLEM_HATASI:'İşlem hatası',DIKKAT:'Dikkat',
  SORU_KOKU:'Soru kökünü okuma',SURE:'Süre',
  YONTEM_BILMEME:'Yöntem',UNUTMA:'Unutma'
};
export function buildAcademicPerformanceCenter(
  practice:PerformancePractice[],exams:ExamEvidence[],now=new Date()
){
  const nowTime=now.getTime();
  const today=key(now);
  const todayStart=dayStart(today);
  const oldest=dayStart(today)-34*86400000;
  const sevenStart=dayStart(today)-6*86400000;
  const previousStart=dayStart(today)-13*86400000;
  let excludedPractice=0;
  const valid=practice.filter(row=>{
    const date=new Date(row.date);
    const time=date.getTime();
    const ok=Number.isFinite(time)&&time<=nowTime&&time>=oldest
      &&!!row.examType?.trim()&&!!row.subject?.trim()
      &&eligible(row.correct,row.wrong,row.blank,row.total);
    if(!ok)excludedPractice++;
    return ok;
  });
  const all=count(valid);
  const subjectBuckets=new Map<string,PerformancePractice[]>();
  const byExam=new Map<string,PerformancePractice[]>();
  for(const row of valid){
    const exam=row.examType.trim(),subject=row.subject.trim();
    const subjectKey=normalize(exam)+'|'+normalize(subject);
    subjectBuckets.set(subjectKey,[...(subjectBuckets.get(subjectKey)||[]),row]);
    const examKey=normalize(exam);
    byExam.set(examKey,[...(byExam.get(examKey)||[]),row]);
  }
  const subjects:SubjectReport[]=[...subjectBuckets.values()].map(rows=>{
    const first=rows[0],examType=first.examType.trim(),subject=first.subject.trim();
    const counts=count(rows);
    const recentRows=rows.filter(x=>dayStart(key(new Date(x.date)))>=sevenStart);
    const previousRows=rows.filter(x=>{
      const d=dayStart(key(new Date(x.date)));
      return d>=previousStart&&d<sevenStart;
    });
    const recentSeven=count(recentRows),previousSeven=count(previousRows);
    const enoughTrend=recentSeven.questions>=12&&previousSeven.questions>=12
      &&recentSeven.days>=2&&previousSeven.days>=2;
    const accuracyDelta=enoughTrend&&recentSeven.accuracy!=null&&previousSeven.accuracy!=null
      ?recentSeven.accuracy-previousSeven.accuracy:null;
    const reliable=counts.questions>=24&&counts.days>=3;
    const priority:SubjectReport['priority']=!reliable?'COLLECT_EVIDENCE'
      :counts.accuracy!=null&&counts.accuracy<65||counts.blankRate!=null&&counts.blankRate>=20?'REVIEW'
      :counts.accuracy!=null&&counts.accuracy<80||counts.blankRate!=null&&counts.blankRate>=10?'MONITOR'
      :'MAINTAIN';
    const signal:SubjectReport['signal']=accuracyDelta==null?'MEASURE_MORE'
      :accuracyDelta>=10?'IMPROVING':accuracyDelta<=-10?'DECLINING':'STEADY';
    const reportedQuestions=rows.reduce((n,x)=>n+(x.taskSubmissionId?x.total:0),0);
    return {
      examType,subject,counts,reportedQuestions,
      otherPracticeQuestions:counts.questions-reportedQuestions,
      previousSeven,recentSeven,accuracyDelta,signal,priority,
      explanation:!reliable
        ?'En az 24 soru ve 3 ayrı çalışma günü olmadan ders önceliği kesinleştirilmez.'
        :accuracyDelta==null
          ?'İki ayrı yedi günlük dönem için en az 12 soru ve iki farklı gün kaydı gerekli.'
          :'Önceki yedi günde %'+previousSeven.accuracy+', son yedi günde %'+recentSeven.accuracy+
            ' doğruluk; fark '+(accuracyDelta>0?'+':'')+accuracyDelta+' puan. Bu gözlemsel değişimdir.'
    };
  }).sort((a,b)=>priorityOrder[a.priority]-priorityOrder[b.priority]
    ||(b.counts.questions-a.counts.questions)||a.subject.localeCompare(b.subject,'tr'));
  const topics:TopicReport[]=[...byExam.values()].flatMap(rows=>{
    const examType=rows[0].examType.trim();
    return buildLearningDiagnostics(rows,now,40).map(x=>({
      examType,subject:x.subject,topic:x.topic,signal:x.signal,
      confidence:x.confidence,questions:x.totalQuestions,days:x.studyDays,
      lastEvidenceDay:x.lastEvidenceDay,
      previousAccuracy:x.earlyAccuracy,recentAccuracy:x.recentAccuracy,
      changePoints:x.deltaPoints,reason:x.reason,
      nextAction:x.nextAction,reportedQuestions:x.studentReportedQuestions
    }));
  }).sort((a,b)=>topicOrder[a.signal]-topicOrder[b.signal]
    ||b.questions-a.questions||a.subject.localeCompare(b.subject,'tr')).slice(0,24);
  const errorCounts=new Map<string,{examType:string;code:string;records:number;wrong:number}>();
  for(const row of valid){
    if(row.wrong===0)continue;
    const code=row.errorReason?.trim().toUpperCase()||'UNSPECIFIED';
    const examType=row.examType.trim();
    const bucket=normalize(examType)+'|'+code;
    const current=errorCounts.get(bucket)||{examType,code,records:0,wrong:0};
    current.records++;current.wrong+=row.wrong;
    errorCounts.set(bucket,current);
  }
  const errorReasons=[...errorCounts.values()].map(x=>({
    examType:x.examType,code:x.code,
    label:reasons[x.code]|| (x.code==='UNSPECIFIED'?'Neden belirtilmedi':'Diğer / sınıflanmamış'),
    records:x.records,wrongQuestionsInRecords:x.wrong
  })).sort((a,b)=>b.records-a.records).slice(0,30);
  const validExams=exams.filter(x=>{
    const d=new Date(x.examDate).getTime(),total=x.correct+x.wrong+x.blank;
    return Number.isFinite(d)&&d<=nowTime&&d>=oldest
      &&x.examType?.trim()&&x.subject?.trim()&&x.topic?.trim()
      &&eligible(x.correct,x.wrong,x.blank,total);
  });
  const examByTopic=new Map<string,ExamEvidence[]>();
  for(const x of validExams){
    const k=normalize(x.examType)+'|'+normalize(x.subject)+'|'+normalize(x.topic);
    examByTopic.set(k,[...(examByTopic.get(k)||[]),x]);
  }
  const formalExamTopics=[...examByTopic.values()].map(rows=>{
    const first=rows[0],counts=count(rows.map(x=>({
      date:x.examDate,total:x.correct+x.wrong+x.blank,
      correct:x.correct,wrong:x.wrong,blank:x.blank
    })));
    return {examType:first.examType,subject:first.subject,topic:first.topic,
      ...counts,recordCount:rows.length};
  }).sort((a,b)=>b.questions-a.questions).slice(0,12);
  const totalReported=valid.reduce((n,x)=>n+(x.taskSubmissionId?x.total:0),0);
  return {
    windowDays:35,from:new Date(oldest).toISOString().slice(0,10),through:today,
    overview:{...all,reportedQuestions:totalReported,
      otherPracticeQuestions:all.questions-totalReported,excludedPractice},
    subjects,topics,errorReasons,formalExamTopics,
    examEvidenceRecords:validExams.length,
    recommendations:subjects.slice(0,5).map(x=>({
      examType:x.examType,subject:x.subject,priority:x.priority,
      reason:x.explanation,
      suggestedAction:x.priority==='REVIEW'
        ?'Önce yanlış/boş nedenlerini gözden geçir, ardından farklı iki günde kısa kontrol uygula.'
        :x.priority==='MONITOR'?'Yeni soru türleri ve süre baskısıyla iki kısa kontrol yap.'
        :x.priority==='COLLECT_EVIDENCE'?'Farklı günlerde en az 24 geçerli soru verisi biriktir.'
        :'Bir hafta sonra yeni soru türleriyle kalıcılık ve transferi yeniden kontrol et.'
    })),
    limitations:'Soru çözüm kayıtları öğrenci girişleri içerebilir; öğrenci görev teslimleri ayrıca işaretlidir. Diğer pratik kayıtları da bağımsız sınav kanıtı değildir. Deneme soru analizleri ayrı gösterilir ve toplam pratiğe eklenerek çift sayılmaz. Yanlış nedeni tek bir kayıt için girilir; o kayıttaki her yanlış sorunun kesin nedeni sayılamaz. Dönemsel doğruluk farkı nedensel etki veya kalıcı öğrenme kanıtı değildir.'
  };
}
