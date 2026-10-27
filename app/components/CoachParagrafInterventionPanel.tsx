'use client';

import {FormEvent,useEffect,useState} from 'react';

type Topic={topic:string;wrong:number;blank:number};
type Impact={
 id:string;topic:string;title:string;description:string|null;status:string;
 assignedAt:string;windowEndsAt:string;observationStatus:string;
 baseline:{questions:number;correct:number;accuracy:number|null;distinctDays:number};
 followup:{questions:number;correct:number;accuracy:number|null;distinctDays:number};
 changePp:number|null;overlappingInterventions:boolean;
};
type Payload={actions:Impact[];caveat:string;interventionChoices:Record<string,{label:string;task:string}>};
const STATUSES:Record<string,string>={
 OBSERVABLE:'Yeterli gözlemsel veri',
 INSUFFICIENT_BASELINE:'İlk durum için veri yetersiz',
 WAITING_FOR_FOLLOWUP:'İlk 24 saat bekleniyor',
 INSUFFICIENT_FOLLOWUP:'Sonraki günlerden yeni sorular bekleniyor',
 OVERLAPPING_INTERVENTIONS:'Aynı beceride birden fazla müdahale var',
 CANCELED:'İptal edilen müdahale'
};
export function CoachParagrafInterventionPanel({studentId,topics}:{
 studentId:string;topics:Topic[]
}){
 const [data,setData]=useState<Payload|null>(null);
 const [msg,setMsg]=useState('');
 const [busy,setBusy]=useState(false);
 const [topic,setTopic]=useState('');
 const [interventionCode,setInterventionCode]=useState('EVIDENCE_REVIEW');
 const [note,setNote]=useState('');
 async function load(){
  const response=await fetch('/api/coach/students/'+studentId+'/paragraf-interventions',{cache:'no-store'});
  const body=await response.json();
  if(!response.ok)throw new Error(body.error||'Koç müdahaleleri yüklenemedi.');
  setData(body);
 }
 useEffect(()=>{void load().catch(e=>setMsg(e instanceof Error?e.message:'Yükleme hatası.'))},[studentId]);
 useEffect(()=>{if(!topics.some(x=>x.topic===topic))setTopic(topics[0]?.topic||'')},[topics,topic]);
 async function assign(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  if(!topic||busy||note.trim().length<20)return;
  setBusy(true);setMsg('');
  try{
   const response=await fetch('/api/coach/students/'+studentId+'/paragraf-interventions',{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({topic,interventionCode,coachNote:note.trim()})
   });
   const body=await response.json();
   if(!response.ok)throw new Error(body.error||'Müdahale atanamadı.');
   setNote('');await load();setMsg('Koç müdahalesi atandı. Sonraki bağımsız soru sonuçları bekleniyor.');
  }catch(e){setMsg(e instanceof Error?e.message:'Kayıt hatası.');}
  finally{setBusy(false);}
 }
 async function close(id:string,decision:'COMPLETED'|'CANCELED'){
  if(busy)return;setBusy(true);setMsg('');
  try{
   const response=await fetch('/api/coach/students/'+studentId+'/paragraf-interventions',{
    method:'PATCH',headers:{'content-type':'application/json'},
    body:JSON.stringify({actionId:id,decision})
   });
   const body=await response.json();
   if(!response.ok)throw new Error(body.error||'Durum güncellenemedi.');
   await load();setMsg('Koç aksiyonu güncellendi. Öğrenme hâkimiyeti otomatik değiştirilmedi.');
  }catch(e){setMsg(e instanceof Error?e.message:'Güncelleme hatası.');}
  finally{setBusy(false);}
 }
 const choices=Object.entries(data?.interventionChoices||{});
 const date=(s:string)=>new Date(s).toLocaleDateString('tr-TR',{day:'2-digit',month:'short',year:'numeric'});
 return <div className="card">
  <div className="moduleEyebrow">KOÇ MÜDAHALESİ · SOMUT AKSİYON → YENİ METİN → GÖZLEM</div>
  <h2>Bu öğrenci için hangi müdahaleyi uyguladın?</h2>
  <p className="muted">Öğrencinin kayıtlı paragraf yanlış veya boş becerisini seç. Atadığın çalışma mevcut koç görev sistemine yazılır. Sonraki özgün sorular otomatik gözlenir; aynı sorunun tekrar çözümü bu karşılaştırmaya eklenmez.</p>
  {topics.length===0?<p className="muted">Müdahale atanabilmesi için öğrencinin ilk optik yanlış/boş sonuçlarını kendi hesabına aktarması gerekir.</p>:
   <form className="form" onSubmit={e=>void assign(e)}>
    <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))'}}>
     <div className="field">
      <label htmlFor="paragraph-action-topic">Kazanım / soru türü</label>
      <select id="paragraph-action-topic" value={topic} onChange={e=>setTopic(e.target.value)}>
       {topics.map(x=><option key={x.topic} value={x.topic}>{x.topic} · {x.wrong} yanlış, {x.blank} boş</option>)}
      </select>
     </div>
     <div className="field">
      <label htmlFor="paragraph-action-kind">Müdahale yöntemi</label>
      <select id="paragraph-action-kind" value={interventionCode} onChange={e=>setInterventionCode(e.target.value)}>
       {choices.map(([key,choice])=><option key={key} value={key}>{choice.label}</option>)}
      </select>
     </div>
    </div>
    {data?.interventionChoices?.[interventionCode]&&
     <p className="muted"><strong>Öğrenci görevi:</strong> {data.interventionChoices[interventionCode].task}</p>}
    <div className="field">
     <label htmlFor="paragraph-coach-note">Koç gözlem ve uygulama notu (20–700 karakter)</label>
     <textarea id="paragraph-coach-note" value={note} maxLength={700} rows={3}
      onChange={e=>setNote(e.target.value)}
      placeholder="Öğrencinin zorlandığı düşünceyi, çalışılacak yöntemi ve gözlemimi yazıyorum." required/>
    </div>
    <button className="btn primary" type="submit" disabled={busy||!topic||note.trim().length<20||choices.length===0}>
     {busy?'Kaydediliyor…':'14 günlük koç müdahalesini ata'}
    </button>
   </form>}
  {msg&&<p className="notice" role="status">{msg}</p>}
  {data?.actions?.length===0&&<p className="muted">Henüz kayıtlı paragraf müdahalesi bulunmuyor.</p>}
  {!!data?.actions?.length&&<div className="stack">
   {data.actions.map(a=><div className="card" key={a.id} style={{marginTop:10}}>
    <div className="moduleHeaderRow">
     <strong>{a.title} · {a.topic}</strong>
     <span className="pill">{a.status==='ACTIVE'?'Açık':a.status==='COMPLETED'?'Koç tamamladı':a.status==='CANCELED'?'İptal':'Durum: '+a.status}</span>
    </div>
    <p className="muted">{date(a.assignedAt)} tarihinde atandı · Gözlem bitişi {date(a.windowEndsAt)}</p>
    <p style={{whiteSpace:'pre-wrap'}}>{a.description}</p>
    <p><strong>Müdahale öncesi:</strong> {a.baseline.correct}/{a.baseline.questions} doğru
     {a.baseline.accuracy!=null?' · %'+a.baseline.accuracy:' · Veri yok'}.</p>
    <p><strong>En az 24 saat sonra yeni metinler:</strong> {a.followup.correct}/{a.followup.questions} doğru
     {a.followup.accuracy!=null?' · %'+a.followup.accuracy:' · Veri yok'}
     {' · '+a.followup.distinctDays+' farklı gün'}.</p>
    <p><strong>Değerlendirme:</strong> {STATUSES[a.observationStatus]||a.observationStatus}.
     {a.changePp!=null?' Gözlenen fark: '+(a.changePp>0?'+':'')+a.changePp+' yüzde puan.':' Henüz güvenilir değişim hesabı yok.'}</p>
    {a.status==='ACTIVE'&&<div className="row" style={{display:'flex',gap:8,flexWrap:'wrap'}}>
     <button type="button" className="btn" onClick={()=>void close(a.id,'COMPLETED')} disabled={busy}>
      Koç aksiyonunu tamamla
     </button>
     <button type="button" className="btn" onClick={()=>void close(a.id,'CANCELED')} disabled={busy}>
      Müdahaleyi iptal et
     </button>
    </div>}
   </div>)}
  </div>}
  <p className="muted" style={{marginTop:12}}>{data?.caveat||'Gözlemsel değişim nedensellik veya kalıcı konu hâkimiyeti kanıtı değildir.'}</p>
 </div>;
}
