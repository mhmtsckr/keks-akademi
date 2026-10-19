'use client';

import {FormEvent,useEffect,useState} from 'react';
import {StudentDelayedTransfer} from './StudentDelayedTransfer';
import {StudentRubricActions} from './StudentRubricActions';

type Criterion={id:string;label:string;levels:Record<'0'|'1'|'2',string>};
type Task={id:string;grade:number;subject:string;outcomeCode:string;title:string;
 kind:'OPEN_RESPONSE'|'EXPERIMENT_DESIGN'|'MODEL';version:number;
 instruction:string;steps:string[];evidencePrompt:string;safety:string;
 sourceUrl:string;criteria:Criterion[];contentStatus:'PILOT';sourceEvidence:{outcomeCodeVerified:boolean}};
type Submission={id:string;taskId:string;status:'REVIEWED'|'WAITING_FOR_COACH';submittedAt:string;
 response:string;observations:string;review?:{total?:number;max?:number;feedback?:string;nextAction?:string;criterionEvidence?:Record<string,string>}|null};
const KIND_LABEL:Record<string,string>={OPEN_RESPONSE:'Açık uçlu',EXPERIMENT_DESIGN:'Deney tasarımı',MODEL:'Model kurma'};
const ACTION_LABEL:Record<string,string>={RETRY_WITH_FEEDBACK:'Geri bildirime göre yeniden çalış',
 DIFFERENT_CONTEXT:'Farklı bağlamda yeniden dene',DISCUSS_WITH_COACH:'Koç görüşmesinde ele al'};

