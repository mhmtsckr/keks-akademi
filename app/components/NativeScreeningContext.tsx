'use client';

import {useEffect,useRef,useState,FormEvent} from 'react';
import {KeksDraftIndicator,useKeksFormDraft} from './useKeksFormDraft';

type Context={
 learningStage:'FOUNDATION'|'DEVELOPING'|'INDEPENDENT';
 dailyMinutes:number;weeklyDays:number;numericalShare:number;
 numericalGaps:string;verbalGaps:string;lastEvaluation:string;
 challengeExample:string;obstacles:string;teacherObservation:string;
 guidanceRead:boolean;
};
const defaults:Context={learningStage:'FOUNDATION',dailyMinutes:120,weeklyDays:5,numericalShare:50,
 numericalGaps:'',verbalGaps:'',lastEvaluation:'',challengeExample:'',obstacles:'',teacherObservation:'',guidanceRead:true};
const options=[
 {value:'FOUNDATION',label:'Yeni başlıyorum · Temel oluşturuyorum'},
 {value:'DEVELOPING',label:'Geliştiriyorum · Destekle uyguluyorum'},
 {value:'INDEPENDENT',label:'Bağımsız uyguluyorum · Pekiştiriyorum'}
];
export function NativeScreeningContext({studentId}:{studentId:string}){
 const [data,setData]=useState<Context>(defaults);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [status,setStatus]=useState('');
 const [read,setRead]=useState(false);
 const recovered=useRef(false);
 const draft=useKeksFormDraft<Context>({kind:'CONTEXT',scope:'learning-profile-v1',studentId,
   onRestore:(restored)=>{recovered.current=true;setData({...defaults,...restored});setRead(Boolean(restored.guidanceRead))}});
 useEffect(()=>{
   if(!draft.ready||loading)return;
   draft.save({...data,guidanceRead:read});
 },[draft.ready,draft.save,loading,data,read]);
 useEffect(()=>{
  let active=true;
  fetch('/api/student/screening-context',{cache:'no-store'})
   .then(async r=>{const j=await r.json();if(!r.ok)throw Error(j.error||'Bilgiler yüklenemedi.');return j})
   .then(j=>{if(!active)return;const ctx=j.context||{};if(!recovered.current){const safe={...defaults};for(const key of Object.keys(defaults) as Array<keyof Context>){if(ctx[key]!==undefined)(safe as any)[key]=ctx[key]}setData(safe);setRead(Boolean(ctx.guidanceRead))}setLoading(false)})
   .catch(e=>{if(active){setLoading(false);setStatus('Hata: '+(e instanceof Error?e.message:'Bilgiler yüklenemedi.'))}});
  return ()=>{active=false};
 },[]);
 function patch<K extends keyof Context>(key:K,value:Context[K]){setData(x=>({...x,[key]:value}));setStatus('')}
 async function save(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy||!read)return;
  setBusy(true);setStatus('KEKS öğrenci hesabına kaydediliyor…');
  try{
   const r=await fetch('/api/student/screening-context',{method:'PUT',headers:{'content-type':'application/json'},
    body:JSON.stringify({...data,guidanceRead:true})});
   const j=await r.json();if(!r.ok)throw Error(j.error||'Kayıt yapılamadı.');
   void draft.clear();
   setStatus('Profil tamamlandı. Sorular yeni öğrenme aşamana göre hazırlanıyor.');
   window.location.reload();
  }catch(error){setStatus('Hata: '+(error instanceof Error?error.message:'Kaydedilemedi.'))}
  finally{setBusy(false)}
 }
 return <div className="card keksNativeContext keksStudentInformationForm">
  <div className="keksInformationHero">
    <img src="/keks-official-2026.webp" alt="KEKS Akademi resmî amblemi" width="46" height="70"/>
    <div><div className="keksAssessmentKicker">KEKS FOCUS PRO · ÖĞRENCİ BİLGİ FORMU</div>
      <h3>Çalışma düzenini tanıyalım.</h3>
      <p>Yanıtların koçunun seni daha iyi tanımasına yardımcı olur. İnternet kesilse de taslağın korunur.</p></div>
  </div>
  <KeksDraftIndicator status={draft.status} retry={()=>{void draft.retry()}}/>
  {loading?<p>Çalışma profili yükleniyor…</p>:<form className="form" onSubmit={save}>
    <div className="keksFormGroupHeading"><span>01</span><div><strong>Çalışma alışkanlıkların</strong><small>Öğrenme aşaman ve haftalık zamanın</small></div></div>
    <div className="grid keksNativeContextGrid">
     <label className="field">Şu anki öğrenme aşamam
       <select value={data.learningStage} onChange={e=>patch('learningStage',e.target.value as Context['learningStage'])}>{options.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select>
     </label>
     <label className="field">Günlük çalışma sürem (dakika)
       <input type="number" min="10" max="480" required value={data.dailyMinutes} onChange={e=>patch('dailyMinutes',Number(e.target.value))}/>
     </label>
     <label className="field">Haftada kaç gün çalışırım?
       <select value={data.weeklyDays} onChange={e=>patch('weeklyDays',Number(e.target.value))}>{[1,2,3,4,5,6,7].map(v=><option key={v} value={v}>{v} gün</option>)}</select>
     </label>
     <label className="field">Sayısal derslere ayırdığım pay
       <select value={data.numericalShare} onChange={e=>patch('numericalShare',Number(e.target.value))}>{[40,50,60].map(v=><option key={v} value={v}>Sayısal %{v} · Sözel %{100-v}</option>)}</select>
     </label>
     <div className="keksFormGridHeading">02 · Güçlendirmek istediğin alanlar</div>
     <label className="field">Sayısal derslerde öncelikli eksikler
       <textarea rows={2} maxLength={400} value={data.numericalGaps} onChange={e=>patch('numericalGaps',e.target.value)} placeholder="Matematik: problemler, geometri…"/>
     </label>
     <label className="field">Sözel derslerde öncelikli eksikler
       <textarea rows={2} maxLength={400} value={data.verbalGaps} onChange={e=>patch('verbalGaps',e.target.value)} placeholder="Türkçe: paragraf, tarih…"/>
     </label>
     <div className="keksFormGridHeading">03 · Son deneyimlerin</div>
     <label className="field">Son deneme / okul değerlendirmesi
       <textarea rows={2} maxLength={500} value={data.lastEvaluation} onChange={e=>patch('lastEvaluation',e.target.value)} placeholder="İstersen derslere göre sonucunu yaz."/>
     </label>
     <label className="field">Zor bir soruda ya da sınavda en son ne yaptım?
       <textarea rows={2} maxLength={500} value={data.challengeExample} onChange={e=>patch('challengeExample',e.target.value)} placeholder="Çözüm denedim, ipucu aradım, yardım aldım…"/>
     </label>
     <label className="field">Çalışmamı en çok zorlaştıran durum
       <textarea rows={2} maxLength={400} value={data.obstacles} onChange={e=>patch('obstacles',e.target.value)} placeholder="Yalnızca çalışma sürecini anlat. Sağlık ve hassas kişisel bilgi yazma."/>
     </label>
     <label className="field">Veli / öğretmen gözlemi (isteğe bağlı)
       <textarea rows={2} maxLength={400} value={data.teacherObservation} onChange={e=>patch('teacherObservation',e.target.value)} placeholder="Katılımcının paylaşmayı uygun bulduğu eğitimsel gözlem."/>
     </label>
    </div>
    <div className="notice keksInfoNotice"><strong>Bilgilendirme:</strong> Eğilim taraması bir eğitimsel öz değerlendirme aracıdır; psikolojik tanı veya kesin kişilik sınıflaması değildir. Yanıtlar koç görüşmesi ve performans verileriyle birlikte yorumlanır. Henüz bilimsel olarak doğrulanmış bir ölçek olarak sunulmaz.</div>
    <label className="keksNativeConsent"><input type="checkbox" checked={read} onChange={e=>setRead(e.target.checked)} required/>Bilgilendirmeyi okudum. Gerekirse veli ile birlikte gözden geçireceğim.</label>
    <div className="row"><button className="btn primary" type="submit" disabled={busy||!read||!draft.ready}>{busy?'Kaydediliyor…':'Öğrenme profilini kaydet ve sorulara geç'}</button><span className="muted">Yalnızca KEKS Akademi hesabına kaydedilir.</span></div>
   </form>}
  {status&&<div className={'notice '+(status.startsWith('Hata')?'error':'')} role="status">{status}</div>}
 </div>;
}
