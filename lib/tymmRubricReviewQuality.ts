/**
 * Quality gate for human rubrics. Score and rationale are separate educator
 * observations; rationale does not independently prove experimental performance.
 */
export type RubricCriterionSummary={id:string;label:string};
export function validateRubricEvidence(
 criteria:readonly RubricCriterionSummary[],
 scores:Readonly<Record<string,number>>,
 evidence:Readonly<Record<string,string>>
){
 if(criteria.length!==4||new Set(criteria.map(x=>x.id)).size!==4)
  throw new Error('Dört benzersiz rubrik ölçütü gerekli.');
 if(!evidence||typeof evidence!=='object'||Array.isArray(evidence))
  throw new Error('Rubrik kanıt gerekçeleri eksik.');
 const ids=new Set(criteria.map(c=>c.id));
 if(Object.keys(evidence).some(id=>!ids.has(id)))
  throw new Error('Rubrik dışı ölçüte gerekçe yazılamaz.');
 const normalized:Record<string,string>={};
 for(const c of criteria){
  const score=scores[c.id];
  const raw=evidence[c.id];
  if(!Number.isInteger(score)||score<0||score>2)throw new Error('Rubrik puanı geçersiz.');
  if(raw!==undefined&&typeof raw!=='string')throw new Error('Gerekçe metin olmalı.');
  const note=(raw||'').trim();
  if(note.length>500)throw new Error('Ölçüt gerekçesi 500 karakteri geçemez.');
  if(score<2&&note.length<20)
   throw new Error(c.label+' için 0/1 puana en az 20 karakterlik somut gerekçe yazılmalıdır.');
  if(note.length>0&&note.length<20)
   throw new Error('Girilen ölçüt gerekçesi en az 20 karakter olmalı.');
  if(note)normalized[c.id]=note;
 }
 return normalized;
}

export type RubricQueueItem={id:string;status:string;submittedAt:Date|string;phase?:string};
export function buildRubricReviewQueue<T extends RubricQueueItem>(items:readonly T[],now:Date){
 const pending=items.filter(item=>item.status==='WAITING_FOR_COACH')
  .map(item=>({
   item,
   ageHours:Math.max(0,Math.floor((now.getTime()-new Date(item.submittedAt).getTime())/3600000))
  }))
  .sort((a,b)=>{
   const diff=new Date(a.item.submittedAt).getTime()-new Date(b.item.submittedAt).getTime();
   return diff||a.item.id.localeCompare(b.item.id);
  });
 return {
  pending:pending.map(x=>({...x.item,ageHours:x.ageHours})),
  count:pending.length,
  waitingOver48Hours:pending.filter(x=>x.ageHours>=48).length,
  oldestWaitingHours:pending.length?pending[0].ageHours:0,
  note:'48 saat uyarısı yalnız öncelik sinyalidir, koç yanıt süresi garantisi değildir.'
 };
}
