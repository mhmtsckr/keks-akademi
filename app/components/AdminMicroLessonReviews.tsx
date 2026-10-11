'use client';

import {useEffect,useState} from 'react';

type Lesson={
  id:string;version:number;subject:string;title:string;skill:string;
  explanation:string;misconception:string;
  worked:{prompt:string;steps:string[];answer:string};
  exercises:{prompt:string;options?:Record<string,string>;answer:string;explanation:string}[];
  publication:{status:'APPROVED'|'PILOT';reviewedAt:string|null};
  contentDigest:string;
  sourceUrl?:string;
};

export function AdminMicroLessonReviews(){
 const [lessons,setLessons]=useState<Lesson[]>([]);
 const [note,setNote]=useState<Record<string,string>>({});
 const [checked,setChecked]=useState<Record<string,boolean>>({});
 const [busy,setBusy]=useState('');
 const [message,setMessage]=useState('');
 const [filter,setFilter]=useState<'ALL'|'PILOT'|'APPROVED'>('PILOT');
 async function load(){
  try{
   const r=await fetch('/api/admin/micro-lessons',{cache:'no-store'});
   const j=await r.json();
   if(!r.ok)throw Error(j.error||'İçerik listesi alınamadı.');
   setLessons(j.lessons||[]);
  }catch(e){setMessage('Hata: '+(e instanceof Error?e.message:'Mikro dersler yüklenemedi.'));}
 }
 useEffect(()=>{void load()},[]);
 async function review(lesson:Lesson,decision:'APPROVE'|'REVOKE'){
   if(!checked[lesson.id])return setMessage('İçerik kontrol kutusunu işaretlemelisiniz.');
   const text=String(note[lesson.id]||'').trim();
   if(text.length<12)return setMessage('Gerekçeli inceleme notu en az 12 karakter olmalıdır.');
   setBusy(lesson.id);setMessage('');
   try{
    const r=await fetch('/api/admin/micro-lessons',{
     method:'PATCH',headers:{'content-type':'application/json'},
     body:JSON.stringify({id:lesson.id,version:lesson.version,decision,note:text,confirmedReviewed:true})
    });
    const j=await r.json();
    if(!r.ok)throw Error(j.error||'İnceleme kaydedilemedi.');
    setMessage(j.message||'İçerik durumu güncellendi.');
    setChecked(x=>({...x,[lesson.id]:false}));
    setNote(x=>({...x,[lesson.id]:''}));
    await load();
   }catch(e){setMessage('Hata: '+(e instanceof Error?e.message:'Bağlantı hatası'));}
   finally{setBusy('');}
 }
 const visible=lessons.filter(x=>filter==='ALL'||x.publication.status===filter);
 return <div className="card" style={{marginBottom:16}}>
  <div className="moduleHeaderRow">
   <div>
    <div className="moduleEyebrow">KEKS MİKRO DERS · İÇERİK KALİTESİ</div>
    <h3>Çözümlü Örnek Kataloğu Onay Merkezi</h3>
    <p className="muted">Her dersin bilgi doğruluğunu, seçeneklerini, cevap anahtarını ve açıklamasını inceleyin. Onay, içerik sürümüne ve değişmez özete bağlıdır; içerik değiştirilirse otomatik olarak pilota döner.</p>
   </div>
   <span className="pill">{lessons.filter(x=>x.publication.status==='APPROVED').length}/{lessons.length} onaylı</span>
  </div>
  <div className="notice">Bu ekrandaki işlem <strong>yönetici içerik onayıdır</strong>. Bağımsız alan uzmanı/öğretmen tarafından onaylandığı anlamına gelmez. Alan uzmanı kontrolü yapılmadıysa uzman onayı iddiasında bulunmayın.</div>
  <div className="row" style={{marginTop:12,flexWrap:'wrap'}}>
   <label htmlFor="micro-lesson-filter">Filtre:</label>
   <select id="micro-lesson-filter" value={filter} onChange={e=>setFilter(e.target.value as typeof filter)}>
    <option value="PILOT">Onay bekleyenler</option><option value="APPROVED">Onaylılar</option><option value="ALL">Tümü</option>
   </select>
   <button type="button" className="btn" onClick={()=>void load()}>Yenile</button>
  </div>
  {message&&<p className={'notice '+(message.startsWith('Hata:')?'error':'')} role="status">{message}</p>}
  <div className="stack" style={{marginTop:14}}>
   {visible.length===0?<p className="muted">Bu filtrede mikro ders bulunmuyor.</p>:visible.map(x=>
    <details className="card" key={x.id} style={{margin:0}}>
     <summary><strong>{x.subject} · {x.title}</strong> <span className="pill">{x.publication.status==='APPROVED'?'İçerik onaylı':'Pilot / bekliyor'}</span></summary>
     <p><strong>Beceri:</strong> {x.skill}</p>
     <p><strong>Açıklama:</strong> {x.explanation}</p>
     <p><strong>Kavram yanılgısı:</strong> {x.misconception}</p>
     <p><strong>Çözümlü örnek:</strong> {x.worked.prompt}</p>
     <ol>{x.worked.steps.map((step,i)=><li key={i}>{step}</li>)}</ol>
     <p><strong>Örnek cevabı:</strong> {x.worked.answer}</p>
     {x.sourceUrl&&<p><a href={x.sourceUrl} target="_blank" rel="noopener noreferrer">İlgili kaynak sayfası</a></p>}
     <strong>Alıştırmalar ve cevap anahtarı ({x.exercises.length})</strong>
     <ol>{x.exercises.map((q,i)=><li key={i}>
       <p>{q.prompt}</p>
       {q.options&&<p className="muted">{Object.entries(q.options).map(([key,val])=>key+') '+val).join(' · ')}</p>}
       <p><strong>Beklenen:</strong> {q.answer} · {q.explanation}</p>
      </li>)}</ol>
     <small className="muted">Sürüm {x.version} · SHA-256: {x.contentDigest.slice(0,16)}…</small>
     <div className="field" style={{marginTop:12}}>
      <label htmlFor={'micro-note-'+x.id}>İnceleme notu / gerekçe</label>
      <textarea id={'micro-note-'+x.id} rows={2} value={note[x.id]||''}
       onChange={e=>setNote(v=>({...v,[x.id]:e.target.value}))}
       placeholder="Bilgi, kazanım, cevap ve açıklamalar kontrol edildi; gözlemler..." maxLength={1200}/>
     </div>
     <label style={{display:'flex',gap:9,marginBottom:12}}>
      <input type="checkbox" checked={Boolean(checked[x.id])} onChange={e=>setChecked(v=>({...v,[x.id]:e.target.checked}))}/>
      <span>Bu içerik sürümünü ve tüm cevap anahtarlarını gerçekten inceledim.</span>
     </label>
     <div className="row">
      {x.publication.status!=='APPROVED'
       ?<button className="btn primary" type="button" disabled={busy===x.id} onClick={()=>void review(x,'APPROVE')}>İçeriği Onayla</button>
       :<button className="btn danger" type="button" disabled={busy===x.id} onClick={()=>void review(x,'REVOKE')}>Onayı Geri Al</button>}
     </div>
    </details>)}
  </div>
 </div>;
}
