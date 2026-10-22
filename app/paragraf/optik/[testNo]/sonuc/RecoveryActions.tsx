'use client';
import {useState} from 'react';

type Item={
 number:number;questionId:string;topic:string;status:'YANLIŞ'|'BOŞ';
 marked:string;correct:string;lesson:string;solutionUrl:string|null;
 misconception:string|null;rightEvidence:string|null;
 firstAction:string;secondAction:string;thirdAction:string;
 remediation:{
  skill:string;goal:string;lessonSteps:string[];trap:string;selfCheck:string;
  transferTask:string;repeatDays:readonly number[];note:string
 }
};
const WRONG_REASONS=[
 ['BELIRLENMEDI','Hata nedenimi henüz bilmiyorum'],
 ['SORU_KOKU','Soru kökünü yanlış okudum'],
 ['BILGI_EKSIKLIGI','Konu bilgim eksik'],
 ['YONTEM_BILMEME','Şıkları eleme yöntemini bilmiyordum'],
 ['DIKKAT','Dikkat / kodlama hatası'],
 ['SURE','Süre yönetimi'],
 ['UNUTMA','Önceden öğrendiğimi unuttum'],
 ['ISLEM_HATASI','İşlem / aktarım hatası']
] as const;
const BLANK_REASONS=[
 ['HENUZ_BILMIYORUM','Neden boş bıraktığımı henüz bilmiyorum'],
 ['SURE_YETMEDI','Sürem yetmedi'],
 ['KARARSIZ_KALDIM','İki şık arasında kararsız kaldım'],
 ['METNI_ANLAMADIM','Metnin anlamını kuramadım'],
 ['YONTEM_BILMIYORUM','Bu soru türünün yöntemini bilmiyorum']
] as const;
const BLANK_TIPS:Record<string,string>={
 SURE_YETMEDI:'Aynı beceriyi önce süresiz çalış, yöntemi öğrendikten sonra yeni soruda süre ölç.',
 KARARSIZ_KALDIM:'Kararsız kaldığın iki seçeneği metinden ayrı ayrı kanıt göstererek karşılaştır.',
 METNI_ANLAMADIM:'Metni paragraf paragraf özetle ve hangi cümlede kopuş yaşadığını bul.',
 YONTEM_BILMIYORUM:'Aşağıdaki beceri adımlarını önce öğren, sonra farklı soruda uygula.',
 HENUZ_BILMIYORUM:'Nedenini tahmin etme; önce zorlandığın okumayı ve eleme adımını belirle.'
};
const navy='#0b2c57',gold='#d6a93c';

