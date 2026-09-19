'use client';

import { useMemo, useState } from 'react';
import { EXAM_CATALOG, ExamType } from '@/lib/examCatalog';

type Question={id:string;prompt:string;options:Record<string,string>;sourceKind:string;sourceYear?:number|null;officialSourceUrl?:string|null};

export function QuizBuilder({allowedExams}:{allowedExams:ExamType[]}) {
  const [exam,setExam]=useState<ExamType>(allowedExams[0]||'TYT');
  const [subject,setSubject]=useState<string>(Object.keys(EXAM_CATALOG[allowedExams[0]||'TYT'])[0]||'');
  const [topic,setTopic]=useState('');
  const [count,setCount]=useState(10);
  const [quiz,setQuiz]=useState<{id:string;title:string}|null>(null);
  const [questions,setQuestions]=useState<Question[]>([]);
  const [answers,setAnswers]=useState<Record<string,string>>({});
  const [msg,setMsg]=useState('');
  const subjects=Object.keys(EXAM_CATALOG[exam]||{});
  const topics=useMemo(()=>((EXAM_CATALOG[exam] as any)?.[subject]||[]) as string[],[exam,subject]);

  function changeExam(v:ExamType){setExam(v);const s=Object.keys(EXAM_CATALOG[v])[0]||'';setSubject(s);setTopic('');setQuiz(null);setQuestions([])}

  async function build(){
    setMsg('Test hazırlanıyor...');
    const r=await fetch('/api/student/quizzes',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({examType:exam,subject,topic:topic||undefined,count})});
    const j=await r.json();
    if(!r.ok){setMsg('Hata: '+(j.error||'Test oluşturulamadı.'));return}
    setQuiz(j.quiz);setQuestions(j.questions);setAnswers({});setMsg('');
  }

  async function finish(){
    if(!quiz)return;
    setMsg('Sonuç hesaplanıyor...');
    const r=await fetch('/api/student/quizzes/'+quiz.id+'/attempt',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({answers})});
    const j=await r.json();
    if(!r.ok){setMsg('Hata: '+(j.error||'Sonuç kaydedilemedi.'));return}
    setMsg('Test tamamlandı · Doğru '+j.attempt.correct+' · Yanlış '+j.attempt.wrong+' · Boş '+j.attempt.blank+' · Net '+j.attempt.net+' · Koç raporu oluşturuldu.');
  }

  return <div className="stack">
    <div className="card">
      <h1>Konu Bazlı Test Oluştur</h1>
      <p className="muted">Sistem özgün veya lisanslı soru bankasından test oluşturur. Resmî çıkmış sorular için kaynak bağlantısı gösterilebilir.</p>
      <div className="row">
        <div className="field" style={{flex:1}}><label>Sınav</label><select value={exam} onChange={e=>changeExam(e.target.value as ExamType)}>{allowedExams.map(x=><option key={x}>{x}</option>)}</select></div>
        <div className="field" style={{flex:1}}><label>Branş</label><select value={subject} onChange={e=>{setSubject(e.target.value);setTopic('')}}>{subjects.map(x=><option key={x}>{x}</option>)}</select></div>
      </div>
      <div className="row">
        <div className="field" style={{flex:2}}><label>Konu</label><select value={topic} onChange={e=>setTopic(e.target.value)}><option value="">Karma</option>{topics.map(x=><option key={x}>{x}</option>)}</select></div>
        <div className="field" style={{flex:1}}><label>Soru sayısı</label><input type="number" min={1} max={30} value={count} onChange={e=>setCount(Number(e.target.value))}/></div>
      </div>
      <button className="btn primary" onClick={build}>Testi Oluştur</button>
    </div>

    {quiz&&<div className="card"><h2>{quiz.title}</h2>{questions.map((q,i)=><article key={q.id} style={{padding:'18px 0',borderBottom:'1px solid var(--line)'}}><strong>{i+1}. {q.prompt}</strong><div className="stack" style={{marginTop:12}}>{Object.entries(q.options).map(([key,val])=><label key={key} style={{display:'flex',gap:10,alignItems:'flex-start'}}><input type="radio" name={q.id} checked={answers[q.id]===key} onChange={()=>setAnswers(a=>({...a,[q.id]:key}))}/><span><strong>{key}</strong>) {val}</span></label>)}</div>{q.officialSourceUrl&&<p><a href={q.officialSourceUrl} target="_blank" rel="noreferrer">Resmî kaynak</a></p>}</article>)}<button className="btn primary" onClick={finish} style={{marginTop:16}}>Testi Bitir ve Sonucu Kaydet</button></div>}
    {msg&&<div className={`notice ${msg.startsWith('Hata:')?'error':''}`}>{msg}</div>}
  </div>;
}
