'use client';

import {useEffect,useState} from 'react';

type Review={
  id:string;questionId:string;status:string;stepIndex:number;
  dueAt:string;isDue:boolean;
  question:{prompt:string;topic:string;testNo:number|null;questionNo:number|null;
    pageInTest:number|null}
};
type ReviewSnapshot={items:Review[];ok:boolean;error?:string};
type Result={correct:boolean;correctAnswer:string;completed:boolean;
  nextIntervalDays:number|null;nextDueAt:string|null;intervalReason?:string};

export function ParagrafPrintedReviews(){
  const [rows,setRows]=useState<Review[]>([]);
  const [answers,setAnswers]=useState<Record<string,string>>({});
  const [busy,setBusy]=useState<string|null>(null);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const [result,setResult]=useState<Result|null>(null);
  const [loading,setLoading]=useState(true);
  async function refresh(){
    const response=await fetch('/api/student/paragraf/reviews',{
      credentials:'same-origin',cache:'no-store'
    });
    const json:ReviewSnapshot=await response.json();
    if(!response.ok)throw new Error(json.error||'Tekrarlar yüklenemedi.');
    setRows(json.items);
  }
  useEffect(()=>{
    let active=true;
    (async()=>{
      try{
        const response=await fetch('/api/student/paragraf/reviews',{
          credentials:'same-origin',cache:'no-store'
        });
        const json:ReviewSnapshot=await response.json();
        if(!response.ok)throw new Error(json.error||'Tekrarlar yüklenemedi.');
        if(active)setRows(json.items);
      }catch(e){if(active)setError((e as Error).message);}
      finally{if(active)setLoading(false);}
    })();
    return ()=>{active=false};
  },[]);
  async function submit(row:Review){
    const answer=answers[row.id];
    if(!answer||busy||!row.isDue)return;
    setBusy(row.id);setError('');setMessage('');setResult(null);
    try{
      const response=await fetch('/api/student/reviews',{
        method:'POST',headers:{'Content-Type':'application/json'},
        credentials:'same-origin',
        body:JSON.stringify({id:row.id,answer})
      });
      const json=await response.json();
      if(!response.ok)throw new Error(json.error||'Tekrar kaydedilemedi.');
      setResult(json as Result);
      setMessage('Test '+row.question.testNo+' · Soru '+row.question.questionNo+
        ' · '+(json.correct?'Doğru':'Yanlış')+'.');
      setAnswers(v=>({...v,[row.id]:''}));
      await refresh();
    }catch(e){setError((e as Error).message);}
    finally{setBusy(null);}
  }
  const due=rows.filter(x=>x.isDue);
  const pending=rows.filter(x=>!x.isDue);
  return <div>
    {loading&&<p>Tekrar kayıtları yükleniyor…</p>}
    {error&&<p role="alert" style={{color:'#a02929'}}>{error}</p>}
    {message&&<div role="status" style={{borderRadius:10,background:'#ecf4ed',padding:12,marginTop:12}}>
      <strong>{message}</strong>
      {result&&<p>Doğru cevap: {result.correctAnswer}.{' '}
        {result.completed?'Tekrar döngüsü tamamlandı.':
         'Sonraki tekrar: '+(result.nextIntervalDays??0)+' gün sonra.'}{' '}
        {result.intervalReason||''}</p>}
    </div>}
    {!loading&&rows.length===0&&<p>Aktif paragraf tekrarın bulunmuyor.
      Kitaptaki bir sayfanın cevap formunu tamamladığında yanlışlar buraya eklenir.</p>}
    <h2 style={{fontSize:20}}>Bugün tekrar edilecek sorular ({due.length})</h2>
    {due.map(row=><article key={row.id} style={{border:'1px solid #d1ded6',borderRadius:12,
      padding:16,margin:'12px 0'}}>
      <strong>Test {row.question.testNo} · Soru {row.question.questionNo}</strong>
      <p style={{margin:'8px 0'}}>{row.question.topic} · Basılı kitap sayfa {row.question.pageInTest}</p>
      <p style={{fontSize:13,color:'#66796c'}}>{row.question.prompt}</p>
      <fieldset style={{border:0,padding:0,margin:0}}>
        <legend>Kitaptaki soruyu yeniden çöz ve yanıtını seç:</legend>
        <div style={{display:'flex',gap:13,margin:'10px 0',flexWrap:'wrap'}}>
          {(['A','B','C','D','E'] as const).map(letter=><label key={letter}>
            <input type="radio" name={'review-'+row.id} value={letter}
              checked={answers[row.id]===letter}
              onChange={()=>setAnswers(s=>({...s,[row.id]:letter}))}/>{' '+letter}
          </label>)}
        </div>
      </fieldset>
      <button type="button" disabled={busy!==null||!answers[row.id]}
        onClick={()=>void submit(row)}
        style={{border:0,borderRadius:9,background:'#1d6950',color:'white',padding:'10px 16px'}}>
        {busy===row.id?'Kaydediliyor…':'Tekrarı değerlendir'}
      </button>
    </article>)}
    {pending.length>0&&<section>
      <h2 style={{fontSize:20,marginTop:24}}>Gelecek tekrarlar ({pending.length})</h2>
      {pending.map(row=><p key={row.id}>
        Test {row.question.testNo} · Soru {row.question.questionNo} ·{' '}
        {new Date(row.dueAt).toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Istanbul'})}
      </p>)}
    </section>}
  </div>;
}
