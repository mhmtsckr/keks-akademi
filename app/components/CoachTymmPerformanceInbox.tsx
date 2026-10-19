'use client';
import {useEffect,useState} from 'react';

type Item={id:string;studentId:string;studentName:string;grade:number;subject:string;
 title:string;kind:'BASELINE_REVIEW'|'TRANSFER_REVIEW'|'TRANSFER_READY'|'TRANSFER_UPCOMING';
 timestamp:string;waitingHours:number|null;overdue:boolean};
type ResponseData={ok:boolean;counts:{awaitingCoach:number;waitingOver48Hours:number;
 transferReady:number;transferUpcoming48Hours:number};items:Item[];
 partial:boolean;warning:string|null;note:string};
const empty:ResponseData['counts']={
 awaitingCoach:0,waitingOver48Hours:0,transferReady:0,transferUpcoming48Hours:0
};
const labels:Record<Item['kind'],string>={
 BASELINE_REVIEW:'İlk rubrik değerlendirmesi',
 TRANSFER_REVIEW:'Gecikmeli görev incelemesi',
 TRANSFER_READY:'Öğrenci için ikinci görev açıldı',
 TRANSFER_UPCOMING:'İkinci görev açılacak'
};
export function CoachTymmPerformanceInbox(){
 const [items,setItems]=useState<Item[]>([]);
 const [counts,setCounts]=useState(empty);
 const [partial,setPartial]=useState(false);
 const [message,setMessage]=useState('');
 const [loading,setLoading]=useState(true);
 async function load(){
  setLoading(true);
  try{
   const r=await fetch('/api/coach/performance-inbox',{cache:'no-store'});
   const j=await r.json();
   if(!r.ok||!j.ok)throw new Error(j.error||'Koç performans kuyruğu alınamadı.');
   setItems(j.items||[]);
   setCounts(j.counts||empty);
   setPartial(Boolean(j.partial));
   setMessage(j.warning||'');
  }catch(e){setMessage('Hata: '+(e instanceof Error?e.message:'Veri alınamadı.'));}
  finally{setLoading(false);}
 }
 useEffect(()=>{void load();},[]);
 const date=(stamp:string)=>new Date(stamp).toLocaleString('tr-TR',{
  timeZone:'Europe/Istanbul',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'
 });
 return <div className="card">
  <div className="moduleHeaderRow">
   <div>
    <div className="moduleEyebrow">KEKS · TÜM ÖĞRENCİLERİN RUBRİK & YENİDEN ÖLÇME TAKİBİ</div>
    <h2>Koç Performans İnceleme Kutusu</h2>
    <p className="muted">Yalnız size atanmış öğrencilerin bekleyen değerlendirmeleri ve ikinci ölçüm zamanları. Yanıt metinleri bu listede gösterilmez.</p>
   </div>
   <button type="button" className="btn" onClick={()=>void load()} disabled={loading}>
    {loading?'Yükleniyor…':'Listeyi Yenile'}
   </button>
  </div>
  <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))'}}>
   <div className="card"><small className="muted">Koç incelemesi bekleyen</small><div className="kpi">{counts.awaitingCoach}</div></div>
   <div className="card"><small className="muted">48+ saat bekleyen rubrik</small><div className="kpi">{counts.waitingOver48Hours}</div></div>
   <div className="card"><small className="muted">Öğrenciye açılan ikinci görev</small><div className="kpi">{counts.transferReady}</div></div>
   <div className="card"><small className="muted">48 saatte açılacak</small><div className="kpi">{counts.transferUpcoming48Hours}</div></div>
  </div>
  {message&&<div className={'notice '+(message.startsWith('Hata:')?'error':'')}>{message}</div>}
  {!loading&&items.length===0&&!message&&<p className="muted">İnceleme veya gecikmeli ikinci görev takibi gerektiren kayıt bulunmuyor.</p>}
  <div className="stack">
   {items.slice(0,30).map(item=><div key={item.id} className="notice">
    <div className="row" style={{justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
     <div>
      <strong>{item.studentName} · {item.grade}. sınıf {item.subject}</strong>
      <div className="muted">{labels[item.kind]} · {item.title}</div>
      <small className="muted">
       {item.kind==='TRANSFER_READY'||item.kind==='TRANSFER_UPCOMING'?'İkinci görevin açılma zamanı':'Öğrenci teslimi'}: {date(item.timestamp)}
       {item.waitingHours!==null?' · '+item.waitingHours+' saat bekliyor':''}
       {item.overdue?' · Öncelikli takip':''}
      </small>
     </div>
     <a className="btn" href={'/koc/ogrenci/'+encodeURIComponent(item.studentId)}>
      Öğrenciye Git
     </a>
    </div>
   </div>)}
  </div>
  {items.length>30&&<p className="muted">İlk 30 kayıt gösteriliyor. Öğrenci detayındaki performans bölümünden diğer kayıtları inceleyebilirsiniz.</p>}
  <small className="muted">İkinci görevin açılması, öğrencinin görevi teslim ettiği anlamına gelmez. Hatırlatma ve koç müdahalesi insan kararıdır; rubrik puanı otomatik “Kalıcı” öğrenme statüsü oluşturmaz.</small>
  {partial&&<p className="muted">Not: Veri hacmi sınırına ulaşıldı. Sayaçlar eksik olabilir.</p>}
 </div>;
}
