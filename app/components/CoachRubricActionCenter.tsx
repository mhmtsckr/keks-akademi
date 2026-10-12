'use client';
import {useEffect,useState} from 'react';

type Suggestion={criterionId:string;criterionLabel:string;score:number;outOf:number;task:string;expectedEvidence:string;minutes:number;assigned:boolean};
type Review={id:string;taskId:string;grade:number;subject:string;title:string;phase:string;reviewedAt:string;suggestions:Suggestion[]};
type Assignment={id:string;reviewSubmissionId:string;criterionId:string;status:string;taskId:string;
 criterionLabel:string;assignment:string;expectedEvidence:string;minutes:number;coachNote:string;
 reflection:string|null;assignedAt:string;completedAt:string|null};

export function CoachRubricActionCenter({studentId,reviewVersion}:{studentId:string;reviewVersion:string}){
 const [reviews,setReviews]=useState<Review[]>([]);
 const [assignments,setAssignments]=useState<Assignment[]>([]);
 const [notes,setNotes]=useState<Record<string,string>>({});
 const [busy,setBusy]=useState('');
 const [msg,setMsg]=useState('');
 async function load(){
  try{
   const r=await fetch('/api/coach/students/'+studentId+'/performance-actions',{cache:'no-store'});
   const j=await r.json();
   if(!r.ok)throw new Error(j.error||'Telafi önerileri alınamadı.');
   setReviews(j.reviews||[]);setAssignments(j.assignments||[]);
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
 const needed=reviews.flatMap(r=>r.suggestions.filter(s=>!s.assigned).map(s=>({review:r,suggestion:s})));
 return <details className="card" style={{marginTop:12}}>
  <summary><strong>Ölçüte Özel Telafi ve Koç Aksiyonları</strong> · {needed.length} atanabilir beceri</summary>
  <p className="muted">KEKS, yalnız koçun 0 veya 1 puan verdiği ölçütten somut kısa çalışma önerir. Öneri otomatik atanmaz; hangi görevin gerekli olduğuna koç karar verir.</p>
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
     <strong>{a.status==='DONE'?'Öğrenci tamamladı':'Öğrenci çalışması bekleniyor'}</strong> · {a.criterionLabel}
     <p>{a.assignment}</p>
     <p className="muted">Koç notu: {a.coachNote}</p>
     {a.reflection&&<p><strong>Öğrenci kanıtı:</strong> {a.reflection}</p>}
    </div>)}
   </div>
  </details>}
  <small className="muted">İlerleme ölçüsü öğrencinin kanıtı ve bağımsız yeniden değerlendirmeyle oluşur. Bu görev ve tamamlanma kaydı otomatik bilgi hâkimiyetini yükseltmez.</small>
 </details>;
}
