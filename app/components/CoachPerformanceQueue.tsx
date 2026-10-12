'use client';
import {useEffect,useState} from 'react';

type QueueItem={
 id:string;studentId:string;studentName:string;gradeLevel:string|null;
 grade:number;subject:string;title:string;phase:'BASELINE'|'TRANSFER';
 submittedAt:string;hoursWaiting:number;priority:'OVERDUE'|'WAITING';
};
type Payload={ok:boolean;items:QueueItem[];summary:{waiting:number;overdue:number};partial:boolean;targetHours?:number;note?:string};

export function CoachPerformanceQueue(){
 const [data,setData]=useState<Payload|null>(null);
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(false);
 async function refresh(){
  setLoading(true);setError('');
  try{
   const res=await fetch('/api/coach/performance-queue',{cache:'no-store'});
   const json=await res.json();
   if(!res.ok||!json.ok)throw new Error(json.error||'Kuyruk alınamadı.');
   setData(json);
  }catch(e){setError(e instanceof Error?e.message:'Kuyruk alınamadı.');}
  finally{setLoading(false);}
 }
 useEffect(()=>{void refresh();},[]);
 return <section className="card">
  <div className="moduleHeaderRow">
   <div>
    <div className="moduleEyebrow">KEKS · KOÇ MANUEL RUBRİK İNCELEMESİ</div>
    <h2>Performans Değerlendirme Kuyruğu</h2>
    <p className="muted">Yalnızca sizin öğrencilerinizin açık uçlu, model ve deney tasarımı teslimleri. Değerlendirme burada otomatik yapılmaz.</p>
   </div>
   <button className="btn" type="button" onClick={()=>void refresh()} disabled={loading}>
    {loading?'Yenileniyor…':'Yenile'}
   </button>
  </div>
  {error&&<p className="notice error">{error}</p>}
  {data&&<>
   <div className="row" style={{gap:12,flexWrap:'wrap'}}>
    <span className="pill">{data.summary.waiting} bekleyen</span>
    {data.summary.overdue>0&&<span className="pill">Hedef süreyi aşan ({data.targetHours||24} sa): {data.summary.overdue}</span>}
   </div>
   {data.partial&&<p className="notice">Kayıt çokluğu nedeniyle yalnız son 500 teslim incelendi. Gösterilen toplam kısmi olabilir.</p>}
   {data.items.length===0?<p className="muted">İnceleme bekleyen performans görevi bulunmadı.</p>
    :<div className="stack" style={{marginTop:12}}>
      {data.items.slice(0,20).map(x=><div key={x.id} className="coachTaskRow">
       <div>
        <strong>{x.studentName} · {x.grade}. sınıf · {x.subject}</strong>
        <p className="muted">{x.phase==='TRANSFER'?'7 gün sonrası bağımsız görev':'İlk performans görevi'} · {x.title}</p>
        <small className="muted">
         {new Date(x.submittedAt).toLocaleString('tr-TR')} · {x.hoursWaiting} saat bekliyor
         {x.priority==='OVERDUE'?' · Koçun hedef yanıt süresi aşıldı':''}
        </small>
       </div>
       <a className="btn" href={'/koc/ogrenci/'+encodeURIComponent(x.studentId)}>
        Öğrenciyi İncele
       </a>
      </div>)}
     </div>}
   <small className="muted">Liste gönderim tarihine göre hesaplanır; öğrenci yanıtı, değerlendirme puanı ve özel notlar yalnız yetkili öğrenci detayında gösterilir.</small>
  </>}
 </section>;
}
