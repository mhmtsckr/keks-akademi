'use client';
import {useState} from 'react';
import {IndependentTransferPractice} from './IndependentTransferPractice';
import {FollowupIndependentPractice} from './FollowupIndependentPractice';
import {opticalReasonAction} from '@/lib/paragrafLearningPlaybook';

type Choice='A'|'B'|'C'|'D'|'E';
type TopicIssue={
 number:number;topic:string;status:string;marked:string;correct:string;
 lesson:string;misconception:string|null;rightEvidence:string|null;
 firstAction:string;secondAction:string;thirdAction:string;
 questionStem:string;passage:string;choices:Record<Choice,string>;
 readingGuide:{skill:string;focus:string;hints:[string,string,string];selfCheck:string}
};
type Priority={topic:string;wrong:number;blank:number;priority:number;questionNos:number[]};
const LETTERS:Choice[]=['A','B','C','D','E'];
const REASONS=[
 ['BELIRLENMEDI','Henüz belirleyemedim'],
 ['SORU_KOKU','Soru kökünü yanlış okudum'],
 ['BILGI_EKSIKLIGI','Konuyu yeterince bilmiyorum'],
 ['YONTEM_BILMEME','Hangi yöntemi uygulayacağımı bilemedim'],
 ['KARARSIZLIK','İki seçenek arasında kararsız kaldım'],
 ['DIKKAT','Dikkat / işaretleme hatası yaptım'],
 ['SURE','Süreyi yetiştiremedim'],
 ['UNUTMA','Yöntemi öğrendim ama unuttum']
] as const;
const base='#0b2c57',gold='#d6a93c';

