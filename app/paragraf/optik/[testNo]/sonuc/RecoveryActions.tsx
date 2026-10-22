'use client';
import {useState} from 'react';

type Choice='A'|'B'|'C'|'D'|'E';
type Question={passage:string;stem:string;choices:Record<Choice,string>};
type Coach={
 skill:string;diagnostic:string;practice:string;trap:string;
 firstProbe:string;reasonInstruction:string;verify:string;
};
type TopicIssue={
 number:number;topic:string;status:string;marked:string;correct:string;
 lesson:string;misconception:string|null;rightEvidence:string|null;
 firstAction:string;secondAction:string;thirdAction:string;
 originalQuestion:Question;coaching:Coach;
};
const WRONG_REASONS=[
 ['BELIRLENMEDI','Henüz bilmiyorum'],
 ['SORU_KOKU','Soru kökünü yanlış okudum'],
 ['BILGI_EKSIKLIGI','Konu bilgim eksik'],
 ['YONTEM_BILMEME','Şıkları eleme yöntemini bilmiyordum'],
 ['DIKKAT','Dikkat hatası yaptım'],
 ['SURE','Süreyi yönetemedim'],
 ['UNUTMA','Yöntemi hatırlayamadım'],
 ['ISLEM_HATASI','Cevabı aktarırken hata yaptım'],
] as const;
const BLANK_REASONS=[
 ['BELIRLENMEDI','Henüz bilmiyorum'],
 ['BOS_SURE','Süre yetmedi'],
 ['BOS_IKI_SIK','İki seçenek arasında kaldım'],
 ['BOS_METNI_ANLAMADIM','Metni / kökü anlamadım'],
 ['BOS_YONTEM','Nasıl başlayacağımı bilemedim'],
 ['BOS_EMIN_OLAMADIM','Emin olamadığım için işaretlemedim'],
] as const;
const LETTERS=['A','B','C','D','E'] as const;

