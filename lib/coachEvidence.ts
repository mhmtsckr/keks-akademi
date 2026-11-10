/** Evidence quality is separate from achievement: one bad answer is not a diagnosis. */
export type CoachEvidenceRow={
  subject:string;total:number;correct:number;wrong:number;blank:number;date:Date|string;
};
export type CoachEvidenceLevel='LOW'|'MEDIUM'|'HIGH';
export type CoachEvidencePriority='REVIEW'|'MONITOR'|'MAINTAIN'|'COLLECT_EVIDENCE';
export type CoachSubjectEvidence={
  subject:string;questions:number;correct:number;wrong:number;blank:number;
  accuracy:number;blankRate:number;studyDays:number;
  confidence:CoachEvidenceLevel;priority:CoachEvidencePriority;reason:string;
};

export function buildCoachEvidence(rows:CoachEvidenceRow[],now=new Date()){
  const cutoff=now.getTime()-35*86400000;
  const buckets=new Map<string,{q:number;c:number;w:number;b:number;days:Set<string>}>();
  let eligibleRecords=0;
  for(const row of rows){
    const time=new Date(row.date).getTime();
    if(!Number.isFinite(time)||time>now.getTime()||time<cutoff)continue;
    if(!row.subject?.trim()||![row.total,row.correct,row.wrong,row.blank].every(Number.isFinite))continue;
    if(![row.total,row.correct,row.wrong,row.blank].every(n=>Number.isInteger(n)&&n>=0)
      ||row.total===0||row.correct+row.wrong+row.blank!==row.total)continue;
    eligibleRecords++;
    const subject=row.subject.trim();
    const b=buckets.get(subject)||{q:0,c:0,w:0,b:0,days:new Set<string>()};
    b.q+=row.total;b.c+=row.correct;b.w+=row.wrong;b.b+=row.blank;
    b.days.add(new Date(time).toISOString().slice(0,10));
    buckets.set(subject,b);
  }
  const subjects:CoachSubjectEvidence[]=[...buckets].map(([subject,row])=>{
    const studyDays=row.days.size;
    const confidence:CoachEvidenceLevel=row.q>=40&&studyDays>=3?'HIGH':row.q>=12&&studyDays>=2?'MEDIUM':'LOW';
    const accuracy=Math.round(row.c/row.q*100);
    const blankRate=Math.round(row.b/row.q*100);
    const priority:CoachEvidencePriority=confidence==='LOW'?'COLLECT_EVIDENCE'
      :accuracy<60||blankRate>=20?'REVIEW'
      :accuracy<78||blankRate>=10?'MONITOR':'MAINTAIN';
    const reason=confidence==='LOW'
      ?'Son 35 günde '+row.q+' soru ve '+studyDays+' farklı gün kaydı var. Kalıcı bir öğrenme eksikliği çıkarımı için kanıt yetersiz.'
      :'Son 35 günde '+row.q+' soru, '+studyDays+' gün; doğruluk %'+accuracy+', boş oranı %'+blankRate+'.';
    return {subject,questions:row.q,correct:row.c,wrong:row.w,blank:row.b,
      accuracy,blankRate,studyDays,confidence,priority,reason};
  });
  const order:Record<CoachEvidencePriority,number>={REVIEW:0,MONITOR:1,COLLECT_EVIDENCE:2,MAINTAIN:3};
  subjects.sort((a,b)=>order[a.priority]-order[b.priority]||a.accuracy-b.accuracy||b.questions-a.questions||a.subject.localeCompare(b.subject,'tr'));
  const reliable=subjects.filter(x=>x.confidence!=='LOW');
  const confidence:CoachEvidenceLevel=reliable.some(x=>x.confidence==='HIGH')?'HIGH':reliable.length?'MEDIUM':'LOW';
  return {
    windowDays:35,eligibleRecords,confidence,
    message:eligibleRecords===0?'Son 35 günde geçerli soru kaydı yok. Öneriler konu planına dayanır, performans eksikliği kesinleştirilemez.'
      :confidence==='LOW'?'Soru kanıtı henüz sınırlı. MİZA ve Akıllı Koç ek ölçüm önermeli; kesin konu eksiği ilan etmemeli.'
      :'Güncel soru kayıtları kullanıldı. Öğrenci beyanına dayalı sonuçlar bağımsız tekrar ve denemelerle doğrulanmalıdır.',
    subjects
  };
}