export function RecoveryActions({testNo,encoded,missed,priorities}:{
 testNo:number;encoded:string;missed:TopicIssue[];priorities:Priority[]
}){
 const [reasons,setReasons]=useState<Record<string,string>>({});
 const [trials,setTrials]=useState<Record<string,Choice>>({});
 const [checked,setChecked]=useState<Record<string,boolean>>({});
 const [transferChecks,setTransferChecks]=useState<Record<string,{questionId:string;answer:Choice;evidence:string}>>({});
 const [status,setStatus]=useState('');
 const [saving,setSaving]=useState(false);
 const [saved,setSaved]=useState(false);
 async function importWrong(){
  if(saving)return;
  setSaving(true);setStatus('');
  try{
   const selected=Object.fromEntries(Object.entries(reasons).filter(([,v])=>v!=='BELIRLENMEDI'));
   const rechecks=Object.fromEntries(
    Object.entries(trials).filter(([number])=>checked[number])
   );
   const response=await fetch('/api/student/paragraf/optik/recover',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({testNo,encoded,reasons:selected,rechecks,transferChecks})
   });
   const data=await response.json();
   if(!response.ok){
    if(response.status===401||response.status===403)
      throw new Error('Kişisel tekrar ve farklı soru çalışma kayıtları için öğrenci hesabınla giriş yapmalısın. <giriş>');
    throw new Error(data.error||'Tekrar listesi oluşturulamadı.');
   }
   setSaved(true);
   setStatus(data.alreadySaved
    ?'Bu testin ilk gönderimi zaten kaydedilmiş; tekrar takvimi değiştirilmedi.'
    :data.reviewLinked+' yanlış/boş soru kişisel tekrar listene eklendi. İlk tekrar bugüne planlandı.');
  }catch(e){
   setStatus(e instanceof Error?e.message:'İşlem başarısız.');
  }finally{setSaving(false);}
 }
 if(!missed.length)return <section style={{background:'#e9f7e9',border:'1px solid #a6d5af',borderRadius:14,padding:20,marginTop:20}}>
  <h2>Yanlış ve boştan öğrenme</h2>
  <p>Bu testte yanlışın veya boşun yok. Ancak kalıcılık, daha sonraki bir günde farklı sorularla yeniden ölçülmelidir.</p>
 </section>;
 return <section style={{background:'#fff',border:'2px solid '+gold,borderRadius:16,padding:'clamp(14px,4vw,24px)',marginTop:20,color:base}}>
  <h2 style={{marginTop:0}}>MİZA · Yanlış ve Boştan Öğrenme</h2>
  <p style={{lineHeight:1.65}}>Her soruda önce <strong>soru türünü</strong> ve hata nedenini incele, sonra doğru cevabı tekrar görmeden yeniden dene. Cevabını kontrol ettikten sonra doğru ve yanlış şıkların metinsel gerekçelerini öğren. Boş sorular yanlışlardan ayrı değerlendirilir.</p>
  {priorities.length>0&&<aside style={{padding:14,borderRadius:11,background:'#eef3fa',margin:'15px 0'}}>
   <strong>Öncelikli çalışılacak beceriler</strong>
   <div style={{display:'grid',gap:7,marginTop:10}}>
    {priorities.slice(0,5).map((t,i)=><div key={t.topic} style={{display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}>
     <span>{i+1}. <strong>{t.topic}</strong></span>
     <span style={{fontSize:13}}>{t.wrong} yanlış · {t.blank} boş · {t.questionNos.join(', ')}. sorular</span>
    </div>)}
   </div>
  </aside>}
  <div style={{display:'grid',gap:12}}>
   {missed.map(item=>{
    const id=String(item.number),trial=trials[id],revealed=Boolean(checked[id]);
    const statusText=item.status==='BOŞ'?'Boş bırakılan':'Yanlış yapılan';
    const selectedReason=reasons[id]&&reasons[id]!=='BELIRLENMEDI'?reasons[id]:null;
    const reasonAction=opticalReasonAction(selectedReason,item.status==='BOŞ');
    return <details key={id} style={{background:'#f8fafc',padding:15,border:'1px solid #dbe2eb',borderRadius:12}}>
     <summary style={{cursor:'pointer',fontWeight:800,lineHeight:1.6}}>
      {item.number}. soru · {item.topic} · {statusText} — Adım adım tekrar dene
     </summary>
     <div style={{lineHeight:1.7,marginTop:12}}>
      <p style={{margin:'5px 0 10px'}}><strong>1. Soru türünü anla:</strong> {item.readingGuide.focus}</p>
      <label htmlFor={'reason-'+id} style={{fontWeight:700,display:'block',margin:'12px 0 5px'}}>
       {item.status==='BOŞ'?'Soruyu neden boş bıraktın?':'Yanlışının olası nedeni ne?'}
      </label>
      <select id={'reason-'+id} value={reasons[id]||'BELIRLENMEDI'} disabled={saved}
       onChange={e=>setReasons(prev=>({...prev,[id]:e.target.value}))}
       style={{width:'100%',maxWidth:520,padding:12,borderRadius:8,border:'1px solid #98aec1',background:'#fff',color:base}}>
       {REASONS.map(([key,name])=><option key={key} value={key}>{name}</option>)}
      </select>
      <p style={{fontSize:13,color:'#536880'}}>Bu neden senin öz değerlendirmen; sistem kesin neden olarak tahmin etmez.</p>
      <p style={{background:'#fff8e9',borderLeft:'3px solid '+gold,padding:12,borderRadius:6}}><strong>Seçtiğin nedene göre müdahale:</strong> {reasonAction}</p>
      <div style={{background:'#eaf1fa',padding:14,borderRadius:9}}>
       <strong>2. İpucu: Cevabı görmeden düşün</strong>
       <ol style={{paddingLeft:22}}>
        {item.readingGuide.hints.map((hint,i)=><li key={i}>{hint}</li>)}
       </ol>
       <p style={{marginBottom:0}}><strong>Kendine sor:</strong> {item.readingGuide.selfCheck}</p>
      </div>
      <div style={{marginTop:15}}>
       <strong>3. Soruyu yeniden çöz</strong>
       <p style={{whiteSpace:'pre-wrap',fontSize:14.5}}>{item.passage}</p>
       <p style={{fontWeight:800}}>{item.questionStem}</p>
       <div role="group" aria-label={item.number+'. sorunun tekrar cevabı'} style={{display:'grid',gap:8}}>
        {LETTERS.map(letter=><button key={letter} type="button" disabled={saved||revealed}
         onClick={()=>setTrials(old=>({...old,[id]:letter}))}
         aria-pressed={trial===letter}
         style={{cursor:'pointer',textAlign:'left',color:base,fontSize:14.5,
          background:trial===letter?'#e7f1ff':'#fff',border:trial===letter?'2px solid '+base:'1px solid #c9d5e2',
          borderRadius:8,padding:'11px 12px'}}>
          <strong>{letter})</strong> {item.choices[letter]}
         </button>)}
       </div>
       {!revealed&&<button type="button" disabled={!trial||saved} onClick={()=>setChecked(v=>({...v,[id]:true}))}
        style={{background:base,color:'#fff',border:'2px solid '+gold,borderRadius:9,
         padding:'11px 18px',marginTop:11,fontWeight:800,cursor:trial?'pointer':'not-allowed'}}>
        İkinci Yanıtımı Kontrol Et
       </button>}
      </div>
      {revealed&&<div role="status" style={{marginTop:15,padding:14,background:trial===item.correct?'#edf8ef':'#fff3ed',borderRadius:10}}>
       <strong>{trial===item.correct?'İkinci denemede doğru.':'İkinci denemede henüz doğru değil.'}</strong>
       <p><strong>Doğru cevap:</strong> {item.correct}. {item.choices[item.correct as Choice]}</p>
       {trial!==item.correct&&<p><strong>Seçtiğin şık neden elenir?</strong> {item.misconception&&trial===item.marked?item.misconception:'Bu seçeneğin dayanağını metindeki ana sav, örnek ve sınırla karşılaştır.'}</p>}
       <p><strong>Doğru cevabın kanıtı:</strong> {item.rightEvidence||'Ayrıntılı çözümde metinsel dayanağı incele.'}</p>
       <p><strong>Kısa ders:</strong> {item.lesson}</p>
       <p><strong>Uygula:</strong> {reasonAction} {item.secondAction}</p>
       <p><strong>Sonraki adım:</strong> {item.thirdAction}</p>
       <p style={{fontSize:12}}>Bu, aynı sorunun yönlendirmeli ikinci çözümüdür. Tek başına kalıcı kazanım kanıtı değildir.</p>
      </div>}
      {revealed&&<IndependentTransferPractice testNo={testNo} encoded={encoded}
       sourceQuestionNo={item.number} originalStatus={item.status}
       onGraded={(no,questionId,answer,evidence)=>setTransferChecks(prev=>({...prev,[String(no)]:{questionId,answer,evidence}}))}/>}
     </div>
    </details>;
   })}
  </div>
  <div style={{background:'#f8f3e7',padding:16,borderRadius:12,marginTop:20}}>
   <strong>0–1–3–7–14–28 gün tekrar sistemi</strong>
   <p style={{margin:'8px 0 0'}}>Öğrenci hesabıyla kaydedilen yanlış ve boş sorular ilk olarak 0. gün tekrar kuyruğuna eklenir. İlerleme ancak <strong>sonraki bağımsız tekrar sonuçlarına</strong> göre belirlenir; yönlendirmeyle doğru cevabı bulmak otomatik olarak öğrenildi sayılmaz.</p>
  </div>
  <button onClick={()=>void importWrong()} disabled={saving||saved} type="button"
   style={{background:base,border:'2px solid '+gold,color:'#fff',borderRadius:12,padding:'14px 22px',fontSize:16,fontWeight:800,cursor:saved?'default':'pointer',marginTop:16}}>
   {saving?'Kaydediliyor…':saved?'Tekrar Listeme Eklendi':'Yanlış ve Boş Sorularımı Tekrar Listeme Ekle'}
  </button>
  {status&&<p role="status" style={{fontWeight:700}}>{status.includes('<giriş>')?<>{status.replace(' <giriş>','')} <a href="/giris">Öğrenci girişi</a></>:status}</p>}
  {saved&&<p><a href="/ogrenci" style={{color:'#074f9c',fontWeight:800}}>Öğrenci panelinde tekrar görevlerimi aç →</a></p>}
  <details style={{marginTop:16,padding:14,border:'1px solid #d1dbe8',borderRadius:10,background:'#eef4fd'}}>
   <summary style={{cursor:'pointer',fontWeight:800}}>İlk optikten sonra farklı günlerde yeni soruyla öğrendiklerimi ölç</summary>
   <p style={{fontSize:13}}>Bu alıştırmalar öğrencinin hesabına ayrı ayrı kaydedilir. İlk optik sonucu daha önce aktarmış olman gerekir. Tekrar kuyruğunun mevcut ilerlemesi değişmez.</p>
   {missed.map(x=><details key={x.number} style={{marginTop:9,padding:10,background:'#fff',borderRadius:8}}>
    <summary style={{fontWeight:700,cursor:'pointer'}}>{x.number}. soru · {x.topic} · {x.status==='BOŞ'?'Boş':'Yanlış'}</summary>
    <FollowupIndependentPractice testNo={testNo} sourceQuestionNo={x.number} topic={x.topic}/>
   </details>)}
  </details>
  <p style={{fontSize:12,color:'#63748a',marginTop:16}}>Yeniden deneme sonucu öğrenme seviyesi olarak kullanılmaz. QR ile paylaşılan eski sonuç bağlantısı öğrenci hesabına kendiliğinden kaydedilmez.</p>
 </section>;
}
