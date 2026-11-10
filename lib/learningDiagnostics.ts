/**
 * A descriptive cross-day learning signal, not a mastery verdict.
 * Never labels a single exercise or student-reported completion as learned.
 */
export type LearningDiagnosticInput={
  subject:string;topic:string|null;date:Date|string;
  total:number;correct:number;wrong:number;blank:number;
  taskSubmissionId?:string|null;
};
export type LearningSignal='MEASURE_MORE'|'IMPROVING'|'REGRESSING'|'CONSISTENT'|'AT_RISK'|'MIXED';
export type TopicDiagnostic={
  subject:string;topic:string;signal:LearningSignal;
  confidence:'INSUFFICIENT'|'MULTI_DAY';
  totalQuestions:number;studyDays:number;
  lastEvidenceDay:string;
  otherPracticeQuestions:number;
  earlyAccuracy:number|null;recentAccuracy:number|null;
  earlyBlankRate:number|null;recentBlankRate:number|null;
  deltaPoints:number|null;
  studentReportedQuestions:number;
  reason:string;nextAction:string;
};

function roundPct(a:number,b:number){return b?Math.round(a/b*100):null;}
const istKey=(d:Date)=>new Intl.DateTimeFormat('en-CA',{
  timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'
}).format(d);

export function buildLearningDiagnostics(
  data:LearningDiagnosticInput[],now=new Date(),maxTopics=8
):TopicDiagnostic[]{
  const groups=new Map<string,{
    subject:string;topic:string;
    byDay:Map<string,{q:number;c:number;b:number;selfReported:number}>;
  }>();
  const cutoff=now.getTime()-35*86400000;
  for(const row of data){
    const date=new Date(row.date);
    if(!Number.isFinite(date.getTime())||date.getTime()>now.getTime()||date.getTime()<cutoff)continue;
    const subject=row.subject?.trim();const topic=row.topic?.trim();
    if(!subject||!topic)continue;
    const values=[row.total,row.correct,row.wrong,row.blank];
    if(!values.every(x=>Number.isSafeInteger(x)&&x>=0)||row.total<=0
      ||row.correct+row.wrong+row.blank!==row.total)continue;
    const key=subject.toLocaleLowerCase('tr-TR')+'|'+topic.toLocaleLowerCase('tr-TR');
    let group=groups.get(key);
    if(!group){group={subject,topic,byDay:new Map()};groups.set(key,group);}
    const day=istKey(date);
    const current=group.byDay.get(day)||{q:0,c:0,b:0,selfReported:0};
    current.q+=row.total;current.c+=row.correct;current.b+=row.blank;
    if(row.taskSubmissionId)current.selfReported+=row.total;
    group.byDay.set(day,current);
  }
  const result:TopicDiagnostic[]=[];
  for(const group of groups.values()){
    const days=[...group.byDay].sort(([a],[b])=>a.localeCompare(b));
    const totals=days.reduce((sum,[,x])=>({
      q:sum.q+x.q,c:sum.c+x.c,b:sum.b+x.b,selfReported:sum.selfReported+x.selfReported
    }),{q:0,c:0,b:0,selfReported:0});
    const middle=Math.ceil(days.length/2);
    const early=days.slice(0,middle).reduce((sum,[,x])=>({
      q:sum.q+x.q,c:sum.c+x.c,b:sum.b+x.b
    }),{q:0,c:0,b:0});
    const recent=days.slice(middle).reduce((sum,[,x])=>({
      q:sum.q+x.q,c:sum.c+x.c,b:sum.b+x.b
    }),{q:0,c:0,b:0});
    // Two independent calendar-day windows with enough questions in each.
    const sufficient=days.length>=4&&early.q>=12&&recent.q>=12
      &&(Date.parse(days[days.length-1][0])-Date.parse(days[0][0]))>=3*86400000;
    const earlyAccuracy=roundPct(early.c,early.q);
    const recentAccuracy=roundPct(recent.c,recent.q);
    const earlyBlankRate=roundPct(early.b,early.q);
    const recentBlankRate=roundPct(recent.b,recent.q);
    const deltaPoints=sufficient&&earlyAccuracy!=null&&recentAccuracy!=null
      ?recentAccuracy-earlyAccuracy:null;
    let signal:LearningSignal='MEASURE_MORE';
    if(sufficient&&recentAccuracy!=null&&earlyAccuracy!=null&&deltaPoints!=null){
      if(deltaPoints<=-15&&recentAccuracy<=70)signal='REGRESSING';
      else if(deltaPoints>=15&&recentAccuracy>=70)signal='IMPROVING';
      else if(recentAccuracy<70&&earlyAccuracy<70)signal='AT_RISK';
      else if(recentAccuracy>=80&&earlyAccuracy>=80&&(recentBlankRate??100)<=10)signal='CONSISTENT';
      else signal='MIXED';
    }
    const actions:Record<LearningSignal,string>={
      MEASURE_MORE:'En az iki farklı günde, her gün 6–10 yeni soru çöz ve yanlış nedenlerini kaydet.',
      IMPROVING:'Üç gün sonra yeni sorularla kaynaksız kontrol yap; yüksek doğruluğun sürüp sürmediğini ölç.',
      REGRESSING:'Koçla hata örneklerini incele; 5 dakikalık kavram hatırlaması sonrası yeni 8 soruluk kontrol yap.',
      CONSISTENT:'Bir hafta sonra farklı soru türleriyle transfer kontrolü yap; kalıcı öğrenme varsayma.',
      AT_RISK:'Bilgi ve yöntem kaynaklı hataları ayır; kısa anlatımın ardından farklı günlerde yeniden ölç.',
      MIXED:'Çözüm türlerini ve süreyi ayrı izle; iki bağımsız mini testle kararsız örüntüyü netleştir.'
    };
    const reason=!sufficient
      ?'Son 35 günde '+totals.q+' soru, '+days.length+' farklı gün. İki ayrı dönem için en az 12’şer soru ve toplam 4 gün gerekli.'
      :'İlk dönem %'+earlyAccuracy+' → son dönem %'+recentAccuracy+' ('+(deltaPoints!>0?'+':'')+deltaPoints+' puan). Son dönem boş oranı %'+recentBlankRate+'.';
    result.push({
      subject:group.subject,topic:group.topic,signal,
      confidence:sufficient?'MULTI_DAY':'INSUFFICIENT',
      totalQuestions:totals.q,studyDays:days.length,
      lastEvidenceDay:days[days.length-1][0],
      otherPracticeQuestions:totals.q-totals.selfReported,
      earlyAccuracy:sufficient?earlyAccuracy:null,recentAccuracy:sufficient?recentAccuracy:null,
      earlyBlankRate:sufficient?earlyBlankRate:null,recentBlankRate:sufficient?recentBlankRate:null,
      deltaPoints,studentReportedQuestions:totals.selfReported,
      reason:reason+(totals.selfReported?' '+totals.selfReported+' soru öğrenci görev beyanından geliyor.':''),
      nextAction:actions[signal]
    });
  }
  const rank:Record<LearningSignal,number>={
    REGRESSING:0,AT_RISK:1,MEASURE_MORE:2,MIXED:3,IMPROVING:4,CONSISTENT:5
  };
  return result.sort((a,b)=>rank[a.signal]-rank[b.signal]
    ||(b.totalQuestions-a.totalQuestions)
    ||a.subject.localeCompare(b.subject,'tr')
  ).slice(0,Math.max(0,Math.min(30,Math.floor(maxTopics))));
}
