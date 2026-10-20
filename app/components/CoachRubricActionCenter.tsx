'use client';
import {useEffect,useState} from 'react';

type Suggestion={criterionId:string;criterionLabel:string;score:number;outOf:number;task:string;expectedEvidence:string;minutes:number;assigned:boolean};
type Review={id:string;taskId:string;grade:number;subject:string;title:string;phase:string;reviewedAt:string;suggestions:Suggestion[]};
type RemediationImpact={status:string;originalScore:number|null;independentScore:number|null;change:number|null;statement:string;limitations:string};
type Summary={totalAssigned:number;accepted:number;independentlyReassessed:number;increased:number;unchanged:number;decreased:number;missingFollowUp:number};
type Assignment={id:string;impact?:RemediationImpact|null;reviewSubmissionId:string;criterionId:string;status:string;taskId:string;
 criterionLabel:string;assignment:string;expectedEvidence:string;minutes:number;coachNote:string;
 reflection:string|null;assignedAt:string;completedAt:string|null;attemptCount?:number;
 review?:{decision:'ACCEPT'|'REVISE';feedback:string;reviewedAt:string}|null;
 reviewHistory?:{attempt:number;decision:string;feedback:string;reviewedAt:string}[]};

export function CoachRubricActionCenter({studentId,reviewVersion}:{studentId:string;reviewVersion:string}){
 const [reviews,setReviews]=useState<Review[]>([]);
 const [assignments,setAssignments]=useState<Assignment[]>([]);
 const [remediationSummary,setRemediationSummary]=useState<Summary|null>(null);
 const [notes,setNotes]=useState<Record<string,string>>({});
 const [reviewNotes,setReviewNotes]=useState<Record<string,string>>({});
 const [busy,setBusy]=useState('');
 const [msg,setMsg]=useState('');
 async function load(){
  try{
   const r=await fetch('/api/coach/students/'+studentId+'/performance-actions',{cache:'no-store'});
   const j=await r.json();
   if(!r.ok)throw new Error(j.error||'Telafi önerileri alınamadı.');
   setReviews(j.reviews||[]);setAssignments(j.assignments||[]);
   setRemediationSummary(j.remediationSummary||null);
  }catch(e){setMsg('Hata: '+(e instanceof Error?e.message:'Yüklenemedi.'));}
 }
 useEffect(()=>{void load();},[studentId,reviewVersion]);
 async function assign(review:Review,suggestion:Suggestion){
  const key=review.id+'|'+suggestion.criterionId;
  setBusy(key);setMsg('');
  try{
   const r=await fetch('/api/coach/students/'+studentId+'/performance-actions',{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({reviewSubmissionId:review.id,
      criterionId:suggestion.criterionId,coachNote:(notes[key]||'').trim()})
   });
   const j=await r.json();
   if(!r.ok)throw new Error(j.error||'Atanamadı.');
   setMsg(j.message);await load();
  }catch(e){setMsg('Hata: '+(e instanceof Error?e.message:'Atanamadı.'));}
  finally{setBusy('');}
 }
 async function review(action:Assignment,decision:'ACCEPT'|'REVISE'){
  const note=(reviewNotes[action.id]||'').trim();
  if(note.length<30){setMsg('Koç incelemesi için en az 30 karakter somut gerekçe yazılmalı.');return;}
  setBusy(action.id);setMsg('');
  try{
   const r=await fetch('/api/coach/students/'+studentId+'/performance-actions',{
     method:'PATCH',headers:{'content-type':'application/json'},
     body:JSON.stringify({assignmentId:action.id,decision,feedback:note})
   });
   const j=await r.json();
   if(!r.ok)throw new Error(j.error||'Kanıt değerlendirilemedi.');
   setMsg(j.message);setReviewNotes(prev=>({...prev,[action.id]:''}));await load();
  }catch(e){setMsg('Hata: '+(e instanceof Error?e.message:'İnceleme yapılamadı.'));}
  finally{setBusy('');}
 }
 const needed=reviews.flatMap(r=>r.suggestions.filter(s=>!s.assigned).map(s=>({review:r,suggestion:s})));
 return <details className="card" style={{marginTop:12}}>
  <summary><strong>Ölçüte Özel Telafi ve Koç Aksiyonları</strong> · {needed.length} atanabilir beceri</summary>
  <p className="muted">KEKS, yalnız koçun 0 veya 1 puan verdiği ölçütten somut kısa çalışma önerir. Öneri otomatik atanmaz; hangi görevin gerekli olduğuna koç karar verir.</p>
  {remediationSummary&&remediationSummary.accepted>0&&<div className="notice">
    <strong>Telafi sonrası bağımsız kanıt izlemesi:</strong> {remediationSummary.accepted} koç tarafından kabul edilen görev,
    {' '}{remediationSummary.independentlyReassessed} telafi sonrasında bağımsız rubrikle yeniden ölçülen ölçüt,
    {' '}{remediationSummary.missingFollowUp} henüz uygun yeniden ölçümü olmayan görev.
    <p className="muted">Ölçüm puanı, telafinin neden-sonuç etkisini veya kalıcı öğrenmeyi kanıtlamaz.</p>
  </div>}
  {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')}>{msg}</div>}
  <div className="stack">
   {needed.slice(0,15).map(({review,suggestion})=>{
    const key=review.id+'|'+suggestion.criterionId;
    return <article className="card" key={key}>
     <strong>{review.grade}. sınıf {review.subject} · {review.phase==='TRANSFER'?'İkinci değerlendirme':'İlk değerlendirme'}</strong>
     <p className="muted">{review.title} · Ölçüt puanı {suggestion.score}/2</p>
     <p><strong>Eksik beceri:</strong> {suggestion.criterionLabel}</p>
     <p><strong>Önerilen çalışma ({suggestion.minutes} dk):</strong> {suggestion.task}</p>
     <p><strong>Öğrencinin sunacağı kanıt:</strong> {suggestion.expectedEvidence}</p>
     <label className="field"><span>Koçun kişisel müdahale notu (en az 20 karakter)</span>
      <textarea rows={2} minLength={20} maxLength={1000}
       value={notes[key]||''} onChange={e=>setNotes(prev=>({...prev,[key]:e.target.value}))}
       placeholder="Öğrenciye bu çalışmayı neden ve nasıl uygulayacağını açıkla."/>
     </label>
     <button type="button" className="btn primary"
      disabled={busy===key||(notes[key]||'').trim().length<20}
      onClick={()=>void assign(review,suggestion)}>
      {busy===key?'Atanıyor…':'Bu Telafi Görevini Öğrenciye Ata'}
     </button>
    </article>;
   })}
  </div>
  {assignments.length>0&&<details style={{marginTop:10}}>
   <summary>Atanan telafi çalışmaları ({assignments.length})</summary>
   <div className="stack">
    {assignments.slice(0,30).map(a=><div className="notice" key={a.id}>
     <strong>{a.status==='VERIFIED'?'Koç kanıtı kabul etti':
       a.status==='SUBMITTED_FOR_REVIEW'?'Koç incelemesi bekliyor':
       a.status==='REVISION_REQUIRED'?'Öğrenciden yeniden çalışma istendi':
       a.status==='COACH_DISCUSSION_REQUIRED'?'Koç görüşmesi gerekiyor':
       a.status==='DONE'?'Eski tamamlandı bildirimi (koç doğrulaması yok)':
       'Öğrenci çalışması bekleniyor'}</strong> · {a.criterionLabel}
     <p>{a.assignment}</p>
     <p className="muted">Koç notu: {a.coachNote}</p>
     {a.reflection&&<p><strong>Öğrenci kanıtı:</strong> {a.reflection}</p>}
     {a.review&&<p><strong>Son koç kararı:</strong> {a.review.decision==='ACCEPT'?'Kabul':'Yeniden çalışma'} · {a.review.feedback}</p>}
     {a.status==='VERIFIED'&&a.impact&&<div className="notice">
       <strong>Bağımsız yeniden ölçüm kontrolü:</strong> {a.impact.statement}
       {a.impact.status==='OBSERVED_AFTER_ACTION'&&<p>
         İlk ölçüt: {a.impact.originalScore}/2 → bağımsız ölçüt: {a.impact.independentScore}/2
         {' '}({a.impact.change!>0?'+':''}{a.impact.change} puan)
       </p>}
       <small className="muted">{a.impact.limitations}</small>
     </div>}
     {a.status==='SUBMITTED_FOR_REVIEW'&&<>
       <p className="muted"><strong>Deneme:</strong> {a.attemptCount||1}/3. Açıklamayı yalnız somut kanıta göre değerlendirin.</p>
       <label className="field"><span>Öğrenci kanıtına yönelik gerekçeli inceleme (en az 30 karakter)</span>
         <textarea rows={3} minLength={30} maxLength={1800}
           value={reviewNotes[a.id]||''}
           onChange={e=>setReviewNotes(prev=>({...prev,[a.id]:e.target.value}))}
           placeholder="Kanıtta hangi açıklama yeterli veya eksik? Öğrenci sonraki çalışmada ne yapmalı?"/>
       </label>
       <div className="row" style={{gap:8,flexWrap:'wrap'}}>
        <button className="btn primary" type="button"
          disabled={busy===a.id||(reviewNotes[a.id]||'').trim().length<30}
          onClick={()=>void review(a,'ACCEPT')}>
          {busy===a.id?'Kaydediliyor…':'Kanıtı Kabul Et'}
        </button>
        <button className="btn" type="button"
          disabled={busy===a.id||(reviewNotes[a.id]||'').trim().length<30}
          onClick={()=>void review(a,'REVISE')}>
          {Number(a.attemptCount||1)>=3?'Koç Görüşmesine Yönlendir':'Yeniden Çalışma İste'}
        </button>
       </div>
     </>}
    </div>)}
   </div>
  </details>}
  <small className="muted">İlerleme ölçüsü öğrencinin kanıtı ve bağımsız yeniden değerlendirmeyle oluşur. Bu görev ve tamamlanma kaydı otomatik bilgi hâkimiyetini yükseltmez.</small>
 </details>;
}