export function RecoveryActions({testNo,encoded,missed}:{
 testNo:number;encoded:string;missed:Item[]
}){
 const [reasons,setReasons]=useState<Record<string,string>>({});
 const [blankCauses,setBlankCauses]=useState<Record<string,string>>({});
 const [reflections,setReflections]=useState<Record<string,string>>({});
 const [status,setStatus]=useState('');
 const [saving,setSaving]=useState(false);
 const [saved,setSaved]=useState(false);
 async function save(){
  if(saving||saved)return;
  setSaving(true);setStatus('');
  try{
   const selected=Object.fromEntries(Object.entries(reasons).filter(([,v])=>v!=='BELIRLENMEDI'));
   const blanks=Object.fromEntries(Object.entries(blankCauses).filter(([,v])=>v!=='HENUZ_BILMIYORUM'));
   const written=Object.fromEntries(Object.entries(reflections).filter(([,v])=>v.trim()).map(([k,v])=>[k,v.trim()]));
   const response=await fetch('/api/student/paragraf/optik/recover',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({testNo,encoded,reasons:selected,blankCauses:blanks,reflections:written})
   });
   const data=await response.json();
   if(!response.ok){
    if(response.status===401||response.status===403)throw new Error('Giriş yaparak kişisel tekrar listene kaydet.');
    throw new Error(data.error||'Kişisel tekrarlar kaydedilemedi.');
   }
   setSaved(true);
   setStatus(data.alreadySaved
    ?'Bu testin ilk kaydı önceden oluşturulmuş; önceki cevaplar ve tekrar tarihleri değiştirilmedi.'
    :data.reviewLinked+' yanlış/boş soru hesabındaki 0. gün tekrar kuyruğuna eklendi.');
  }catch(e){setStatus(e instanceof Error?e.message:'İşlem başarısız.');}
  finally{setSaving(false);}
 }
 if(!missed.length)return <section style={{background:'#edf7ef',border:'1px solid #9cc9a6',borderRadius:14,padding:20,marginTop:20}}>
  <h2>Öğrenme Kontrolü</h2>
  <p>Bu testte yanlış veya boş yok. Bu tek test kalıcı hâkimiyeti kanıtlamaz;
   aynı beceriden yeni soruları daha sonra yardım almadan çözerek pekiştir.</p>
 </section>;
 const blanks=missed.filter(x=>x.status==='BOŞ').length;
 const wrong=missed.length-blanks;
 return <section style={{background:'#fff',border:'2px solid '+gold,borderRadius:16,padding:'clamp(15px,3vw,25px)',marginTop:20,color:navy}}>
  <h2 style={{marginTop:0}}>MİZA · Yanlış ve Boştan Öğrenme</h2>
  <p><strong>{wrong} yanlış · {blanks} boş</strong> için kişiselleştirilmiş çalışma adımları hazırlandı.
   Yanlışta çeldiriciyi analiz et; boşta neden cevap veremediğini belirle.
   Hata nedeni senin öz değerlendirmendir, otomatik kesin tanı değildir.</p>
  <div style={{display:'grid',gap:13}}>
   {missed.map(item=>{
    const num=String(item.number),blank=item.status==='BOŞ',exercise=item.remediation;
    const cause=blank?(blankCauses[num]||'HENUZ_BILMIYORUM'):(reasons[num]||'BELIRLENMEDI');
    return <details key={num} style={{background:'#f5f8fc',padding:15,border:'1px solid #dbe2eb',borderRadius:13}}>
     <summary style={{cursor:'pointer',fontWeight:800,fontSize:16,lineHeight:1.6}}>
      {item.number}. soru · {exercise.skill} · {blank?'Boş':'Yanlış'} — Öğrenme planını aç
     </summary>
     <div style={{marginTop:14,lineHeight:1.7}}>
      <div style={{background:'#fff',padding:15,borderRadius:11,borderLeft:'4px solid '+gold}}>
       <strong>1. Önce beceriyi öğren</strong>
       <p style={{margin:'6px 0'}}>{exercise.goal}</p>
       <p><strong>Temel kural:</strong> {item.lesson}</p>
       <p><strong>Çeldirici tuzağı:</strong> {exercise.trap}</p>
      </div>
      <div style={{marginTop:14}}>
       <strong>2. {blank?'Neden boş bıraktın?':'Neden yanlış yaptın?'}</strong>
       <label htmlFor={'paragraf-reason-'+num} style={{display:'block',fontSize:13,margin:'7px 0'}}>Senin gözlemin</label>
       <select id={'paragraf-reason-'+num} value={cause}
        onChange={e=>blank
         ?setBlankCauses(prev=>({...prev,[num]:e.target.value}))
         :setReasons(prev=>({...prev,[num]:e.target.value}))}
        style={{padding:12,width:'100%',maxWidth:550,border:'1px solid #9eb2c4',borderRadius:9,background:'#fff',color:navy}}>
        {(blank?BLANK_REASONS:WRONG_REASONS).map(([value,label])=><option key={value} value={value}>{label}</option>)}
       </select>
       {blank?<p style={{background:'#fff8e7',padding:12,borderRadius:9}}>
         <strong>Boştan öğrenme adımı:</strong> {BLANK_TIPS[cause]}
        </p>:<p><strong>Seçtiğin çeldiricinin gerekçesi:</strong> {item.misconception||'Önce işaretlediğin seçeneğin dayanağını metinde kontrol et.'}</p>}
      </div>
      <div style={{background:'#fff',borderRadius:11,padding:15,marginTop:12}}>
       <strong>3. Soru türüne özel çözüm adımları</strong>
       <ol style={{paddingLeft:21,margin:'8px 0'}}>
        {exercise.lessonSteps.map((s,i)=><li key={i} style={{marginBottom:6}}>{s}</li>)}
       </ol>
       <p><strong>Doğru cevabın kanıtı:</strong> {item.rightEvidence||'Ayrıntılı çözümde metin kanıtını incele.'}</p>
       {item.solutionUrl?<a href={item.solutionUrl} style={{fontWeight:800,color:'#07599e'}}>
        {item.number}. sorunun tam A–E çözümünü aç →</a>:null}
      </div>
      <div style={{marginTop:14}}>
       <strong>4. Kendine sor — gerçekten anladın mı?</strong>
       <p style={{margin:'5px 0 12px'}}>{exercise.selfCheck}</p>
       <label htmlFor={'paragraf-reflection-'+num} style={{display:'block',fontWeight:700,fontSize:13,marginBottom:5}}>
        Kendi gerekçeni yaz (isteğe bağlı, en fazla 350 karakter)
       </label>
       <textarea id={'paragraf-reflection-'+num} value={reflections[num]||''}
        maxLength={350} rows={3} onChange={e=>setReflections(prev=>({...prev,[num]:e.target.value}))}
        placeholder="Örneğin: 'Bu şıkkı eledim çünkü paragrafta ... ifadesi var.'"
        style={{width:'100%',padding:12,fontFamily:'inherit',fontSize:14,border:'1px solid #9eb2c4',
         borderRadius:9,boxSizing:'border-box',resize:'vertical'}} />
      </div>
      <div style={{marginTop:14,padding:12,background:'#eaf3fb',borderRadius:9}}>
       <strong>5. Yeni soru ve aralıklı tekrar</strong>
       <p style={{margin:'5px 0'}}>{exercise.transferTask}</p>
       <p style={{margin:'5px 0'}}>Hesabına kaydedersen sorunun <strong>0, 1, 3, 7, 14 ve 28. gün</strong> tekrarları kişisel kuyrukta takip edilir. Bir açıklamayı okumak veya öz değerlendirme yazmak tekrar aşamasını otomatik ilerletmez.</p>
      </div>
     </div>
    </details>;
   })}
  </div>
  <div style={{marginTop:20,padding:16,borderRadius:12,background:'#fbf3e0'}}>
   <strong>Tekrar hesabına kaydet</strong>
   <p>Giriş yaptığında yalnız yanlış ve boş sorular tekrar kuyruğuna alınır. Yanlış nedenlerin ve yazdığın kısa açıklamalar öğrenci hesabında saklanır; doğru sorular eklenmez.</p>
   <button type="button" onClick={()=>void save()} disabled={saving||saved}
    style={{background:navy,color:'#fff',border:'2px solid '+gold,borderRadius:11,padding:'13px 17px',fontWeight:800,fontSize:15,cursor:saving||saved?'default':'pointer'}}>
    {saving?'Kaydediliyor…':saved?'Tekrar Kuyruğuna Kaydedildi':'Yanlış ve Boşları Tekrar Listeme Ekle'}
   </button>
   {status&&<p role="status" style={{fontWeight:700}}>{status} {status.startsWith('Giriş yaparak')?<a href="/giris">Öğrenci girişi →</a>:null}</p>}
   {saved&&<p><a href="/ogrenci" style={{fontWeight:800,color:'#07599e'}}>Öğrenci panelinde tekrarlarımı aç →</a></p>}
  </div>
  <p style={{fontSize:12,color:'#67798b',marginTop:12}}>QR ile paylaşılan optik sonucu herkes tarafından görüntülenebilir. Kişisel tekrar kaydı yalnız oturum açmış öğrenci hesabında ve açık onayınla tutulur.</p>
 </section>;
}
