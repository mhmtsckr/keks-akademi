'use client';

import {FormEvent,useEffect,useState} from 'react';

const ERROR_REASONS=[
 ['BILGI_EKSIKLIGI','Bilgi eksikliği'],
 ['ISLEM_HATASI','İşlem hatası'],
 ['DIKKAT','Dikkat'],
 ['SORU_KOKU','Soru kökünü yanlış okuma'],
 ['SURE','Süre yönetimi'],
 ['YONTEM_BILMEME','Yöntem bilmeme'],
 ['UNUTMA','Unutma'],
 ['BELIRLENEMEDI','Henüz belirleyemedim']
] as const;
const CHECKS:Record<string,string>={
 BILGI_EKSIKLIGI:'Temel kavramı notlara bakmadan açıkla, ardından farklı soruyla kontrol et.',
 ISLEM_HATASI:'Çözümü adımlara böl; ara işlem, işaret ve birim kontrolü yap.',
 DIKKAT:'Verilenleri ve isteneni işaretle; sonucun tutarlılığını denetle.',
 SORU_KOKU:'Sorunun son cümlesindeki isteneni kendi sözlerinle tekrar yaz.',
 SURE:'Önce süresiz doğru çöz; sonraki soruda süreni ölç.',
 YONTEM_BILMEME:'Seçtiğin yöntemin niçin uygun olduğunu gerekçelendir.',
 UNUTMA:'Kuralı notsuz hatırla ve ileriki tekrar gününde yeniden uygula.',
 BELIRLENEMEDI:'Önce hangi alt beceride zorlandığını belirlemek için koçundan destek iste.'
};
type Question={id:string;subject:string;topic:string;classificationConfidence?:number;review?:{id:string}|null;bankReason?:string};
type Reflection={reason:string;reasonLabel:string;mistakenStep:string;correctedPrinciple:string;nextTimeCheck:string;recordedAt:string;suggestedAction:string};
type Recovery={questionId:string;stage:string;label:string;reflection:Reflection|null;
 evidence:{guided:{correct:boolean;at:string}|null;independentReview:{correct:boolean;at:string}|null; evidenceScope:string};
 masteryStatusUnchanged:boolean;reviewScheduleUnchanged:boolean};
