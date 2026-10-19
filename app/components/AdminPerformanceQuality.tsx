'use client';
import {useEffect,useState} from 'react';

type GradeRow={grade:number;subject:string;submissions:number;awaitingCoach:number;over48Hours:number;reviewed:number;transferReviewed:number};
type Report={
 periodDays:number;periodStart:string;asOf:string;truncated:boolean;
 submitted:number;baselineSubmitted:number;transferSubmitted:number;
 reviewed:number;baselineReviewed:number;transferReviewed:number;
 awaitingCoach:number;over48Hours:number;validRubrics:number;lateReviews:number;
 averageReviewHours:number|null;missingReviewRationale:number;distinctOutcomeCodes:number;
 transfersWithValidComparison:number;improved:number;struggled:number;similar:number;
 averageTransferDelta:number|null;byGradeAndSubject:GradeRow[];disclaimers:string[]
};
export function AdminPerformanceQuality(){
 const [data,setData]=useState<Report|null>(null);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState('');
 async function load(){
  setLoading(true);setError('');
  try{
   const r=await fetch('/api/admin/performance-quality',{cache:'no-store'});
   const j=await r.json();
   if(!r.ok||!j.ok)throw new Error(j.error||'Kalite göstergeleri alınamadı.');
   setData(j.report);
  }catch(e){setError(e instanceof Error?e.message:'Sunucuya erişilemiyor.');}
  finally{setLoading(false);}
 }
 useEffect(()=>{void load();},[]);
 return <details className="card" style={{marginBottom:16}}>
  <summary><strong>TYMM pilot rubrik kalite izlemesi</strong>{data?' · '+data.awaitingCoach+' koç incelemesi bekliyor · '+data.over48Hours+' tanesi 48 saati geçti':''}</summary>
  <div className="moduleHeaderRow" style={{marginTop:12}}>
   <div><p className="muted">Son {data?.periodDays||90} günde gönderilmiş açık uçlu, deney planı ve model görevleri için kimliksiz toplu kalite izlemesi. Başarı veya kazanım kapsama oranı değildir.</p></div>
   <button className="btn" type="button" disabled={loading} onClick={()=>void load()}>{loading?'Yükleniyor…':'Raporu Yenile'}</button>
  </div>
  {error&&<p className="notice">{error}</p>}
  {!data&&!error&&<p className="muted">Pilot değerlendirme kayıtları okunuyor.</p>}
  {data&&<>
   {data.truncated&&<div className="notice"><strong>Kısmi kayıt uyarısı:</strong> Son 90 gün içinde analiz limiti aşıldı. Aşağıdaki rakamlar en yeni 2500 kayıttan hesaplandı; tam dönem toplamı değildir.</div>}
   <div className="row" style={{flexWrap:'wrap',gap:12,marginBottom:12}}>
    <div className="card"><strong>{data.submitted}</strong><p className="muted">Pilot teslim</p></div>
    <div className="card"><strong>{data.reviewed}</strong><p className="muted">Koç rubriği tamamlanan</p></div>
    <div className="card"><strong>{data.awaitingCoach}</strong><p className="muted">İnceleme bekliyor</p></div>
    <div className="card"><strong>{data.over48Hours}</strong><p className="muted">48 saat üzeri bekleyen</p></div>
   </div>
   <p><strong>Rubrik kalitesi:</strong> {data.validRubrics} teknik olarak geçerli dört ölçütlü puanlama; {data.missingReviewRationale} kayıtta düşük puanlı ölçüt için yeterli metinsel gerekçe tespit edilemedi.
    {data.averageReviewHours!==null?' Ortalama gözlenen inceleme süresi '+data.averageReviewHours+' saat.':''}
   </p>
   <p><strong>Bağımsız transfer:</strong> {data.transferSubmitted} ikinci görev teslimi, {data.transferReviewed} ikinci görev incelemesi; bunların {data.transfersWithValidComparison} tanesinde karşılaştırılabilir iki rubrik var.</p>
   <p><strong>Gecikmeli karşılaştırma sinyalleri:</strong> {data.improved} gelişim, {data.similar} benzer düzey, {data.struggled} güçlük.
    {data.averageTransferDelta!==null?' Ortalama puan farkı '+(data.averageTransferDelta>0?'+':'')+data.averageTransferDelta+'/8.':''}
   </p>
   {data.submitted===0&&<p className="muted">Seçili dönemde henüz değerlendirilecek pilot görev teslimi bulunmuyor. Sıfır kayıt, öğrencilerin yetersiz olduğu anlamına gelmez.</p>}
   {data.byGradeAndSubject.length>0&&<details>
    <summary>Sınıf ve ders bazında dağılım ({data.byGradeAndSubject.length})</summary>
    <div className="stack" style={{marginTop:10}}>
     {data.byGradeAndSubject.map(row=><div className="notice" key={row.grade+'|'+row.subject}>
      <strong>{row.grade}. sınıf · {row.subject}</strong>
      <p className="muted">{row.submissions} teslim · {row.reviewed} koç incelemesi · {row.awaitingCoach} bekleyen · {row.over48Hours} gecikmiş · {row.transferReviewed} ikinci görev incelemesi</p>
     </div>)}
    </div>
   </details>}
   <div className="stack" style={{marginTop:12}}>
    {data.disclaimers.map((note,i)=><small className="muted" key={i}>{note}</small>)}
   </div>
  </>}
 </details>;
}
