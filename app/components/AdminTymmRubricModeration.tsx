'use client';
import {FormEvent,useEffect,useState} from 'react';

type Criterion={id:string;label:string;levels:Record<string,string>};
type Pending={id:string;submittedAt:string;phase:'BASELINE'|'TRANSFER';
  task:{id:string;grade:number;subject:string;title:string;outcomeCode:string;sourceUrl:string;
    criteria:Criterion[]};
  instruction:string;response:string;observations:string};
type Comparison={firstTotal:number;secondTotal:number;max:number;absoluteTotalGap:number;
  criterionExactMatches:number;decision:string;policy:string;differences:{id:string;first:number;second:number;delta:number}[]};
type Result={id:string;at:string;decision:string;gap:number;criterionExactMatches:number|null};

export function AdminTymmRubricModeration(){
 const [queue,setQueue]=useState<Pending[]>([]);
 const [history,setHistory]=useState<Result[]>([]);
 const [selected,setSelected]=useState<string|null>(null);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [lastResult,setLastResult]=useState<Comparison|null>(null);
 const [partial,setPartial]=useState(false);
 async function load(){
  try{
   const r=await fetch('/api/admin/tymm-rubric-moderation',{cache:'no-store'});
   const j=await r.json();
   if(!r.ok)throw new Error(j.error||'Rubrik örnekleri yüklenemedi.');
   setQueue(j.pending||[]);setHistory(j.history||[]);setPartial(Boolean(j.partial));
  }catch(e){setMessage('Hata: '+(e instanceof Error?e.message:'Rubrik örnekleri yüklenemedi.'));}
 }
 useEffect(()=>{void load();},[]);
 const selectedItem=queue.find(x=>x.id===selected);
 async function submit(e:FormEvent<HTMLFormElement>,entry:Pending){
  e.preventDefault();setBusy(true);setLastResult(null);setMessage('');
  const data=new FormData(e.currentTarget);
  const scores:Record<string,number>={},criterionEvidence:Record<string,string>={};
  for(const c of entry.task.criteria){
   const raw=String(data.get('score-'+c.id)||'');
   if(!['0','1','2'].includes(raw)){setMessage('Bütün ölçütleri puanlayın.');setBusy(false);return;}
   scores[c.id]=Number(raw);
   criterionEvidence[c.id]=String(data.get('evidence-'+c.id)||'').trim();
  }
  try{
   const r=await fetch('/api/admin/tymm-rubric-moderation',{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({
     submissionId:entry.id,scores,criterionEvidence,
     note:String(data.get('note')||'').trim()
    })
   });
   const j=await r.json();
   if(!r.ok)throw new Error(j.error||'İkinci değerlendirme kaydedilemedi.');
   setLastResult(j.comparison);setMessage(j.message||'Moderasyon kaydedildi.');
   setSelected(null);await load();
  }catch(err){setMessage('Hata: '+(err instanceof Error?err.message:'İnceleme kaydedilemedi.'));}
  finally{setBusy(false);}
 }
 return <div className="card" style={{marginBottom:16}}>
  <div className="moduleHeaderRow">
   <div>
    <div className="moduleEyebrow">TYMM · İKİNCİ DEĞERLENDİRİCİ KALİBRASYONU</div>
    <h3>Bağımsız rubrik tutarlılığı denetimi</h3>
    <p className="muted">İlk koç puanını görmeden aynı öğrenci yanıtını dört ölçütle yeniden inceleyin. İki puanlama arasındaki önemli farklar akademik moderasyon için işaretlenir; öğrencinin ilk puanı değiştirilmez.</p>
   </div>
   <span className="pill">{queue.length} örnek</span>
  </div>
  <div className="notice">Bu alan yalnız yetkili yöneticilere açıktır. Yöneticinin yaptığı ikinci inceleme <strong>bağımsız branş öğretmeni onayı</strong> veya MEB akreditasyonu sayılmaz. İlk puanlamayı yapan aynı kişi bu görevi ikinci kez değerlendiremez.</div>
  {partial&&<p className="muted">Son 160 incelenmiş teslimden örnek listeleniyor; toplam geçmişin eksiksiz tarandığı iddia edilmez.</p>}
  {message&&<div className={'notice '+(message.startsWith('Hata:')?'error':'')}>{message}</div>}
  {lastResult&&<div className="notice">
   <strong>İki değerlendirici sonucu:</strong> İlk {lastResult.firstTotal}/8 · İkinci {lastResult.secondTotal}/8 · Mutlak fark {lastResult.absoluteTotalGap} puan
   <p><strong>{lastResult.decision==='ESCALATE'?'Akademik takip gerekli':lastResult.decision==='AGREEMENT'?'Tam ölçüt uyumu':'Küçük puanlama farkı'}</strong> · {lastResult.criterionExactMatches}/4 ölçütte aynı puan.</p>
   <p className="muted">{lastResult.policy}</p>
  </div>}
  {queue.length===0?<p className="muted">Şu anda ikinci incelemeye uygun, ilk koçtan farklı değerlendiricisi bulunan teslim listelenmiyor.</p>:<>
   <label className="field" style={{maxWidth:650}}>
    <span>İlk puanı gizli tutulan öğrenci çalışmasını seç</span>
    <select value={selected||''} onChange={e=>{setSelected(e.target.value||null);setLastResult(null);setMessage('')}}>
     <option value="">Görev seçin</option>
     {queue.map(entry=><option key={entry.id} value={entry.id}>
      {entry.task.grade}. sınıf · {entry.task.subject} · {entry.task.title} · {new Date(entry.submittedAt).toLocaleDateString('tr-TR')}
     </option>)}
    </select>
   </label>
   {selectedItem&&<div className="card">
    <h4>{selectedItem.task.title}</h4>
    <p className="muted">{selectedItem.phase==='TRANSFER'?'Gecikmeli transfer':'İlk performans'} · {selectedItem.task.outcomeCode} ·
     {' '}<a href={selectedItem.task.sourceUrl} target="_blank" rel="noopener noreferrer">Resmî MEB kaynak sayfası</a>
    </p>
    <p><strong>Görev:</strong> {selectedItem.instruction}</p>
    <div className="notice"><strong>Öğrencinin yanıtı</strong><p style={{whiteSpace:'pre-wrap'}}>{selectedItem.response}</p></div>
    <div className="notice"><strong>Model/kanıt/gözlem açıklaması</strong><p style={{whiteSpace:'pre-wrap'}}>{selectedItem.observations}</p></div>
    <form className="stack" onSubmit={e=>void submit(e,selectedItem)}>
     {selectedItem.task.criteria.map(c=><div key={c.id} className="card">
      <strong>{c.label}</strong>
      <label className="field"><span>Bağımsız puan</span>
       <select name={'score-'+c.id} required defaultValue="">
        <option value="" disabled>0–2 arasında seç</option>
        {[0,1,2].map(n=><option key={n} value={n}>{n}/2 — {c.levels[String(n)]}</option>)}
       </select>
      </label>
      <label className="field"><span>Öğrenci yanıtından somut kanıt (her ölçüt için zorunlu)</span>
       <textarea name={'evidence-'+c.id} rows={2} minLength={20} maxLength={500} required placeholder="Puanı haklı kılan somut ifadeyi veya eksikliği yazın."/>
      </label>
     </div>)}
     <label className="field"><span>Bağımsız inceleme notu (en az 40 karakter)</span>
      <textarea name="note" rows={3} minLength={40} maxLength={1800} required placeholder="Rubriği hangi kanıtlara göre uyguladığınızı açıklayın."/>
     </label>
     <button className="btn primary" disabled={busy}>{busy?'Kaydediliyor…':'Bağımsız Puanlamayı Kaydet ve Karşılaştır'}</button>
    </form>
   </div>}
  </>}
  {history.length>0&&<details className="card" style={{marginTop:14}}>
   <summary><strong>Son kalite moderasyonları ({history.length})</strong></summary>
   <div className="stack">
    {history.map(item=><div className="notice" key={item.id}>
     {new Date(item.at).toLocaleDateString('tr-TR')} · {item.decision==='ESCALATE'?'Akademik takip gerekli':item.decision==='AGREEMENT'?'Tam ölçüt uyumu':'Küçük fark'}
     {' '}· Toplam puan farkı {item.gap}/8 · {item.criterionExactMatches??'—'}/4 aynı ölçüt
    </div>)}
   </div>
  </details>}
 </div>;
}