type Snapshot={items:Recovery[];summary:{totalPersonalQuestions:number;withReflection:number;guidedCorrect:number;independentReviewCorrect:number;}};
export function WrongQuestionRecoveryPanel({items,onStartGuided,refreshToken=0}:{
 items:Question[];onStartGuided:(question:Question)=>void;refreshToken?:number
}){
 const [snapshot,setSnapshot]=useState<Snapshot|null>(null);
 const [chosen,setChosen]=useState('');
 const [reason,setReason]=useState('BILGI_EKSIKLIGI');
 const [mistakenStep,setMistakenStep]=useState('');
 const [correctedPrinciple,setCorrectedPrinciple]=useState('');
 const [nextTimeCheck,setNextTimeCheck]=useState('');
 const [saving,setSaving]=useState(false);
 const [message,setMessage]=useState('');
 const [loading,setLoading]=useState(false);

 async function load(){
  setLoading(true);
  try{
   const r=await fetch('/api/student/wrong-questions/reflections',{cache:'no-store'});
   const j=await r.json();
   if(!r.ok)throw new Error(j.error||'Yanlış analizleri alınamadı.');
   setSnapshot(j);
  }catch(e){setMessage('Hata: '+(e instanceof Error?e.message:'Yanlış analizleri alınamadı.'));}
  finally{setLoading(false);}
 }
 useEffect(()=>{void load();},[refreshToken,items.length]);
 useEffect(()=>{
  if(!items.length){setChosen('');return;}
  if(!chosen||!items.some(q=>q.id===chosen))setChosen(items[0].id);
 },[items,chosen]);
 const current=items.find(q=>q.id===chosen)||null;
 const recovery=snapshot?.items.find(x=>x.questionId===chosen)||null;
 useEffect(()=>{
  const r=snapshot?.items.find(x=>x.questionId===chosen)?.reflection;
  setReason(r?.reason||'BILGI_EKSIKLIGI');
  setMistakenStep(r?.mistakenStep||'');
  setCorrectedPrinciple(r?.correctedPrinciple||'');
  setNextTimeCheck(r?.nextTimeCheck||'');
 },[chosen,snapshot]);
 async function save(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  if(!current||saving)return;
  setSaving(true);setMessage('');
  try{
   const r=await fetch('/api/student/wrong-questions/reflections',{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({questionId:current.id,reason,mistakenStep,correctedPrinciple,nextTimeCheck})
   });
   const j=await r.json();
   if(!r.ok)throw new Error(j.error||'Hata analizi kaydedilemedi.');
   setMessage(j.message||'Analiz kaydedildi.');
   await load();
  }catch(e){setMessage('Hata: '+(e instanceof Error?e.message:'Kayıt başarısız.'));}
  finally{setSaving(false);}
 }
 if(!items.length)return null;
 return <div className="card" id="keks-wrong-reflection">
  <div className="moduleHeaderRow">
   <div>
    <div className="moduleEyebrow">MİZA · YANLIŞTAN ÖĞRENME DÖNGÜSÜ</div>
    <h2>Yanlışımı veya boş bırakma nedenimi bul → Düzelt → Yeniden dene</h2>
    <p className="muted">Yanlış veya boş bıraktığın soruda hangi adımda zorlandığını ve sonraki soruda neyi kontrol edeceğini kaydet. Ardından farklı bir örnekte ve gecikmeli tekrarda yeniden ölç.</p>
   </div>
   <span className="pill">{snapshot?.summary.withReflection||0}/{items.length} hata analizi</span>
  </div>
  <label className="field">
   <span>Analiz edeceğin yanlış / boş soru</span>
   <select value={chosen} onChange={e=>{setChosen(e.target.value);setMessage('')}}>
    {items.map(q=><option value={q.id} key={q.id}>{q.subject} · {q.topic} · {q.id.slice(-5)}</option>)}
   </select>
  </label>
  {loading&&<p className="muted">Öğrenme kanıtları güncelleniyor…</p>}
  {message&&<div className={'notice '+(message.startsWith('Hata:')?'error':'')} role="status">{message}</div>}
  {current&&<div className="stack">
   <div className="notice">
    <strong>{recovery?.label||'Hata analizi bekleniyor'}</strong>
    <p className="muted">{current.subject} · {current.topic}
     {current.classificationConfidence!=null&&current.classificationConfidence<0.65
      ?' · Otomatik konu eşleşmesi düşük güvenli; konu adını kontrol et.' :''}
    </p>
    {recovery?.reflection&&<>
      <p><strong>Son kendi değerlendirmen:</strong> {recovery.reflection.reasonLabel} · {new Date(recovery.reflection.recordedAt).toLocaleDateString('tr-TR')}</p>
      <p><strong>Önerilen strateji:</strong> {recovery.reflection.suggestedAction}</p>
    </>}
    <div className="stack" style={{gap:5}}>
     <small>{recovery?.evidence.guided
       ?'Yeni çözümlü örnek: '+(recovery.evidence.guided.correct?'Doğru yanıt':'Yeniden çalışma gerekli')
       :'Yeni çözümlü örnek: henüz sonuç yok'}</small>
     <small>{recovery?.evidence.independentReview
       ?'Bağımsız kişisel soru tekrarı: '+(recovery.evidence.independentReview.correct?'Doğru yanıt':'Tekrar güçlüğü')
       :'Bağımsız kişisel soru tekrarı: henüz sonuç yok'}</small>
    </div>
    <small className="muted">Bu göstergeler kesin kazanım hâkimiyeti veya doğrulanmış öğretmen çözümü değildir; tekrar takvimini değiştirmez.</small>
   </div>
   <form onSubmit={e=>void save(e)} className="stack">
    <label className="field">
     <span>1. Neden yanlış yaptım veya boş bıraktım?</span>
     <select value={reason} onChange={e=>setReason(e.target.value)}>
      {ERROR_REASONS.map(([id,label])=><option key={id} value={id}>{label}</option>)}
     </select>
    </label>
    <p className="muted"><strong>Önerilen yaklaşım:</strong> {CHECKS[reason]}</p>
    <label className="field">
     <span>2. Hangi düşüncede zorlandım veya hangi adımı atlayamadım?</span>
     <textarea rows={3} value={mistakenStep} onChange={e=>setMistakenStep(e.target.value)}
      minLength={15} maxLength={900} required placeholder="Örnek: Soru kökünde istenmeyeni aradım, son cümleyi atladım."/>
    </label>
    <label className="field">
     <span>3. Doğru kuralı veya yöntemi kendi cümlemle açıkla</span>
     <textarea rows={3} value={correctedPrinciple} onChange={e=>setCorrectedPrinciple(e.target.value)}
      minLength={20} maxLength={1000} required placeholder="Hangi ilkeyi kullanmalıyım? Neden?"/>
    </label>
    <label className="field">
     <span>4. Sonraki soruda hatayı tekrarlamamak için neyi kontrol edeceğim?</span>
     <textarea rows={2} value={nextTimeCheck} onChange={e=>setNextTimeCheck(e.target.value)}
      minLength={15} maxLength={800} required placeholder="Somut, ölçülebilir bir kontrol adımı belirle."/>
    </label>
    <div className="row" style={{flexWrap:'wrap',gap:8}}>
     <button className="btn primary" disabled={saving} type="submit">{saving?'Kaydediliyor…':'Düzeltme Planımı Kaydet'}</button>
     {current.review?.id&&<button type="button" className="btn" onClick={()=>onStartGuided(current)}>
      Farklı Çözümlü Örnek Çalış
     </button>}
     <button className="btn" type="button" onClick={()=>void load()} disabled={loading}>Sonuçları Yenile</button>
    </div>
    <small className="muted">Yazdığın kuralın doğruluğu otomatik onaylanmaz; gerektiğinde koçuna veya öğretmenine doğrulat.</small>
   </form>
  </div>}
 </div>;
}
