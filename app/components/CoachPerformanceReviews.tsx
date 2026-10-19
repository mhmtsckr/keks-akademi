'use client';
import {FormEvent,useEffect,useState} from 'react';
import {CoachRubricActionCenter} from './CoachRubricActionCenter';

type Criteria={id:string;label:string;levels:Record<string,string>};
type Submission={
 id:string;submittedAt:string;status:string;phase?:'BASELINE'|'TRANSFER';
 task:{id:string;title:string;grade:number;subject:string;outcomeCode:string;
 sourceUrl:string;instruction:string;criteria:Criteria[];maxScore:number};
 response:string;observations:string;
 review?:{total?:number;max?:number;feedback?:string;reviewedAt?:string;nextAction?:string;criterionScores?:{id:string;score:number}[];
  criterionEvidence?:Record<string,string>;
  comparison?:{baselineTotal:number;transferTotal:number;max:number;delta:number;
   interpretation:string;disclaimer:string;criteria:{id:string;before:number;after:number;delta:number}[]}|null}|null
};
export function CoachPerformanceReviews({studentId}:{studentId:string}){
 const [items,setItems]=useState<Submission[]>([]);
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState('');
 const [loaded,setLoaded]=useState(false);
 const [queue,setQueue]=useState<{pendingIds:string[];waitingOver48Hours:number;oldestWaitingHours:number;note:string}|null>(null);

 async function load(){
  try{
   const r=await fetch('/api/coach/students/'+studentId+'/performance-tasks',{cache:'no-store'});
   const j=await r.json();
   if(!r.ok)throw new Error(j.error||'Performans görevleri alınamadı.');
   setItems(j.submissions||[]);setQueue(j.reviewQueue||null);setLoaded(true);
  }catch(e){setMessage('Hata: '+(e instanceof Error?e.message:'Performans görevleri alınamadı.'));setLoaded(true);}
 }
 useEffect(()=>{void load();},[studentId]);

 async function grade(event:FormEvent<HTMLFormElement>,submission:Submission){
  event.preventDefault();setBusy(submission.id);setMessage('');
  const form=new FormData(event.currentTarget);
  const scores:Record<string,number>={};
  const criterionEvidence:Record<string,string>={};
  for(const c of submission.task.criteria){
   const value=String(form.get('rubric-'+c.id)||'');
   if(!['0','1','2'].includes(value)){setBusy('');setMessage('Dört rubrik ölçütünün tamamını puanla.');return;}
   scores[c.id]=Number(value);
   const note=String(form.get('evidence-'+c.id)||'').trim();
   if(note)criterionEvidence[c.id]=note;
   if(scores[c.id]<2&&note.length<20){
    setBusy('');setMessage('0 veya 1 puan verdiğiniz '+c.label+' ölçütü için somut gerekçe yazın (en az 20 karakter).');return;
   }
  }
  try{
   const r=await fetch('/api/coach/students/'+studentId+'/performance-tasks',{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({
     submissionId:submission.id,scores,criterionEvidence,
     feedback:String(form.get('feedback')||'').trim(),
     nextAction:String(form.get('nextAction')||'RETRY_WITH_FEEDBACK')
    })
   });
   const j=await r.json();
   if(!r.ok)throw new Error(j.error||'Değerlendirme kaydedilemedi.');
   setMessage(j.message);await load();
  }catch(e){setMessage('Hata: '+(e instanceof Error?e.message:'Değerlendirme kaydedilemedi.'));}
  finally{setBusy('');}
 }
 const pending=items.filter(x=>x.status==='WAITING_FOR_COACH')
  .sort((a,b)=>{
   const posA=queue?.pendingIds.indexOf(a.id)??-1;
   const posB=queue?.pendingIds.indexOf(b.id)??-1;
   return posA>=0&&posB>=0?posA-posB:new Date(a.submittedAt).getTime()-new Date(b.submittedAt).getTime();
  });
 const reviewed=items.filter(x=>x.status==='REVIEWED');
 return <div className="card">
  <div className="moduleHeaderRow">
   <div><div className="moduleEyebrow">KEKS · ÖĞRETMEN DESTEKLİ BECERİ DEĞERLENDİRMESİ</div>
    <h2>TYMM açık uçlu ve performans görevleri</h2>
    <p className="muted">Öğrencinin yazılı/model/deney planını dört ölçütlü rubrikle değerlendirin. Bu kayıt insan koç puanıdır; otomatik bilgi hâkimiyetini değiştirmez.</p>
   </div>
   <span className="pill">{pending.length} inceleme bekliyor</span>
  </div>
  {queue&&queue.waitingOver48Hours>0&&<div className="notice">
    <strong>İnceleme önceliği:</strong> {queue.waitingOver48Hours} teslim 48 saati geçti;
    en eski bekleyen çalışma yaklaşık {Math.floor(queue.oldestWaitingHours/24)} gündür bekliyor.
    <p className="muted">{queue.note}</p>
   </div>}
  {message&&<div className={'notice '+(message.startsWith('Hata:')?'error':'')}>{message}</div>}
  {!loaded?<p className="muted">Performans çalışmaları yükleniyor…</p>:items.length===0?<p className="muted">Henüz teslim edilmiş performans görevi yok.</p>:null}
  <div className="stack">
   {pending.slice(0,12).map(item=><article className="card" key={item.id}>
    <strong>{item.phase==='TRANSFER'?'7 gün sonra bağımsız ölçüm · ':'İlk görev · '}{item.task.grade}. sınıf · {item.task.subject} · {item.task.title}</strong>
    <p className="muted">MEB çıktısı: {item.task.outcomeCode} · <a target="_blank" rel="noopener noreferrer" href={item.task.sourceUrl}>Resmî kaynak</a> · Gönderim: {new Date(item.submittedAt).toLocaleDateString('tr-TR')}</p>
    <p className="muted"><strong>İnceleme sırası:</strong> En eski teslimden başlanıyor; gönderim {new Date(item.submittedAt).toLocaleDateString('tr-TR')}.</p>
    <p><strong>Görev:</strong> {item.task.instruction}</p>
    {item.phase==='TRANSFER'&&<div className="notice"><strong>Koç değerlendirmesi:</strong> Önce yeni bağımsız yanıtı kendi kanıtlarına göre puanlayın. İlk rubrikle karşılaştırma kaydetme sonrası otomatik gösterilir; bu, otomatik “Kalıcı” öğrenme kararı değildir.</div>}
    <div className="notice"><strong>Öğrencinin yazılı açıklaması:</strong> <p style={{whiteSpace:'pre-wrap'}}>{item.response}</p></div>
    <div className="notice"><strong>Kanıt / model / gözlem planı:</strong> <p style={{whiteSpace:'pre-wrap'}}>{item.observations}</p></div>
    <form className="stack" onSubmit={e=>void grade(e,item)}>
     {item.task.criteria.map(c=><label className="field" key={c.id}>
      <span>{c.label}</span>
      <select name={'rubric-'+c.id} defaultValue="" required>
       <option value="" disabled>Ölçüt puanını seç</option>
       {['0','1','2'].map(k=><option key={k} value={k}>{k}/2 — {c.levels[k]}</option>)}
      </select>
      <span>Ölçüt puanının gözleme dayalı gerekçesi (0/1 için zorunlu, en az 20 karakter)</span>
      <textarea name={'evidence-'+c.id} rows={2} minLength={20} maxLength={500}
       placeholder="Öğrencinin yanıtındaki somut bir ifadeyi veya eksik kanıtı belirtin."/>
     </label>)}
     <label className="field"><span>Gerekçeli ve geliştirici koç geribildirimi (en az 30 karakter)</span>
      <textarea name="feedback" minLength={30} maxLength={1800} required rows={4} placeholder="Hangi ölçüt iyi? Neler geliştirilmeli? Sonraki görevde öğrenci ne yapmalı?"/>
     </label>
     <label className="field"><span>Önerilen sonraki adım</span>
      <select name="nextAction" defaultValue="RETRY_WITH_FEEDBACK">
       <option value="RETRY_WITH_FEEDBACK">Geri bildirime göre yeniden deneme</option>
       <option value="DIFFERENT_CONTEXT">Farklı bağlamda bağımsız görev</option>
       <option value="DISCUSS_WITH_COACH">Koç görüşmesinde örnek üzerinden tartışma</option>
      </select>
     </label>
     <button className="btn primary" disabled={busy===item.id}>
      {busy===item.id?'Rubrik kaydediliyor…':'Dört Ölçütlü Değerlendirmeyi Kaydet'}
     </button>
    </form>
   </article>)}
  </div>
  <CoachRubricActionCenter studentId={studentId} reviewVersion={reviewed.map(r=>r.id).join('|')}/>
  {reviewed.length>0&&<details className="card" style={{marginTop:12}}>
   <summary><strong>Değerlendirilen görevler ({reviewed.length})</strong></summary>
   <div className="stack">
    {reviewed.slice(0,25).map(item=><div className="notice" key={item.id}>
     <strong>{item.phase==='TRANSFER'?'Bağımsız ikinci görev':'İlk görev'}</strong> · {item.task.grade}. sınıf · {item.task.title} · {item.review?.total}/{item.review?.max} puan
     <p>{item.review?.feedback}</p>
     {item.review?.criterionEvidence&&Object.entries(item.review.criterionEvidence).length>0&&<ul>
      {Object.entries(item.review.criterionEvidence).map(([id,note])=><li key={id}>
       <strong>{item.task.criteria.find(c=>c.id===id)?.label||id}:</strong> {note}
      </li>)}
     </ul>}
     {item.phase==='TRANSFER'&&item.review?.comparison&&<div className="notice">
       <strong>Rubrik karşılaştırması:</strong> İlk {item.review.comparison.baselineTotal}/8 → 7 gün sonra {item.review.comparison.transferTotal}/8
       {' '}({item.review.comparison.delta>0?'+':''}{item.review.comparison.delta} puan)
       <p>{item.review.comparison.interpretation}. {item.review.comparison.disclaimer}</p>
       <ul>{item.review.comparison.criteria.map(c=><li key={c.id}>
         {item.task.criteria.find(k=>k.id===c.id)?.label||c.id}: {c.before}/2 → {c.after}/2
       </li>)}</ul>
     </div>}
     <small className="muted">Değerlendirme, önceki kaydı değiştirmeden korunur. Tek görev kalıcı öğrenme kanıtı değildir.</small>
    </div>)}
   </div>
  </details>}
 </div>;
}
