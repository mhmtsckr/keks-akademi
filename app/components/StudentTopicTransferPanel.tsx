'use client';

import {useEffect,useState} from 'react';

type Status='NEEDS_NEW_QUESTIONS'|'NEEDS_DELAYED_EVIDENCE'|'NEEDS_SUPPORT'|
 'PROGRESS_OBSERVED'|'STRONG_TRANSFER_SIGNAL';
type Row={
 examType:string;subject:string;topic:string;status:Status;statusLabel:string;
 baselineWrong:number;baselineBlank:number;
 newQuestions:number;delayedQuestions:number;delayedCorrect:number;delayedWrong:number;
 delayedBlank:number;delayedDays:number;accuracyPercent:number|null;hasDay7Evidence:boolean;
 nextAction:string;verifiedMastery:false;
};
type Result={
 topics:Row[];verifiedQuizzes:number;truncated:boolean;note:string;
 summary:{topics:number;needsSupport:number;awaitingEvidence:number;progressing:number;strongSignals:number};
};

export function StudentTopicTransferPanel({refreshToken=0}:{refreshToken?:number}){
 const [result,setResult]=useState<Result|null>(null);
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(true);
 const [filter,setFilter]=useState<'ALL'|'SUPPORT'|'PROGRESS'>('ALL');
 useEffect(()=>{
  const controller=new AbortController();
  async function load(){
   setLoading(true);setError('');
   try{
    const response=await fetch('/api/student/topic-transfer',{
     cache:'no-store',signal:controller.signal
    });
    const json=await response.json();
    if(!response.ok)throw new Error(json.error||'Konu öğrenme kanıtları alınamadı.');
    if(!controller.signal.aborted)setResult(json);
   }catch(e){
    if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Veri yüklenemedi.');
   }finally{
    if(!controller.signal.aborted)setLoading(false);
   }
  }
  void load();
  return ()=>controller.abort();
 },[refreshToken]);
 const rows=result?.topics.filter(row=>
  filter==='ALL'||filter==='SUPPORT'?
   filter==='ALL'||row.status==='NEEDS_SUPPORT'||row.status==='NEEDS_NEW_QUESTIONS'||row.status==='NEEDS_DELAYED_EVIDENCE'
   :row.status==='STRONG_TRANSFER_SIGNAL'||row.status==='PROGRESS_OBSERVED'
 )||[];
 return <section className="card" id="keks-konu-aktarim" aria-label="Konu öğrenme kanıtları">
  <div className="moduleHeaderRow">
   <div>
    <div className="moduleEyebrow">KEKS · FARKLI SORU + FARKLI GÜN</div>
    <h2>Hangi konuyu ne kadar pekiştirdim?</h2>
    <p className="muted">İlk yanlışın veya boşun ardından yeni ve onaylı sorulardaki sonuçlar izlenir. Aynı soruyu tekrar doğru çözmek, yeni soruda öğrenme kanıtı değildir.</p>
   </div>
   <span className="pill">{result?.summary.topics||0} konu</span>
  </div>
  {loading&&<p className="muted">Soru ve gün kanıtları kontrol ediliyor…</p>}
  {error&&<div className="notice error" role="status">{error}</div>}
  {result&&!loading&&<>
   <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))'}}>
    <div className="card" style={{margin:0}}><strong>{result.summary.needsSupport}</strong><small>Koç desteği öneriliyor</small></div>
    <div className="card" style={{margin:0}}><strong>{result.summary.awaitingEvidence}</strong><small>Yeni soru / farklı gün bekliyor</small></div>
    <div className="card" style={{margin:0}}><strong>{result.summary.progressing}</strong><small>İlerleme işareti</small></div>
    <div className="card" style={{margin:0}}><strong>{result.summary.strongSignals}</strong><small>Güçlü aktarım işareti</small></div>
   </div>
   {result.truncated&&<div className="notice">Geçmiş kayıt sınırına ulaşıldı. Eksik geçmiş üzerinden güçlü öğrenme işareti verilmez.</div>}
   <div className="row" style={{gap:8,flexWrap:'wrap',marginTop:12}}>
    <button className="btn" type="button" aria-pressed={filter==='ALL'} onClick={()=>setFilter('ALL')}>Tüm konular</button>
    <button className="btn" type="button" aria-pressed={filter==='SUPPORT'} onClick={()=>setFilter('SUPPORT')}>Çalışma gerekenler</button>
    <button className="btn" type="button" aria-pressed={filter==='PROGRESS'} onClick={()=>setFilter('PROGRESS')}>İlerleyenler</button>
   </div>
   {result.topics.length===0
    ?<p className="muted">Farklı günlerde takip edilebilecek onaylı başlangıç yanlış/boş kaydı henüz oluşmadı. Yeni soru çözümü kaydedildikçe burada görünür.</p>
    :<div className="stack" style={{marginTop:12}}>
      {rows.slice(0,12).map(row=><article className="card" style={{margin:0}} key={[row.examType,row.subject,row.topic].join('|')}>
       <div className="moduleHeaderRow">
        <strong>{row.examType} · {row.subject} · {row.topic}</strong>
        <span className="pill">{row.statusLabel}</span>
       </div>
       <p>Başlangıç: {row.baselineWrong} yanlış · {row.baselineBlank} boş.
        {' '}Yeni sorularda: {row.newQuestions} soru; gecikmeli {row.delayedQuestions} sorudan {row.delayedCorrect} doğru, {row.delayedWrong} yanlış, {row.delayedBlank} boş.</p>
       <p className="muted">{row.delayedDays} farklı gecikmeli gün ·
        {row.accuracyPercent==null?' Gecikmeli doğruluk henüz yok':' Gecikmeli doğruluk %'+row.accuracyPercent}
        {row.hasDay7Evidence?' · 7+ gün sonra ölçüm var':' · 7+ gün kanıtı bekleniyor'}</p>
       <p><strong>Sıradaki adım:</strong> {row.nextAction}</p>
      </article>)}
      {rows.length===0&&<p className="muted">Bu filtrede henüz konu bulunmuyor.</p>}
    </div>}
   <p className="muted" style={{marginTop:12}}>Bu ekran kesin kazanım hâkimiyeti veya sınav başarısı garantisi vermez. Güçlü aktarım, yeni sorulara ve farklı günlere yayılmış gözlemsel bir işarettir. {result.note}</p>
  </>}
 </section>;
}
