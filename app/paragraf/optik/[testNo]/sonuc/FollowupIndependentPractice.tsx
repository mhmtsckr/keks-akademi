'use client';
import {useState} from 'react';

type Choice='A'|'B'|'C'|'D'|'E';
type Question={
 sourceQuestionNo:number;questionId:string;topic:string;passage:string;stem:string;
 choices:Record<Choice,string>;readingGoal:string;
};
type Outcome={correct:boolean;correctAnswer:Choice;chosenReason:string;rightReason:string;
 lesson:string;learningCheck:string;recommendedNextStep:string};
const CHOICES:Choice[]=['A','B','C','D','E'];
const field={width:'100%',padding:10,border:'1px solid #9aabbc',borderRadius:8,boxSizing:'border-box' as const};

export function FollowupIndependentPractice({testNo,sourceQuestionNo,topic}:{
 testNo:number;sourceQuestionNo:number;topic:string
}){
 const [question,setQuestion]=useState<Question|null>(null);
 const [answer,setAnswer]=useState<Choice|null>(null);
 const [evidence,setEvidence]=useState('');
 const [outcome,setOutcome]=useState<Outcome|null>(null);
 const [stage,setStage]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 async function load(){
  if(busy)return;
  setBusy(true);setError('');setAnswer(null);setEvidence('');setOutcome(null);setStage('');setQuestion(null);
  try{
   const p=new URLSearchParams({testNo:String(testNo),sourceQuestionNo:String(sourceQuestionNo)});
   const response=await fetch('/api/student/paragraf/transfer-followup?'+p,{cache:'no-store'});
   const data=await response.json();
   if(!response.ok)throw new Error(data.error||'Yeni soru açılamadı.');
   setQuestion(data.question);
  }catch(e){setError(e instanceof Error?e.message:'Yeni soru açılamadı.');}
  finally{setBusy(false);}
 }
 async function submit(){
  if(!question||!answer||outcome||busy||evidence.trim().length<15)return;
  setBusy(true);setError('');
  try{
   const response=await fetch('/api/student/paragraf/transfer-followup',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
     testNo,sourceQuestionNo,questionId:question.questionId,answer,evidence:evidence.trim()
    })
   });
   const data=await response.json();
   if(!response.ok)throw new Error(data.error||'Yanıt kaydedilemedi.');
   setOutcome(data.result);setStage(data.stage);
  }catch(e){setError(e instanceof Error?e.message:'Yanıt kaydedilemedi.');}
  finally{setBusy(false);}
 }
 return <section style={{border:'1px solid #bed0e5',borderRadius:12,padding:16,background:'#f6f9ff',marginTop:12}}>
  <h3 style={{margin:'0 0 8px'}}>Sonraki bağımsız çalışma · {topic}</h3>
  <p style={{fontSize:14,lineHeight:1.6}}>
   İlk optik sonucu öğrenci hesabına kaydettikten sonra başka testten <strong>önceden kullanmadığın yeni bir paragraf</strong> çöz.
   Çalışma ayrı bir öğrenme olayı olarak kaydedilir; önceki cevapların ve tekrar tarihlerinin üzerine yazılmaz.
  </p>
  {!question&&<button type="button" disabled={busy} onClick={()=>void load()}
   style={{background:'#103660',border:0,borderRadius:9,color:'#fff',padding:'10px 14px',fontWeight:700}}>
    {busy?'Sorular kontrol ediliyor…':'Yeni bağımsız soruyu aç'}
   </button>}
  {question&&<>
   <p style={{fontWeight:700}}>Odak: {question.readingGoal}</p>
   <p style={{whiteSpace:'pre-wrap',lineHeight:1.75}}>{question.passage}</p>
   <p style={{fontWeight:800}}>{question.stem}</p>
   <div role="group" aria-label="Yeni paragraf seçenekleri" style={{display:'grid',gap:7}}>
    {CHOICES.map(c=><button key={c} type="button" onClick={()=>setAnswer(c)}
     disabled={busy||!!outcome} aria-pressed={answer===c}
     style={{...field,textAlign:'left',cursor:'pointer',color:'#102d55',
      border:answer===c?'2px solid #0e5086':'1px solid #cad8e6',background:answer===c?'#e3efff':'#fff'}}>
     <strong>{c})</strong> {question.choices[c]}
    </button>)}
   </div>
   {!outcome&&<>
    <label htmlFor={'followup-'+testNo+'-'+sourceQuestionNo}
     style={{display:'block',fontWeight:700,marginTop:12}}>Seçiminin metindeki gerekçesi (15–500 karakter)</label>
    <textarea id={'followup-'+testNo+'-'+sourceQuestionNo} value={evidence}
     onChange={e=>setEvidence(e.target.value)} rows={3} maxLength={500}
     placeholder="Metindeki şu ifade ve ana düşünce nedeniyle..." style={{...field,marginTop:7}}/>
    <button type="button" disabled={busy||!answer||evidence.trim().length<15} onClick={()=>void submit()}
     style={{background:'#103660',color:'#fff',borderRadius:8,padding:'12px 18px',fontWeight:800,marginTop:8,border:0}}>
     {busy?'Kaydediliyor…':'Yanıtımı kaydet ve kontrol et'}
    </button>
   </>}
   {outcome&&<div role="status" style={{marginTop:12,padding:12,background:outcome.correct?'#eaf7ef':'#fff1e6',borderRadius:8}}>
    <strong>{outcome.correct?'Yeni soruyu doğru çözdün.':'Yeni soruda çalışma ihtiyacı var.'}</strong>
    <p><strong>Çalışma türü:</strong> {stage==='DELAYED_DIFFERENT_QUESTION'?'İlk testten en az 24 saat sonra farklı soruyla değerlendirme':'İlk 24 saatte farklı soruyla uygulama'}</p>
    <p><strong>Doğru cevap:</strong> {outcome.correctAnswer}) {question.choices[outcome.correctAnswer]}</p>
    <p><strong>Seçiminin değerlendirmesi:</strong> {outcome.chosenReason}</p>
    <p><strong>Doğru seçeneğin dayanağı:</strong> {outcome.rightReason}</p>
    <p><strong>Kısa ders:</strong> {outcome.lesson}</p>
    <p><strong>Sonraki adım:</strong> {outcome.recommendedNextStep}</p>
    <p style={{fontSize:12}}>Gerekçen öğrenci öz bildirimidir. Bu sonuç kalıcı hâkimiyet veya koç müdahalesinin nedensel etkisi olarak değerlendirilmez.</p>
   </div>}
   {outcome&&<button type="button" onClick={()=>void load()} disabled={busy}
    style={{marginTop:12,padding:10,borderRadius:8,border:'1px solid #103660',background:'#fff',color:'#103660',fontWeight:700}}>
    Başka bir özgün soru çöz
   </button>}
  </>}
  {error&&<p role="alert" style={{color:'#b32727'}}>{error}
   {error.includes('Önce bu testin')?<span> Yukarıdaki “Yanlış ve Boş Sorularımı Tekrar Listeme Ekle” işlemini öğrenci hesabından yap.</span>:null}
   {error.includes('oturum')||error.includes('giriş')?<a href="/giris"> Öğrenci hesabına giriş yap</a>:null}
  </p>}
 </section>;
}
