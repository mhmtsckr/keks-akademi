/**
 * Before/after observation around the date a coach OPENED a review request.
 * Opening a request is not proof that an instructional intervention occurred.
 * Exam analytics and practice logs are kept as separate evidence streams.
 */
type EvidenceRow={
  examType:string;subject:string;topic:string|null;
  date:Date|string;correct:number;wrong:number;blank:number;
};
export type CrossSourceTask={
  id:string;examType:string;subject:string;topic:string;
  createdAt:Date|string;status:string;
};
type Window={questions:number;accuracy:number|null;days:number;reported?:number};
export type AcademicFollowUpState=
  'WAITING_FOR_DATA'|'INSUFFICIENT_DATA'|'GAP_NARROWED'|'GAP_WIDENED'|'GAP_SIMILAR';
export type AcademicFollowUpResult={
  taskId:string;examType:string;subject:string;topic:string;taskStatus:string;
  openedAt:string;state:AcademicFollowUpState;
  baseline:{practice:Window;exam:Window;gapPoints:number|null};
  followUp:{practice:Window;exam:Window;gapPoints:number|null};
  absoluteGapChange:number|null;note:string;nextAction:string;
};
const norm=(s:string)=>s.trim().toLocaleLowerCase('tr-TR');
const dayKey=(d:Date)=>new Intl.DateTimeFormat('en-CA',{
  timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'
}).format(d);
function aggregate(rows:EvidenceRow[],from:number,to:number){
  let questions=0,correct=0;
  const days=new Set<string>();
  for(const row of rows){
    const date=new Date(row.date),timestamp=date.getTime();
    const q=row.correct+row.wrong+row.blank;
    if(!Number.isFinite(timestamp)||timestamp<from||timestamp>to
      ||![row.correct,row.wrong,row.blank].every(n=>Number.isSafeInteger(n)&&n>=0)
      ||q<=0)continue;
    questions+=q;correct+=row.correct;days.add(dayKey(date));
  }
  return {questions,accuracy:questions?Math.round(correct/questions*100):null,days:days.size};
}
export function evaluateAcademicCrossSourceOutcome(
  task:CrossSourceTask,practices:EvidenceRow[],exams:EvidenceRow[],now=new Date()
):AcademicFollowUpResult{
  const opened=new Date(task.createdAt),openedAt=opened.getTime();
  if(!Number.isFinite(openedAt))throw new Error('Geçersiz müdahale incelemesi zamanı.');
  const start=openedAt-14*86400000,end=Math.min(now.getTime(),openedAt+21*86400000);
  const relevant=(row:EvidenceRow)=>norm(row.examType)===norm(task.examType)
    &&norm(row.subject)===norm(task.subject)&&norm(row.topic||'')===norm(task.topic);
  const p=practices.filter(relevant),e=exams.filter(relevant);
  const baselineP=aggregate(p,start,openedAt-1),followP=aggregate(p,openedAt,end);
  const baselineE=aggregate(e,start,openedAt-1),followE=aggregate(e,openedAt,end);
  const qualified=(a:Window,b:Window)=>a.questions>=20&&a.days>=2&&b.questions>=10&&b.days>=2;
  const baselineGap=qualified(baselineP,baselineE)&&baselineP.accuracy!=null&&baselineE.accuracy!=null
    ?baselineP.accuracy-baselineE.accuracy:null;
  const followGap=qualified(followP,followE)&&followP.accuracy!=null&&followE.accuracy!=null
    ?followP.accuracy-followE.accuracy:null;
  const gapChange=baselineGap!=null&&followGap!=null
    ?Math.abs(followGap)-Math.abs(baselineGap):null;
  let state:AcademicFollowUpState;
  if(gapChange!=null){
    state=gapChange<=-10?'GAP_NARROWED':gapChange>=10?'GAP_WIDENED':'GAP_SIMILAR';
  }else if(now.getTime()<openedAt+48*3600000)state='WAITING_FOR_DATA';
  else state='INSUFFICIENT_DATA';
  const notes:Record<AcademicFollowUpState,string>={
    WAITING_FOR_DATA:'Koç inceleme kaydı yeni açıldı; önce ve sonra için farklı günlerden soru verileri bekleniyor.',
    INSUFFICIENT_DATA:'Önce/sonra dönemlerinin her birinde pratik için en az 20 soru/2 gün ve deneme konu analizi için 10 soru/2 gün gerekli.',
    GAP_NARROWED:'İki kaynak arasındaki mutlak doğruluk farkı azaldı. Bu gözlemsel yakınsama, müdahalenin başarı veya öğrenme etkisini kanıtlamaz.',
    GAP_WIDENED:'İki kaynak arasındaki mutlak doğruluk farkı büyüdü. Soru güçlüğü, ölçüm biçimi ve test koşulları incelenmeli.',
    GAP_SIMILAR:'Kaynaklar arasındaki doğruluk farkı benzer kaldı. Yeni ve karşılaştırılabilir soru setleriyle kontrol sürdürülmeli.'
  };
  const nextAction=state==='GAP_NARROWED'
    ?'Bir hafta sonra farklı soru türleriyle yeni bir transfer kontrolü yap; iki kaynağın doğruluk düzeylerini ayrı incele.'
    :state==='GAP_WIDENED'
      ?'Koç soru güçlüklerini ve süre koşullarını eşleştirerek yeni iki aşamalı değerlendirme planlasın.'
      :'Farklı iki günde yeni kazanım soruları ve deneme konu analizleri topla; kesin performans yargısı üretme.';
  return {
    taskId:task.id,examType:task.examType,subject:task.subject,topic:task.topic,
    taskStatus:task.status,openedAt:opened.toISOString(),state,
    baseline:{practice:baselineP,exam:baselineE,gapPoints:baselineGap},
    followUp:{practice:followP,exam:followE,gapPoints:followGap},
    absoluteGapChange:gapChange,
    note:notes[state]+' İnceleme kaydının açılması, koç müdahalesinin uygulandığını göstermez. Pratik ve deneme analizleri bağımsız gözetim kanıtı olmayabilir; sonuçlar nedensel değildir.',
    nextAction
  };
}
