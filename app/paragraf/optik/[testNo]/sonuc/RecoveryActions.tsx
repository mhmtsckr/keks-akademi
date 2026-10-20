'use client';
import {useState} from 'react';

type TopicIssue={
 number:number;topic:string;status:string;marked:string;correct:string;
 lesson:string;misconception:string|null;rightEvidence:string|null;
 firstAction:string;secondAction:string;thirdAction:string
};
const REASONS=[
 ['BELIRLENMEDI','Hata nedenimi henüz bilmiyorum'],
 ['SORU_KOKU','Soru kökünü yanlış okudum'],
 ['BILGI_EKSIKLIGI','Konu bilgim eksik'],
 ['YONTEM_BILMEME','Eleme yöntemini bilmiyordum'],
 ['DIKKAT','Dikkat hatası yaptım'],
 ['SURE','Süreyi yetiştiremedim'],
 ['UNUTMA','Öğrendiğimi unuttum'],
 ['ISLEM_HATASI','İşlem / aktarım hatası']
] as const;

export function RecoveryActions({testNo,encoded,missed}:{
 testNo:number;encoded:string;missed:TopicIssue[]
}){
 const [reasons,setReasons]=useState<Record<string,string>>({});
 const [status,setStatus]=useState('');
 const [saving,setSaving]=useState(false);
 const [saved,setSaved]=useState(false);
 async function importWrong(){
  if(saving)return;
  setSaving(true);setStatus('');
  try{
   const selected=Object.fromEntries(Object.entries(reasons).filter(([,v])=>v!=='BELIRLENMEDI'));
   const response=await fetch('/api/student/paragraf/optik/recover',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({testNo,encoded,reasons:selected})
   });
   const data=await response.json();
   if(!response.ok){
    if(response.status===401||response.status===403)throw new Error('Kişisel tekrar kaydı için öğrenci hesabınla giriş yapmalısın. <giriş>');
    throw new Error(data.error||'Tekrar listesi oluşturulamadı.');
   }
   setSaved(true);
   setStatus(data.alreadySaved
    ?'Bu testin ilk gönderimi daha önce kaydedilmiş; tekrar takvimin değiştirilmedi.'
    :data.reviewLinked+' yanlış/boş soru kişisel tekrar listene eklendi. İlk tekrar bugüne planlandı.');
  }catch(e){
   setStatus(e instanceof Error?e.message:'İşlem başarısız.');
  }finally{setSaving(false);}
 }
 if(!missed.length)return <section style={{background:'#e9f7e9',border:'1px solid #a6d5af',borderRadius:14,padding:20,marginTop:20}}>
  <h2>Yanlıştan öğrenme</h2>
  <p>Bu denemede yanlış veya boş sorunun yok. Kalıcılık için yeni sorularla daha sonra yeniden kendini ölç.</p>
 </section>;
 return <section style={{background:'#fff',border:'2px solid #d6a93c',borderRadius:15,padding:'20px',marginTop:20,color:'#0b2c57'}}>
  <h2 style={{marginTop:0}}>MİZA · Yanlıştan Öğrenme Motoru</h2>
  <p>Önce hangi düşüncede yanıldığını bul, kanıtı karşılaştır ve aynı hatayı tekrarlamamak için bir yöntem seç. Hata nedenini yalnızca sen doğrulayabilirsin; sistem bunu tahmin ederek kesin tanı koymaz.</p>
  <div style={{display:'grid',gap:12}}>
   {missed.map(item=><details key={item.number} style={{background:'#f6f8fc',padding:15,border:'1px solid #dbe2eb',borderRadius:12}}>
    <summary style={{cursor:'pointer',fontWeight:800}}>
     {item.number}. soru · {item.topic} · {item.status==='BOŞ'?'Boş':'Yanlış'} — Öğrenme adımlarını aç
    </summary>
    <div style={{lineHeight:1.7,marginTop:12}}>
     <p><strong>1. Konuyu anla:</strong> {item.lesson}</p>
     <p><strong>2. Neden bu cevap elendi?</strong> {item.misconception||'Bu soruyu boş bıraktın. Önce kendi cevabını oluşturmayı dene.'}</p>
     <p><strong>3. Doğru cevabın metinsel dayanağı:</strong> {item.rightEvidence||'Ayrıntılı çözümden doğru seçeneğin gerekçesini incele.'}</p>
     <p><strong>4. Şimdi ne yapmalısın?</strong> {item.firstAction}</p>
     <p>{item.secondAction}</p>
     <p><strong>5. Bağımsız deneme:</strong> {item.thirdAction}</p>
     <label style={{display:'block',fontWeight:700,margin:'12px 0 5px'}}>
      Yanlışımın asıl nedeni neydi?
     </label>
     <select value={reasons[String(item.number)]||'BELIRLENMEDI'}
       onChange={e=>setReasons(prev=>({...prev,[item.number]:e.target.value}))}
       style={{width:'100%',maxWidth:500,padding:12,borderRadius:8,border:'1px solid #98aec1',background:'#fff'}}>
       {REASONS.map(([key,name])=><option key={key} value={key}>{name}</option>)}
     </select>
    </div>
   </details>)}
  </div>
  <div style={{background:'#f8f3e7',padding:16,borderRadius:12,marginTop:20}}>
   <strong>0–1–3–7–14–28 tekrar sistemi</strong>
   <p style={{margin:'8px 0 0'}}>Öğrenci hesabınla kaydettiğinde yanlış ve boş sorular 0. gün tekrar kuyruğuna alınır. Daha sonraki aralıklar, bağımsız tekrar sonuçlarına göre ayarlanır. Açıklamayı okumuş olmak soruyu öğrenmiş sayılmaz.</p>
  </div>
  <button onClick={()=>void importWrong()} disabled={saving||saved} type="button"
   style={{background:'#0b2c57',border:'2px solid #d6a93c',color:'#fff',borderRadius:12,padding:'14px 22px',fontSize:16,fontWeight:800,cursor:'pointer',marginTop:16}}>
   {saving?'Kaydediliyor…':saved?'Tekrar Listeme Eklendi':'Yanlış ve Boş Sorularımı Tekrar Listeme Ekle'}
  </button>
  {status&&<p role="status" style={{fontWeight:700}}>{status.includes('<giriş>')?<>{status.replace(' <giriş>','')} <a href="/giris">Öğrenci girişi</a></>:status}</p>}
  {saved&&<p><a href="/ogrenci" style={{color:'#074f9c',fontWeight:800}}>Öğrenci panelinde kişisel tekrarlarımı aç →</a></p>}
  <p style={{fontSize:12,color:'#63748a',marginTop:16}}>Kaydın öğrenci hesabına özeldir; QR ile paylaşılan eski sonuç bağlantısı otomatik olarak öğrenci hesabına kaydedilmez.</p>
 </section>;
}
