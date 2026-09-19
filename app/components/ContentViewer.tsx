'use client';

import { useEffect,useMemo,useState } from 'react';

export function ContentViewer({type,payload}:{type:string;payload:any}){
  const [index,setIndex]=useState(0);
  const [flipped,setFlipped]=useState<Record<number,boolean>>({});
  const [answers,setAnswers]=useState<Record<number,string>>({});
  const [result,setResult]=useState<string>('');
  const items=payload?.items||[];
  const slides=payload?.slides||[];

  function speak(text:string){
    if(typeof window==='undefined'||!('speechSynthesis'in window))return;
    window.speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text);u.lang='tr-TR';u.rate=0.95;window.speechSynthesis.speak(u);
  }

  if(type==='FLASHCARDS') return <div className="grid">{items.map((x:any,i:number)=><button key={i} className="card" onClick={()=>setFlipped(f=>({...f,[i]:!f[i]}))} style={{textAlign:'left',minHeight:150}}><span className="pill">Kart {i+1}</span><h3>{flipped[i]?'Cevap':'Soru'}</h3><p>{flipped[i]?x.back:x.front}</p></button>)}</div>;

  if(type==='QUIZ') return <div className="stack">{items.map((q:any,i:number)=><div className="card" key={i}><strong>{i+1}. {q.prompt}</strong><div className="stack" style={{marginTop:10}}>{Object.entries(q.options||{}).map(([k,v]:any)=><label key={k} className="row"><input type="radio" name={'q'+i} checked={answers[i]===k} onChange={()=>setAnswers(a=>({...a,[i]:k}))}/><span><strong>{k})</strong> {v}</span></label>)}</div>{result&&<p className={answers[i]===q.correctAnswer?'notice':'notice error'}>{answers[i]===q.correctAnswer?'Doğru':'Doğru cevap: '+q.correctAnswer} · {q.explanation}</p>}</div>)}<button className="btn primary" onClick={()=>setResult('done')}>Testi Kontrol Et</button></div>;

  if(type==='SLIDES') return <div className="stack"><div className="card" style={{minHeight:320}}><span className="pill">{index+1} / {slides.length}</span><h1>{slides[index]?.title}</h1><ul>{(slides[index]?.bullets||[]).map((b:string,i:number)=><li key={i} style={{margin:'10px 0'}}>{b}</li>)}</ul><p className="muted">{slides[index]?.notes}</p></div><div className="row"><button className="btn" onClick={()=>setIndex(i=>Math.max(0,i-1))}>Önceki</button><button className="btn primary" onClick={()=>setIndex(i=>Math.min(slides.length-1,i+1))}>Sonraki</button></div></div>;

  if(type==='INFOGRAPHIC') return <div><h1>{payload?.headline}</h1><div className="grid">{(payload?.blocks||[]).map((b:any,i:number)=><div className="card" key={i}><span className="pill">{i+1}</span><h3>{b.title}</h3><p>{b.body}</p></div>)}</div></div>;

  if(type==='AUDIO_SCRIPT') return <div className="card"><h2>Sesli Anlatım</h2><p className="muted">Yaklaşık {payload?.estimatedMinutes||5} dakika</p><p style={{lineHeight:1.8}}>{payload?.script}</p><button className="btn primary" onClick={()=>speak(payload?.script||'')}>Sesli Anlatımı Başlat</button><button className="btn" onClick={()=>window.speechSynthesis?.cancel()}>Durdur</button></div>;

  if(type==='VIDEO_LESSON') return <div className="stack"><div className="card" style={{minHeight:320}}><span className="pill">Sahne {index+1} / {slides.length}</span><h1>{slides[index]?.title}</h1><ul>{(slides[index]?.bullets||[]).map((b:string,i:number)=><li key={i}>{b}</li>)}</ul></div><div className="row"><button className="btn" onClick={()=>setIndex(i=>Math.max(0,i-1))}>Önceki</button><button className="btn primary" onClick={()=>speak(slides[index]?.narration||'')}>Bu Sahneyi Anlat</button><button className="btn" onClick={()=>setIndex(i=>Math.min(slides.length-1,i+1))}>Sonraki</button></div></div>;

  if(type==='SIMILAR_QUESTIONS') return <div className="stack">{items.map((x:any,i:number)=><div className="card" key={i}><span className="pill">{x.difficulty||'orta'}</span><h3>Yeni Soru {i+1}</h3><p>{x.generated}</p><details><summary>Kaynakta ölçülen tarz</summary><p className="muted">{x.sourceStyle}</p><p>{x.note}</p></details></div>)}</div>;

  return <div className="card"><pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(payload,null,2)}</pre></div>;
}
