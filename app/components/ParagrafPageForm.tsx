'use client';

import {useEffect,useState} from 'react';

type Choice='A'|'B'|'C'|'D'|'E'|null;
type Question={id:string;questionNo:number;topic:string};
type GradeItem={id:string;questionNo:number;topic:string;answer:Choice;
  correctAnswer:string;status:'CORRECT'|'WRONG'|'BLANK'};
type Attempt={pageCode:string;testNo:number;pageInTest:number;
  submittedAt:string;correct:number;wrong:number;blank:number;net:number;
  items:GradeItem[];wrongTopics:string[];reviewRecommendation:
  {days:number[];note:string}|null};
type PageData={ok:boolean;page:{code:string;testNo:number;pageInTest:number};
  questions:Question[];attempt:Attempt|null;error?:string};

export function ParagrafPageForm({pageNo}:{pageNo:string}){
  const [data,setData]=useState<PageData|null>(null);
  const [answers,setAnswers]=useState<Record<string,Choice>>({});
  const [attempt,setAttempt]=useState<Attempt|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const endpoint='/api/student/paragraf/pages/'+pageNo;
  useEffect(()=>{
    let active=true;
    (async()=>{
      try{
        const r=await fetch(endpoint,{cache:'no-store',credentials:'same-origin'});
        const j=await r.json();
        if(!r.ok)throw new Error(j.error||'Sayfa yüklenemedi.');
        if(active){setData(j);setAttempt(j.attempt||null);}
      }catch(e){if(active)setError((e as Error).message);}
    })();
    return ()=>{active=false;};
  },[endpoint]);
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!data||attempt||busy)return;
    setBusy(true);setError('');
    try{
      const complete=Object.fromEntries(data.questions.map(q=>
        [String(q.questionNo),answers[String(q.questionNo)]??null]));
      const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({answers:complete}),credentials:'same-origin'});
      const j=await r.json();
      if(!r.ok)throw new Error(j.error||'Cevaplar kaydedilemedi.');
      setAttempt(j.attempt as Attempt);
    }catch(e){setError((e as Error).message);}
    finally{setBusy(false);}
  }
  if(error&&!data)return <p role="alert" style={{color:'#a03535'}}>{error}</p>;
  if(!data)return <p>Sayfa yükleniyor…</p>;
  const nextCode=String(Number(pageNo)+1).padStart(3,'0');
  return <div>
    {attempt
      ? <section aria-live="polite">
          <h2 style={{fontSize:21}}>Cevaplarınız kaydedildi</h2>
          <p><strong>{attempt.correct} doğru · {attempt.wrong} yanlış · {attempt.blank} boş · {attempt.net} net</strong></p>
          <p>Bu sayfa bir kez puanlanır. Yanıtlarınız öğrenci performans kaydınıza işlendi.</p>
          <div style={{display:'grid',gap:12}}>
            {attempt.items.map(q=><article key={q.id} style={{padding:15,border:'1px solid #d5e3d9',borderRadius:10}}>
              <strong>Soru {q.questionNo} · {q.topic}</strong>
              <p>Yanıtınız: {q.answer||'Boş'} · Doğru: {q.correctAnswer} ·
                {' '}{q.status==='CORRECT'?'Doğru':q.status==='WRONG'?'Yanlış':'Boş'}</p>
              <p style={{fontSize:13,color:'#596c60',marginBottom:0}}>
                Ayrıntılı çözüm: ayrı KEKS 1.500 Soru Çözüm PDF'si,
                Test {attempt.testNo}, Soru {q.questionNo}. Basılı soru QR'ı kısa çözüm verir.
              </p>
            </article>)}
          </div>
          {attempt.reviewRecommendation&&<div style={{marginTop:18,padding:15,background:'#f0f5ef',borderRadius:10}}>
            <strong>Geliştirilmesi gereken beceriler: </strong>
            {attempt.wrongTopics.join(', ')}.
            <p>Önerilen tekrar günleri: {attempt.reviewRecommendation.days.join('–')}. Bu, henüz otomatik tekrar görevi değildir.</p>
          </div>}
          {Number(pageNo)<400&&<p><a href={'/paragraf/sayfa/'+nextCode}>Sonraki basılı sayfaya geç →</a></p>}
        </section>
      : <form onSubmit={submit}>
          <p>Kitaptaki soruları çözdükten sonra cevaplarınızı işaretleyin. Cevapsız sorular otomatik olarak boş sayılır.</p>
          {data.questions.map(q=><fieldset key={q.id} style={{border:'1px solid #d9e5da',
            borderRadius:12,padding:15,margin:'16px 0'}}>
            <legend style={{fontWeight:700}}>Soru {q.questionNo} · {q.topic}</legend>
            <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:8}}>
              {(['A','B','C','D','E'] as const).map(value=>
                <label key={value} style={{display:'flex',alignItems:'center',gap:5,padding:7}}>
                  <input type="radio" name={'q'+q.questionNo} value={value}
                    checked={answers[String(q.questionNo)]===value}
                    onChange={()=>setAnswers(prev=>({...prev,[String(q.questionNo)]:value}))}/>
                  {value}
                </label>)}
              <label style={{display:'flex',alignItems:'center',gap:5,padding:7}}>
                <input type="radio" name={'q'+q.questionNo} value="BLANK"
                  checked={answers[String(q.questionNo)]==null}
                  onChange={()=>setAnswers(prev=>({...prev,[String(q.questionNo)]:null}))}/>
                Boş
              </label>
            </div>
          </fieldset>)}
          {error&&<p role="alert" style={{color:'#a03535'}}>{error}</p>}
          <button type="submit" disabled={busy} style={{background:'#176648',color:'white',
            border:0,borderRadius:10,padding:'14px 24px',fontWeight:700,cursor:'pointer'}}>
            {busy?'Kaydediliyor…':'Cevapları kaydet ve analiz et'}
          </button>
          <p style={{fontSize:12,color:'#777'}}>Gönderimden sonra aynı sayfanın puanı değiştirilemez.</p>
        </form>}
  </div>;
}
