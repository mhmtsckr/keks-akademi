'use client';

import { useEffect, useMemo, useState } from 'react';
import { EXAM_CATALOG, ExamType } from '@/lib/examCatalog';

type Question={id:string;prompt:string;options:Record<string,string>;sourceKind:string;sourceYear?:number|null;officialSourceUrl?:string|null};
type ReviewItem={
  id:string;
  stepIndex:number;
  dueAt:string;
  status:'DUE'|'PENDING';
  lastCorrect?:boolean|null;
  question:{
    id:string;
    examType:string;
    subject:string;
    topic?:string|null;
    prompt:string;
    options:Record<string,string>;
    sourceKind:string;
    sourceYear?:number|null;
    officialSourceUrl?:string|null;
  };
};

const REVIEW_DAYS=[0,1,3,7,14,28];

function reviewStage(step:number){return REVIEW_DAYS[Math.min(Math.max(step,0),REVIEW_DAYS.length-1)]??0}
function trDate(v:string){return new Date(v).toLocaleDateString('tr-TR',{timeZone:'Europe/Istanbul',day:'2-digit',month:'long',year:'numeric'})}

export function QuizBuilder({allowedExams}:{allowedExams:ExamType[]}) {
  const [exam,setExam]=useState<ExamType>(allowedExams[0]||'TYT');
  const [subject,setSubject]=useState<string>(Object.keys(EXAM_CATALOG[allowedExams[0]||'TYT'])[0]||'');
  const [topic,setTopic]=useState('');
  const [count,setCount]=useState(10);
  const [quiz,setQuiz]=useState<{id:string;title:string}|null>(null);
  const [questions,setQuestions]=useState<Question[]>([]);
  const [answers,setAnswers]=useState<Record<string,string>>({});
  const [msg,setMsg]=useState('');
  const [reviews,setReviews]=useState<ReviewItem[]>([]);
  const [reviewAnswers,setReviewAnswers]=useState<Record<string,string>>({});
  const [reviewBusy,setReviewBusy]=useState('');
  const subjects=Object.keys(EXAM_CATALOG[exam]||{});
  const topics=useMemo(()=>((EXAM_CATALOG[exam] as any)?.[subject]||[]) as string[],[exam,subject]);

  function changeExam(v:ExamType){setExam(v);const s=Object.keys(EXAM_CATALOG[v])[0]||'';setSubject(s);setTopic('');setQuiz(null);setQuestions([])}

  async function loadReviews(){
    const r=await fetch('/api/student/reviews',{cache:'no-store'});
    const j=await r.json();
    if(r.ok)setReviews(j.items||[]);
  }
  useEffect(()=>{loadReviews()},[]);

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
    setMsg('Test tamamlandı · Doğru '+j.attempt.correct+' · Yanlış '+j.attempt.wrong+' · Boş '+j.attempt.blank+' · Net '+j.attempt.net+(j.reviewAdded?' · '+j.reviewAdded+' yanlış soru 0. gün tekrar kuyruğuna eklendi.':'')+' · Koç raporu oluşturuldu.');
    await loadReviews();
  }

  async function submitReview(item:ReviewItem){
    const answer=reviewAnswers[item.id];
    if(!answer)return setMsg('Hata: Tekrar sorusu için bir cevap seçin.');
    setReviewBusy(item.id);setMsg('');
    const r=await fetch('/api/student/reviews',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:item.id,answer})});
    const j=await r.json();setReviewBusy('');
    if(!r.ok)return setMsg('Hata: '+(j.error||'Tekrar kaydedilemedi.'));
    if(j.correct){
      if(j.completed)setMsg('Doğru. Bu yanlış soru 0–1–3–7–14–28 döngüsünü başarıyla tamamladı ve kuyruktan çıktı.');
      else setMsg('Doğru. Sonraki tekrar aralığı '+j.nextIntervalDays+' güne genişletildi · Yeni tekrar tarihi: '+trDate(j.nextDueAt)+'.');
    }else{
      setMsg('Yanlış. Soru tekrar 0. gün aşamasına alındı; doğru cevap: '+j.correctAnswer+(j.explanation?' · '+j.explanation:''));
    }
    setReviewAnswers(a=>{const n={...a};delete n[item.id];return n});
    await loadReviews();
  }

  const reviewGroups=useMemo(()=>{
    const groups=new Map<string,ReviewItem[]>();
    for(const item of reviews){
      const key=item.question.subject||'Genel';
      const arr=groups.get(key)||[];arr.push(item);groups.set(key,arr);
    }
    return [...groups.entries()];
  },[reviews]);

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

    <div className="card">
      <div className="moduleHeaderRow">
        <div><div className="moduleEyebrow">0–1–3–7–14–28 TEKRAR SİSTEMİ</div><h2>Yanlış Soru Tekrar Kuyruğu</h2><p className="muted">Yanlış yaptığın sorular otomatik kuyruğa girer. Doğru çözdükçe tekrar aralığı 1 → 3 → 7 → 14 → 28 güne genişler; tekrar yanlış olursa soru 0. güne döner.</p></div>
        <span className="pill">{reviews.length} soru</span>
      </div>
      {reviews.length===0?<div className="notice">Tekrar kuyruğun boş. Testlerde yanlış yaptığın sorular burada branş branş görünecek.</div>:<div className="stack">
        {reviewGroups.map(([branch,items])=><details key={branch} open={items.some(x=>x.status==='DUE')}>
          <summary><strong>{branch}</strong> <span className="muted">· {items.length} tekrar sorusu</span></summary>
          <div className="stack" style={{marginTop:12}}>
            {items.map(item=>{
              const due=item.status==='DUE';
              const day=reviewStage(item.stepIndex);
              return <article className="card" key={item.id} style={{padding:14}}>
                <div className="moduleHeaderRow">
                  <div><strong>{item.question.topic||'Karma'} · {day}. gün tekrarı</strong><div className="muted">Tekrar tarihi: {trDate(item.dueAt)} · {due?'Bugün çözülmeli':'Yaklaşan tekrar'}</div></div>
                  <span className="pill">{due?'SIRA GELDİ':day+'. GÜN'}</span>
                </div>
                <p><strong>{item.question.prompt}</strong></p>
                <div className="stack">
                  {Object.entries(item.question.options||{}).map(([key,val])=><label key={key} style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                    <input type="radio" name={'review-'+item.id} checked={reviewAnswers[item.id]===key} onChange={()=>setReviewAnswers(a=>({...a,[item.id]:key}))} disabled={!due}/>
                    <span><strong>{key}</strong>) {String(val)}</span>
                  </label>)}
                </div>
                <button className="btn primary" style={{marginTop:12}} disabled={!due||reviewBusy===item.id||!reviewAnswers[item.id]} onClick={()=>submitReview(item)}>
                  {reviewBusy===item.id?'Kontrol ediliyor…':due?'Cevabı Kontrol Et ve Aralığı Güncelle':'Tekrar Günü Bekleniyor'}
                </button>
              </article>
            })}
          </div>
        </details>)}
      </div>}
    </div>

    {msg&&<div className={`notice ${msg.startsWith('Hata:')?'error':''}`}>{msg}</div>}
  </div>;
}
