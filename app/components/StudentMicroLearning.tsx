'use client';
import { useCallback,useEffect,useRef,useState } from 'react';
import type { MicroKind,MicroPack } from '@/lib/microLearning';
type Task=Omit<MicroPack,'items'>&{reason:string};
type Pack=Omit<MicroPack,'items'>&{items:Array<{id:string;prompt:string;options?:string[]}>};
type Session={sessionId:string;reviewId:string|null;imageUrl:string|null;startedAt:string;pack:Pack};
type Result={correct:number;wrong:number;blank:number;total:number;items:Array<{id:string;prompt:string;answer:string;correctAnswer:string;explanation:string;correct:boolean;blank:boolean}>;next?:string};
type Summary={today:number;sessions:number;minutes:number;correct:number;wrong:number;blank:number};
export function StudentMicroLearning(){
  const [data,setData]=useState<{tasks:Task[];summary:Summary}|null>(null);
  const [minutes,setMinutes]=useState(5),[session,setSession]=useState<Session|null>(null);
  const [answers,setAnswers]=useState<Record<string,string>>({}),[result,setResult]=useState<Result|null>(null);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[seconds,setSeconds]=useState(0);
  const lock=useRef(false);
  const load=useCallback(async()=>{try{const r=await fetch('/api/student/micro-learning');const j=await r.json();if(!r.ok)throw new Error(j.error||'Görevler yüklenemedi.');setData(j)}catch(e){setError(e instanceof Error?e.message:'Bağlantı kurulamadı.')}},[]);
  useEffect(()=>{void load()},[load]);
  useEffect(()=>{if(!session||result)return;const tick=()=>setSeconds(Math.max(0,Math.floor((Date.now()-new Date(session.startedAt).getTime())/1000)));tick();const id=setInterval(tick,1000);return ()=>clearInterval(id)},[session,result]);
  async function start(kind:MicroKind){
    if(lock.current)return;lock.current=true;setBusy(true);setError('');
    try{const r=await fetch('/api/student/micro-learning',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'start',kind})});const j=await r.json();if(!r.ok)throw new Error(j.error||'Görev başlatılamadı.');setSession(j);setAnswers({});setResult(null);setSeconds(0)}catch(e){setError(e instanceof Error?e.message:'Bağlantı kurulamadı.')}finally{lock.current=false;setBusy(false)}
  }
  async function submit(){
    if(!session||lock.current)return;lock.current=true;setBusy(true);setError('');
    try{
      const review=Boolean(session.reviewId);
      const r=await fetch(review?'/api/student/reviews':'/api/student/micro-learning',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(review?{id:session.reviewId,answer:answers['0']||'',microSessionId:session.sessionId}:{action:'submit',sessionId:session.sessionId,answers})});
      const j=await r.json();if(!r.ok)throw new Error(j.error||'Sonuç kaydedilemedi.');
      setResult(review?{correct:j.correct?1:0,wrong:j.correct?0:1,blank:0,total:1,items:[{id:'0',prompt:session.pack.items[0].prompt,answer:answers['0'],correctAnswer:j.correctAnswer,explanation:j.explanation||'',correct:j.correct,blank:false}],next:j.completed?'Tekrar döngüsünü tamamladın.':j.intervalReason}:j.result);
      await load();
    }catch(e){setError(e instanceof Error?e.message:'Sonuç kaydedilemedi. Cevapların ekranda duruyor; yeniden deneyebilirsin.')}finally{lock.current=false;setBusy(false)}
  }
  const visible=data?.tasks.filter(x=>x.minutes<=minutes)||[];
  return <div className="card">
    <div className="moduleEyebrow">GÜNLÜK MİKRO ÖĞRENME</div>
    <h2>Biraz vaktin var mı?</h2>
    <p className="muted">3–5 dakikada küçük bir adım at. Süre dolunca cevapların kapanmaz; rahatça tamamlayabilirsin.</p>
    {error&&<div role="alert" className="notice error">{error} {!data&&<button className="btn" onClick={()=>{setError('');void load()}}>Yeniden dene</button>}</div>}
    {!data&&!error&&<p role="status">Mini görevler yükleniyor…</p>}
    {data&&<p aria-live="polite">Bugün <strong>{data.summary.today} mini görev</strong> · Son 7 günde {data.summary.sessions} görev · {data.summary.minutes} dk · {data.summary.correct} doğru / {data.summary.wrong} yanlış / {data.summary.blank} boş</p>}
    {!session&&data&&<>
      <div className="row" role="group" aria-label="Ayırabileceğin süre">{[3,4,5].map(n=><button key={n} type="button" aria-pressed={minutes===n} className={'btn '+(minutes===n?'primary':'')} onClick={()=>setMinutes(n)}>{n} dakikam var</button>)}</div>
      <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,220px),1fr))',marginTop:16}}>
        {visible.map((task,i)=><div className="card" key={task.kind} style={{margin:0}}><span className="pill">{task.minutes} dk{i===0?' · Önerilen':''}</span><h3>{task.title}</h3><p>{task.reason}</p><small className="muted">{task.subject} · {task.topic}</small><div style={{marginTop:12}}><button className="btn primary" disabled={busy} onClick={()=>start(task.kind)}>Başla</button></div></div>)}
      </div>
      {!visible.length&&<p className="notice">{data.tasks.length?'Bu süreye uygun görev yok. Daha uzun bir süre seçebilirsin.':'Eğitim düzeyini profilinde tamamladığında uygun mini görevler burada görünecek. Tekrar günü gelen yanlışların da bu alana eklenir.'}</p>}
    </>}
    {session&&<div className="stack" style={{marginTop:16}}>
      <div className="row"><h3>{session.pack.title}</h3><span className="pill">{Math.floor(seconds/60)}:{String(seconds%60).padStart(2,'0')} / yaklaşık {session.pack.minutes} dk</span></div>
      {session.pack.kind==='HISTORY_5'&&<p>Olaylara en eskiden en yeniye 1–5 sıra numarası ver. Her numarayı bir kez kullan.</p>}
      {!result&&<form className="stack" onSubmit={e=>{e.preventDefault();void submit()}}>
        {session.imageUrl&&<img src={session.imageUrl} alt="Tekrar sorusunun görseli" style={{maxWidth:'100%',maxHeight:400,objectFit:'contain'}}/>}
        {session.pack.items.map((item,i)=><label key={item.id} className="field"><span>{i+1}. {item.prompt}</span>{item.options?<select aria-label={item.prompt} value={answers[item.id]||''} disabled={busy} onChange={e=>setAnswers(x=>({...x,[item.id]:e.target.value}))}><option value="">Cevap seç / boş bırak</option>{item.options.map(o=><option key={o} value={o}>{o}</option>)}</select>:<input aria-label={item.prompt} autoComplete="off" value={answers[item.id]||''} maxLength={500} disabled={busy} placeholder={session.reviewId?'Cevabını yaz':'Sayısal cevabını yaz'} onChange={e=>setAnswers(x=>({...x,[item.id]:e.target.value}))}/>}</label>)}
        <div className="row"><button className="btn primary" disabled={busy||!Object.values(answers).some(x=>x.trim())}>{busy?'Kaydediliyor…':'Kontrol et ve kaydet'}</button><button type="button" className="btn" disabled={busy} onClick={()=>{setSession(null);setError('')}}>Tamamlamadan kapat</button></div>
      </form>}
      {result&&<div aria-live="polite"><h3>{result.correct}/{result.total} doğru · {result.wrong} yanlış · {result.blank} boş</h3><p>Çalışman kaydedildi. {result.correct===result.total?'Bu seti tamamladın.':'Aşağıdaki açıklamaları okuyup eksiklerini pekiştirebilirsin.'}</p>{result.items.map(item=><div className="notice" key={item.id}><strong>{item.correct?'Doğru':item.blank?'Boş':'Tekrar çalış'}: {item.prompt}</strong><p>Cevabın: {item.answer||'Boş'} · Doğru cevap: {item.correctAnswer}</p><p>{item.explanation}</p></div>)}{result.next&&<p>{result.next}</p>}<button className="btn" onClick={()=>{setSession(null);setResult(null);setError('')}}>Görevlere dön</button></div>}
      <small className="muted">Mini oturum başına en fazla 5 dakika kaydedilir. Bu alıştırmalar konu hâkimiyetinin tek başına ölçüsü değildir.</small>
    </div>}
  </div>;
}