export function StudentPerformanceTasks(){
 const [context,setContext]=useState<any>(null);
 const [grade,setGrade]=useState('');
 const [tasks,setTasks]=useState<Task[]>([]);
 const [history,setHistory]=useState<Submission[]>([]);
 const [busy,setBusy]=useState('');
 const [message,setMessage]=useState('');
 const [opened,setOpened]=useState<string|null>(null);

 async function load(nextGrade=grade){
  const qs=new URLSearchParams();
  if(nextGrade)qs.set('grade',nextGrade);
  try{
   const r=await fetch('/api/student/performance-tasks?'+qs.toString(),{cache:'no-store'});
   const data=await r.json();
   if(!r.ok)throw new Error(data.error||'Görevler yüklenemedi.');
   setContext(data.curriculumContext);
   setTasks(data.tasks||[]);
   setHistory(data.history||[]);
  }catch(e){setMessage('Hata: '+(e instanceof Error?e.message:'Görevler yüklenemedi.'));}
 }
 useEffect(()=>{void load('');},[]);

 async function submit(event:FormEvent<HTMLFormElement>,task:Task){
  event.preventDefault();setBusy(task.id);setMessage('');
  const form=event.currentTarget;
  const fd=new FormData(form);
  try{
   const r=await fetch('/api/student/performance-tasks',{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({
     taskId:task.id,grade:context?.grade,
     response:String(fd.get('response')||'').trim(),
     observations:String(fd.get('observations')||'').trim(),
     confirmedOwnWork:fd.get('ownWork')==='on'
    })
   });
   const j=await r.json();
   if(!r.ok)throw new Error(j.error||'Görev kaydedilemedi.');
   setMessage(j.message);form.reset();setOpened(null);await load();
  }catch(e){setMessage('Hata: '+(e instanceof Error?e.message:'Görev kaydedilemedi.'));}
  finally{setBusy('');}
 }

 const grouped=Boolean(context?.canSelectGrade);
 return <div className="card">
  <div className="moduleHeaderRow">
   <div>
    <div className="moduleEyebrow">KEKS · TÜRKİYE YÜZYILI MAARİF MODELİ · PERFORMANS KANITI</div>
    <h2>Açık Uçlu, Deney Tasarımı ve Model Görevleri</h2>
    <p className="muted">Tek doğru şıkkı işaretlemek yerine açıklama ve gözlem planı oluştur. Koçun dört ölçütlü rubrikle inceleyecek. Görev yapmak otomatik “Kalıcı” öğrenme sayılmaz.</p>
   </div>
   <span className="pill">{tasks.length} uygun pilot görev</span>
  </div>
  {grouped&&<label className="field" style={{maxWidth:320}}>
   <span>Gerçek sınıfını seç</span>
   <select value={grade} onChange={e=>{setGrade(e.target.value);setMessage('');void load(e.target.value)}}>
    <option value="">Sınıf seçilmedi</option>
    {(context.availableGrades||[]).map((g:number)=><option key={g} value={g}>{g}. sınıf</option>)}
   </select>
  </label>}
  {message&&<div className={'notice '+(message.startsWith('Hata')?'error':'')}>{message}</div>}
  {context?.framework==='MEB_LEGACY'||context?.framework==='OSYM'
    ?<p className="muted">Bu bölüm 2026–2027 TYMM görevleri içindir. Senin düzeyine uygun önceki MEB veya ÖSYM performans içerikleri ayrı hazırlanacaktır.</p>:null}
  {grouped&&!context?.grade&&<p className="muted">Düzeyin birden fazla sınıfı içerdiği için görevleri görmeden önce gerçek sınıfını seç.</p>}
  <div className="stack">
   {tasks.map(task=><article className="card" key={task.id} style={{marginBottom:10}}>
    <div className="moduleHeaderRow">
     <div><strong>{task.grade}. sınıf · {task.subject}: {task.title}</strong>
       <p className="muted">{KIND_LABEL[task.kind]} · {task.outcomeCode} · <strong>Pilot</strong></p></div>
     <span className="pill">{task.criteria.length*2} puanlık rubrik</span>
    </div>
    <p>{task.instruction}</p>
    <ol>{task.steps.map((step,i)=><li key={i}>{step}</li>)}</ol>
    <div className="notice"><strong>Güvenlik:</strong> {task.safety}</div>
    <details><summary>Değerlendirme ölçütleri (her biri 0–2 puan)</summary>
     <ul>{task.criteria.map(c=><li key={c.id}>{c.label}</li>)}</ul>
     <p className="muted">0: yetersiz/yanlış · 1: kısmen · 2: açık, doğru ve gerekçeli. Koç kararı gereklidir.</p>
    </details>
    <p className="muted">Resmî çıktı: {task.sourceEvidence?.outcomeCodeVerified?'MEB kaynağında kod doğrulandı':'Doğrulama bekliyor'} · <a href={task.sourceUrl} target="_blank" rel="noopener noreferrer">MEB kaynağı</a>. İçerik MEB onaylı değildir.</p>
    <button className="btn" type="button" onClick={()=>setOpened(opened===task.id?null:task.id)}>
     {opened===task.id?'Formu Kapat':'Kendi Yanıtımı Yaz'}
    </button>
    {opened===task.id&&<form onSubmit={e=>void submit(e,task)} className="stack" style={{marginTop:12}}>
     <label className="field"><span>Çözümün, açıklaman ve gerekçelerin</span>
      <textarea name="response" minLength={50} maxLength={6000} required rows={7} placeholder="Kendi sözlerinle, adım adım yaz..."/>
     </label>
     <label className="field"><span>Modelin/gözlem kayıtların/kanıt planın</span>
      <textarea name="observations" minLength={15} maxLength={2000} required rows={4} placeholder={task.evidencePrompt}/>
     </label>
     <label className="row" style={{alignItems:'center',gap:8}}>
      <input type="checkbox" name="ownWork" required/> Bu yanıtın kendi çalışmam olduğunu onaylıyorum.
     </label>
     <button className="btn primary" disabled={busy===task.id}>{busy===task.id?'Gönderiliyor…':'Koç İncelemesine Gönder'}</button>
    </form>}
   </article>)}
  </div>
  <StudentRubricActions/>
  <StudentDelayedTransfer grade={context?.grade}/>
  {history.length>0&&<details className="card" style={{marginTop:10}}>
   <summary><strong>Performans görevlerim ve koç geribildirimi ({history.length})</strong></summary>
   <div className="stack" style={{marginTop:12}}>
    {history.map(h=><div key={h.id} className="notice">
     <strong>{tasks.find(t=>t.id===h.taskId)?.title||'Performans görevi'}</strong> · {new Date(h.submittedAt).toLocaleDateString('tr-TR')} · {h.status==='REVIEWED'?'Koç değerlendirdi':'Koç incelemesi bekliyor'}
     {h.review&&<><p><strong>Rubrik:</strong> {h.review.total}/{h.review.max} · <strong>Geribildirim:</strong> {h.review.feedback||'—'} · {ACTION_LABEL[h.review.nextAction||'']||'Sonraki adım belirtilmedi'}</p>
      {h.review.criterionEvidence&&Object.entries(h.review.criterionEvidence).length>0&&<ul>
       {Object.entries(h.review.criterionEvidence).map(([id,note])=><li key={id}><strong>{tasks.find(t=>t.id===h.taskId)?.criteria.find(c=>c.id===id)?.label||id}:</strong> {note}</li>)}
      </ul>}</>}
    </div>)}
   </div>
  </details>}
 </div>;
}
