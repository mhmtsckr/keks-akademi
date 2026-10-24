'use client';
import {useState} from 'react';

type Choice='A'|'B'|'C'|'D'|'E';
type PracticeQuestion={
 sourceQuestionNo:number;questionId:string;testNo:number;questionNo:number;
 topic:string;passage:string;stem:string;choices:Record<Choice,string>;readingGoal:string;
};
type PracticeResult={
 correct:boolean;correctAnswer:Choice;chosenReason:string;rightReason:string;
 lesson:string;learningCheck:string;countsAsMastery:boolean;recommendedNextStep:string;
};
const LETTERS:Choice[]=['A','B','C','D','E'];
export function IndependentTransferPractice({testNo,encoded,sourceQuestionNo,originalStatus,onGraded}:{
 testNo:number;encoded:string;sourceQuestionNo:number;originalStatus:string;
 onGraded?:(sourceQuestionNo:number,questionId:string,answer:Choice)=>void;
}){
 const [question,setQuestion]=useState<PracticeQuestion|null>(null);
 const [answer,setAnswer]=useState<Choice|null>(null);
 const [evidence,setEvidence]=useState('');
 const [result,setResult]=useState<PracticeResult|null>(null);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 async function start(){
  if(busy||question)return;
  setBusy(true);setMessage('');
  try{
   const params=new URLSearchParams({testNo:String(testNo),encoded,sourceQuestionNo:String(sourceQuestionNo)});
   const r=await fetch('/api/paragraf/transfer?'+params,{cache:'no-store'});
   const v=await r.json();
   if(!r.ok)throw new Error(v.error||'Yeni örnek bulunamadı.');
   setQuestion(v.question);
  }catch(e){setMessage(e instanceof Error?e.message:'Yeni soru açılamadı.');}
  finally{setBusy(false);}
 }
 async function submit(){
  if(busy||!question||!answer||evidence.trim().length<15||result)return;
  setBusy(true);setMessage('');
  try{
   const r=await fetch('/api/paragraf/transfer',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({testNo,encoded,sourceQuestionNo,questionId:question.questionId,answer})});
   const v=await r.json();
   if(!r.ok)throw new Error(v.error||'Bağımsız örnek değerlendirilemedi.');
   setResult(v.result);
   onGraded?.(sourceQuestionNo,question.questionId,answer);
  }catch(e){setMessage(e instanceof Error?e.message:'Değerlendirme yapılamadı.');}
  finally{setBusy(false);}
 }
 return <div style={{border:'1px solid #b0c7dd',borderRadius:12,marginTop:18,padding:16,background:'#f0f6fc'}}>
  <h3 style={{margin:'0 0 8px',fontSize:18}}>4. Yeni bir soruyla gerçekten öğrendim mi?</h3>
  <p style={{fontSize:14,lineHeight:1.65}}>İlk soruyu {originalStatus==='BOŞ'?'boş bıraktın':'yanlış cevapladın'}. Şimdi başka bir testten aynı soru türünde, <strong>cevabını önceden görmediğin farklı bir soruyu</strong> çöz. Bu adım ilk sorunun tekrarı değildir.</p>
  {!question&&<button type="button" onClick={()=>void start()} disabled={busy}
   style={{background:'#0b2c57',color:'#fff',border:'1px solid #c9a24e',borderRadius:9,padding:'12px 18px',fontWeight:800,cursor:'pointer'}}>
   {busy?'Yeni soru getiriliyor…':'Aynı Konudan Yeni Soru Çöz'}
  </button>}
  {question&&<>
   <p style={{fontWeight:800}}>Beceri: {question.topic}</p>
   <p style={{fontSize:13}}><strong>İpucu:</strong> {question.readingGoal}</p>
   <p style={{whiteSpace:'pre-wrap',lineHeight:1.75}}>{question.passage}</p>
   <p style={{fontWeight:800}}>{question.stem}</p>
   <div role="group" aria-label="Bağımsız transfer sorusu seçenekleri" style={{display:'grid',gap:8}}>
    {LETTERS.map(k=><button key={k} type="button" disabled={!!result||busy}
      aria-pressed={answer===k} onClick={()=>setAnswer(k)}
      style={{textAlign:'left',background:answer===k?'#ddecfd':'#fff',color:'#0b2c57',
       border:answer===k?'2px solid #0b2c57':'1px solid #c7d7e6',
       borderRadius:8,padding:'11px 12px',fontSize:14.5,cursor:'pointer'}}>
      <strong>{k})</strong> {question.choices[k]}
    </button>)}
   </div>
   {!result&&<>
    <label htmlFor={'transfer-evidence-'+sourceQuestionNo} style={{display:'block',fontWeight:800,margin:'14px 0 6px'}}>Metindeki kanıtın ne? (En az 15 karakter)</label>
    <textarea id={'transfer-evidence-'+sourceQuestionNo} value={evidence}
     onChange={e=>setEvidence(e.target.value)} maxLength={500} rows={3}
     placeholder="Bu şıkkı seçtim çünkü paragrafta…"
     style={{width:'100%',boxSizing:'border-box',padding:10,border:'1px solid #9ab0c5',borderRadius:8}}/>
    <button type="button" onClick={()=>void submit()}
     disabled={!answer||evidence.trim().length<15||busy}
     style={{background:'#0b2c57',color:'#fff',borderRadius:9,border:'2px solid #d6a93c',
      padding:'12px 18px',fontWeight:800,marginTop:8,cursor:'pointer'}}>
     {busy?'Değerlendiriliyor…':'Kanıtımı ve Yeni Cevabımı Kontrol Et'}
    </button>
   </>}
   {result&&<div role="status" style={{background:result.correct?'#e7f6ea':'#fff1e9',marginTop:14,padding:14,borderRadius:9,lineHeight:1.65}}>
    <strong>{result.correct?'Farklı soruyu doğru çözdün.':'Farklı soruda yeniden çalışılması gereken nokta var.'}</strong>
    <p><strong>Doğru cevap:</strong> {result.correctAnswer}) {question.choices[result.correctAnswer]}</p>
    <p><strong>Senin şıkkının gerekçesi:</strong> {result.chosenReason}</p>
    {!result.correct&&<p><strong>Doğru seçeneğin metinsel kanıtı:</strong> {result.rightReason}</p>}
    <p><strong>Konuyu hatırla:</strong> {result.lesson}</p>
    <p><strong>Öğrendim mi?</strong> {result.learningCheck}</p>
    <p><strong>Sıradaki adım:</strong> {result.recommendedNextStep}</p>
    <p style={{fontSize:12}}>Bu uygulama bağımsız örnek çözümüdür; tek denemeyle kalıcı kazanım onayı verilmez. Öğrenci hesabında tekrar kaydı için aşağıdaki kaydetme düğmesini kullan.</p>
   </div>}
  </>}
  {message&&<p role="alert" style={{color:'#a5342b',fontWeight:700}}>{message}</p>}
 </div>;
}
