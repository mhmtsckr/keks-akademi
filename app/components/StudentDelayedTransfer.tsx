'use client';
import {FormEvent,useEffect,useState} from 'react';

type Variant={id:string;title:string;instruction:string;evidencePrompt:string;
 steps:string[];safety:string;criteria:{id:string;label:string}[]};
type TransferRow={baselineTaskId:string;title:string;subject:string;grade:number;
 outcomeCode:string;status:'AWAITING_BASELINE'|'LOCKED'|'AVAILABLE'|'WAITING_FOR_COACH'|'REVIEWED';
 dueAt:string|null;assignment:Variant|null};
type Comparison={submissionId:string;taskId:string;
 comparison?:{baselineTotal:number;transferTotal:number;max:number;delta:number;
  interpretation:string;disclaimer:string;criteria:{id:string;before:number;after:number;delta:number}[]}|null;
 feedback:string|null};
const format=(d:string)=>new Date(d).toLocaleDateString('tr-TR',{year:'numeric',month:'long',day:'numeric'});

export function StudentDelayedTransfer({grade}:{grade:number|null|undefined}){
 const [rows,setRows]=useState<TransferRow[]>([]);
 const [comparisons,setComparisons]=useState<Comparison[]>([]);
 const [opened,setOpened]=useState<string|null>(null);
 const [busy,setBusy]=useState<string|null>(null);
 const [msg,setMsg]=useState('');
 async function load(g=grade){
  if(!g){setRows([]);setComparisons([]);return;}
  const params=new URLSearchParams({grade:String(g)});
  const r=await fetch('/api/student/performance-transfers?'+params,{cache:'no-store'});
  const j=await r.json();
  if(!r.ok){setMsg(j.error||'Gecikmeli görevler alınamadı.');return;}
  setRows(j.transfers||[]);setComparisons(j.comparisons||[]);
 }
 useEffect(()=>{void load();},[grade]);
 async function submit(e:FormEvent<HTMLFormElement>,row:TransferRow){
  e.preventDefault();setBusy(row.baselineTaskId);setMsg('');
  const fd=new FormData(e.currentTarget);
  try{
   const r=await fetch('/api/student/performance-transfers',{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({
     baselineTaskId:row.baselineTaskId,grade:row.grade,
     response:String(fd.get('response')||'').trim(),
     observations:String(fd.get('observations')||'').trim(),
     confirmedIndependentWork:fd.get('confirmedIndependentWork')==='on'
    })
   });
   const j=await r.json();
   if(!r.ok)throw new Error(j.error||'Bağımsız görev kaydedilemedi.');
   setMsg(j.message);setOpened(null);await load();
  }catch(err){setMsg('Hata: '+(err instanceof Error?err.message:'Gönderim başarısız.'))}
  finally{setBusy(null);}
 }
 if(!grade)return null;
 return <div className="card" style={{marginTop:12}}>
  <div className="moduleHeaderRow">
   <div><div className="moduleEyebrow">KEKS · 7 GÜN SONRA BAĞIMSIZ YENİDEN ÖLÇME</div>
    <h2>Öğrendiğimi farklı durumda uygulayabiliyor muyum?</h2>
    <p className="muted">İlk rubriğin koç tarafından puanlandıktan yedi gün sonra yeni bağlam açılır. Önceki cevabı kopyalamak yerine yeni durum için bağımsız kanıt sunmalısın.</p>
   </div>
   <span className="pill">{rows.filter(x=>x.status==='AVAILABLE').length} hazır görev</span>
  </div>
  {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')}>{msg}</div>}
  {rows.length===0?<p className="muted">Bu sınıfa atanmış gecikmeli performans görevi henüz yok.</p>:null}
  <div className="stack">
   {rows.map(row=><div key={row.baselineTaskId} className="card" style={{marginBottom:10}}>
    <strong>{row.grade}. sınıf · {row.subject} · {row.title}</strong>
    <p className="muted">Resmî MEB çıktı kodu: {row.outcomeCode}</p>
    {row.status==='AWAITING_BASELINE'&&<p className="muted">Önce ilk performans görevini tamamlaman ve koçunun dört ölçütü değerlendirmesi gerekiyor.</p>}
    {row.status==='LOCKED'&&row.dueAt&&<p className="muted">İkinci ölçümün açılacağı en erken gün: <strong>{format(row.dueAt)}</strong></p>}
    {row.status==='WAITING_FOR_COACH'&&<p className="muted">Bağımsız yanıtın kaydedildi; koçun ikinci rubriği değerlendiriyor.</p>}
    {row.status==='AVAILABLE'&&row.assignment&&<>
      <div className="notice"><strong>Yeni bağlam: {row.assignment.title}</strong><p>{row.assignment.instruction}</p></div>
      <div className="notice"><strong>Güvenlik:</strong> {row.assignment.safety}</div>
      <button type="button" className="btn" onClick={()=>setOpened(opened===row.baselineTaskId?null:row.baselineTaskId)}>
       {opened===row.baselineTaskId?'Formu Kapat':'Bağımsız Göreve Başla'}
      </button>
      {opened===row.baselineTaskId&&<form className="stack" style={{marginTop:10}} onSubmit={e=>void submit(e,row)}>
       <ol>{row.assignment.steps.map((step,i)=><li key={i}>{step}</li>)}</ol>
       <details><summary>Dört değerlendirme ölçütü</summary>
        <ul>{row.assignment.criteria.map(c=><li key={c.id}>{c.label}</li>)}</ul>
       </details>
       <label className="field"><span>Yeni bağlama ilişkin bağımsız gerekçeli çözümün</span>
        <textarea required name="response" minLength={50} maxLength={6000} rows={6} placeholder="Bu bağlam için kendi çözüm adımlarını yaz."/>
       </label>
       <label className="field"><span>Kanıt, gözlem planı veya model açıklaması</span>
        <textarea required name="observations" minLength={15} maxLength={2000} rows={4} placeholder={row.assignment.evidencePrompt}/>
       </label>
       <label className="row" style={{alignItems:'center'}}>
        <input type="checkbox" required name="confirmedIndependentWork"/> Bu yanıtın önceki cevabı kopyalamadan kendi bağımsız çalışmam olduğunu onaylıyorum.
       </label>
       <button className="btn primary" disabled={busy===row.baselineTaskId}>
        {busy===row.baselineTaskId?'Gönderiliyor…':'Bağımsız Yanıtımı Koça Gönder'}
       </button>
      </form>}
    </>}
    {row.status==='REVIEWED'&&(()=>{
     const item=comparisons.find(c=>c.taskId===row.baselineTaskId);
     const c=item?.comparison;
     return <div className="notice">
      <strong>Gecikmeli görev koç tarafından değerlendirildi.</strong>
      {c&&<><p>İlk: {c.baselineTotal}/{c.max} · Yeni bağlam: {c.transferTotal}/{c.max} · Değişim: {c.delta>0?'+':''}{c.delta} puan</p>
       <p>{c.interpretation}. {c.disclaimer}</p>
       <ul>{c.criteria.map(k=><li key={k.id}>{k.id}: {k.before}/2 → {k.after}/2</li>)}</ul></>}
      {item?.feedback&&<p><strong>Koç geribildirimi:</strong> {item.feedback}</p>}
     </div>
    })()}
   </div>)}
  </div>
  <small className="muted">Bu karşılaştırma tek başına kalıcı öğrenme veya psikometrik eşdeğerlik kanıtı değildir; tekrar aralıkları değiştirilmez.</small>
 </div>;
}