export function RecoveryActions({testNo,encoded,missed}:{testNo:number;encoded:string;missed:TopicIssue[]}){
 const [reasons,setReasons]=useState<Record<string,string>>({});
 const [retrials,setRetrials]=useState<Record<string,Choice>>({});
 const [evidence,setEvidence]=useState<Record<string,string>>({});
 const [revealed,setRevealed]=useState<Record<string,boolean>>({});
 const [status,setStatus]=useState('');
 const [saving,setSaving]=useState(false);
 const [saved,setSaved]=useState(false);

 async function importWrong(){
  if(saving)return;
  setSaving(true);setStatus('');
  try{
   const selected=Object.fromEntries(Object.entries(reasons).filter(([,v])=>v!=='BELIRLENMEDI'));
   const selfChecks=Object.fromEntries(Object.entries(retrials).map(([number,answer])=>[
    number,{answer,evidence:(evidence[number]||'').slice(0,500)}
   ]));
   const response=await fetch('/api/student/paragraf/optik/recover',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({testNo,encoded,reasons:selected,selfChecks})
   });
   const data=await response.json();
   if(!response.ok){
    if(response.status===401||response.status===403)
      throw new Error('Kişisel tekrar kaydı için öğrenci hesabınla giriş yapmalısın. <giriş>');
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
  <h2>Yanlıştan ve boştan öğrenme</h2>
  <p>Bu denemede yanlış veya boş sorunun yok. Kalıcı öğrenmeyi farklı sorular üzerinde sonraki günlerde kontrol et.</p>
 </section>;

 return <section style={{background:'#fff',border:'2px solid #d6a93c',borderRadius:15,padding:20,marginTop:20,color:'#0b2c57'}}>
  <h2 style={{marginTop:0}}>MİZA · Yanlıştan ve Boştan Öğrenme</h2>
  <p>Her soruda önce kökü ve kanıtı yeniden incele, <strong>çözüme bakmadan ikinci bir cevap dene</strong>, sonra gerekçeyi karşılaştır. Boş bırakma nedeni süre, kararsızlık veya yöntem eksikliği olabilir; nedenini sen belirtmedikçe sistem kesin bir tanı koymaz.</p>
  <div style={{display:'grid',gap:14}}>
   {missed.map(item=>{
    const id=String(item.number);
    const reveal=Boolean(revealed[id]);
    const chosen=retrials[id];
    const blank=item.status==='BOŞ';
    const options=blank?BLANK_REASONS:WRONG_REASONS;
    return <details key={id} style={{background:'#f6f8fc',padding:16,border:'1px solid #dbe2eb',borderRadius:12}}>
     <summary style={{cursor:'pointer',fontWeight:800}}>
      {item.number}. soru · {item.topic} · {blank?'Boş':'Yanlış'} — Öğrenme adımlarını aç
     </summary>
     <div style={{lineHeight:1.7,marginTop:14}}>
      <h3 style={{margin:'4px 0'}}>1. Sorunun istediğini yeniden bul</h3>
      <p><strong>{item.coaching.skill}:</strong> {item.lesson}</p>
      <p><strong>İlk hareket:</strong> {item.coaching.diagnostic}</p>
      <p style={{background:'#fff8e9',padding:12,borderRadius:10}}>{item.coaching.firstProbe}</p>
      <div style={{background:'#fff',padding:14,border:'1px solid #e5eaf1',borderRadius:10}}>
       <p style={{whiteSpace:'pre-wrap',margin:'0 0 14px'}}>{item.originalQuestion.passage}</p>
       <p style={{fontWeight:800}}>{item.originalQuestion.stem}</p>
       {LETTERS.map(letter=><p key={letter} style={{margin:'7px 0'}}>
        <strong>{letter})</strong> {item.originalQuestion.choices[letter]}
       </p>)}
      </div>
      <h3 style={{margin:'18px 0 7px'}}>2. Neden boş bıraktığını veya yanıldığını belirt</h3>
      <label htmlFor={'reason-'+id} style={{display:'block',fontWeight:700}}>Kendi değerlendirmem (isteğe bağlı)</label>
      <select id={'reason-'+id} value={reasons[id]||'BELIRLENMEDI'}
       onChange={e=>setReasons(prev=>({...prev,[id]:e.target.value}))}
       style={{width:'100%',maxWidth:510,padding:12,borderRadius:9,border:'1px solid #98aec1',background:'#fff'}}>
       {options.map(([value,label])=><option key={value} value={value}>{label}</option>)}
      </select>
      <h3 style={{margin:'18px 0 7px'}}>3. Çözümü görmeden yeniden dene</h3>
      <fieldset style={{border:'1px solid #d1dcea',borderRadius:10,padding:12}}>
       <legend style={{fontWeight:700}}>İkinci denemendeki cevap</legend>
       <div style={{display:'flex',flexWrap:'wrap',gap:9}}>
        {LETTERS.map(letter=><label key={letter} style={{display:'inline-flex',alignItems:'center',gap:5,
          background:chosen===letter?'#e3effd':'#fff',padding:'8px 12px',borderRadius:8,border:'1px solid #c8d6e6'}}>
         <input type="radio" name={'retry-'+id} value={letter} checked={chosen===letter}
           disabled={reveal}
           onChange={()=>setRetrials(prev=>({...prev,[id]:letter}))}/>{letter}
        </label>)}
       </div>
      </fieldset>
      <label htmlFor={'proof-'+id} style={{display:'block',fontWeight:700,marginTop:12}}>
       Bu cevabı neden seçtin? Metinden kanıtın (isteğe bağlı)
      </label>
      <textarea id={'proof-'+id} value={evidence[id]||''} maxLength={500} disabled={reveal} rows={2}
        onChange={e=>setEvidence(prev=>({...prev,[id]:e.target.value}))}
        placeholder="Kökün istediği nedir? Hangi ifade seçeneği destekliyor?"
        style={{display:'block',width:'100%',maxWidth:660,boxSizing:'border-box',resize:'vertical',padding:10,borderRadius:8,border:'1px solid #98aec1'}}/>
      {!reveal?<button type="button" disabled={!chosen} onClick={()=>setRevealed(prev=>({...prev,[id]:true}))}
       style={{border:'2px solid #d6a93c',background:'#0b2c57',color:'#fff',padding:'12px 18px',fontWeight:800,borderRadius:9,marginTop:13,cursor:chosen?'pointer':'not-allowed'}}>
       İkinci Denememi Kontrol Et ve Kanıtı Aç
      </button>:<div style={{borderLeft:'4px solid #d6a93c',padding:'8px 14px',background:'#fff',marginTop:16}}>
       <h3>4. Kanıt ve şık analizi</h3>
       <p><strong>İkinci denemen:</strong> {chosen} · {chosen===item.correct?'Doğru; nedenini de açıklayabilmelisin.':'Henüz doğru değil; kanıt ve çeldiriciyi yeniden incele.'}</p>
       <p><strong>Doğru cevap:</strong> {item.correct}</p>
       <p><strong>Neden bu seçenek elenir?</strong> {item.misconception||'Bu soru ilk denemede boştu; ikinci denemende seçtiğin şıkkın gerekçesini orijinal çözümle karşılaştır.'}</p>
       <p><strong>Doğru yanıtın dayanağı:</strong> {item.rightEvidence}</p>
       <p><strong>Bu türde izlenecek yöntem:</strong> {item.coaching.practice}</p>
       <p><strong>Çeldirici uyarısı:</strong> {item.coaching.trap}</p>
       <p><strong>Sonraki adım:</strong> {item.coaching.verify}</p>
      </div>}
     </div>
    </details>;
   })}
  </div>
  <div style={{background:'#f8f3e7',padding:16,borderRadius:12,marginTop:20}}>
   <strong>0–1–3–7–14–28 tekrar sistemi</strong>
   <p style={{margin:'8px 0 0'}}>Öğrenci hesabınla kaydettiğinde yanlış ve boş sorular 0. gün tekrar kuyruğuna alınır. Tarihler gerçek tekrar cevaplarına göre uyarlanır. İkinci denemede doğru işaretleme veya açıklamayı okuma, kazanımı otomatik tamamlamaz.</p>
  </div>
  <button onClick={()=>void importWrong()} disabled={saving||saved} type="button"
   style={{background:'#0b2c57',border:'2px solid #d6a93c',color:'#fff',borderRadius:12,padding:'14px 22px',fontSize:16,fontWeight:800,cursor:'pointer',marginTop:16}}>
   {saving?'Kaydediliyor…':saved?'Tekrar Listeme Eklendi':'Yanlış ve Boş Sorularımı Tekrar Listeme Ekle'}
  </button>
  {status&&<p role="status" style={{fontWeight:700}}>{status.includes('<giriş>')?<>{status.replace(' <giriş>','')} <a href="/giris">Öğrenci girişi</a></>:status}</p>}
  {saved&&<p><a href="/ogrenci" style={{color:'#074f9c',fontWeight:800}}>Öğrenci panelinde kişisel tekrarlarımı aç →</a></p>}
  <p style={{fontSize:12,color:'#63748a',marginTop:16}}>Cevapların sonuç QR’sını bilen kişilerce görülebilir. Kişisel tekrarlar yalnız öğrenci hesabına kaydedilir; öz bildirimin doğrulanmış ölçme sonucu değildir.</p>
 </section>;
}
