'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { EXAM_CATALOG, ExamType } from '@/lib/examCatalog';
import {BLANK_REASON_CODES} from '@/lib/blankReasonEvidence';

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
  const [bookmarked,setBookmarked]=useState<Record<string,boolean>>({});
  const [activeQuestion,setActiveQuestion]=useState(0);
  const [markedForReturn,setMarkedForReturn]=useState<Record<string,boolean>>({});
  const [showFinishConfirm,setShowFinishConfirm]=useState(false);
  const [submitting,setSubmitting]=useState(false);
  const [finished,setFinished]=useState(false);
  const [hydrated,setHydrated]=useState(false);
  const [saveState,setSaveState]=useState<'loading'|'saving'|'saved'|'error'>('loading');
  const [result,setResult]=useState<any>(null);
  const [blankReasons,setBlankReasons]=useState<Record<string,string>>({});
  const [resultTab,setResultTab]=useState<'topics'|'questions'|'plan'>('topics');
  const saveQueue=useRef<Promise<void>>(Promise.resolve());
  const latest=useRef({answers:{} as Record<string,string>,marked:{} as Record<string,boolean>});
  latest.current={answers,marked:markedForReturn};
  const currentQuizId=quiz?.id;
  useEffect(()=>{
    if(!currentQuizId)return;
    let active=true;
    setHydrated(false);setSaveState('loading');
    fetch('/api/student/quizzes/'+currentQuizId+'/draft',{cache:'no-store'})
      .then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.error||'Taslak yüklenemedi.');return data})
      .then(async data=>{if(!active)return;setAnswers(data.answers||{});setMarkedForReturn(data.marked||{});setFinished(Boolean(data.submitted));setSaveState('saved');setHydrated(true);if(data.submitted){const r=await fetch('/api/student/quizzes/'+currentQuizId+'/attempt',{cache:'no-store'});if(r.ok){const info=await r.json();if(active)setResult(info)}}})
      .catch(()=>{if(active){setSaveState('error');setHydrated(true)}});
    return ()=>{active=false};
  },[currentQuizId]);
  function persistDraft(id:string){
    const snapshot={...latest.current,answers:{...latest.current.answers},marked:{...latest.current.marked}};
    setSaveState('saving');
    const next=saveQueue.current.catch(()=>undefined).then(async()=>{
      const response=await fetch('/api/student/quizzes/'+id+'/draft',{
        method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(snapshot)
      });
      if(!response.ok)throw new Error('Taslak sunucuda doğrulanamadı.');
    });
    saveQueue.current=next;
    next.then(()=>{if(quiz?.id===id)setSaveState('saved')}).catch(()=>{if(quiz?.id===id)setSaveState('error')});
    return next;
  }
  useEffect(()=>{
    if(!currentQuizId||!hydrated||finished||submitting)return;
    const timer=setTimeout(()=>{void persistDraft(currentQuizId)},650);
    return ()=>clearTimeout(timer);
  },[currentQuizId,answers,markedForReturn,hydrated,finished,submitting]);
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
    setQuiz(j.quiz);setQuestions(j.questions);setAnswers({});setActiveQuestion(0);setMarkedForReturn({});setShowFinishConfirm(false);setFinished(false);setResult(null);setBlankReasons({});setHydrated(false);setMsg('');
  }

  async function toggleBookmark(questionId:string){
    const active=!bookmarked[questionId];
    const r=await fetch('/api/student/personal-question-bank',{
      method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({action:'bookmark',questionId,active})
    });
    const j=await r.json();
    if(!r.ok)return setMsg('Hata: '+(j.error||'Soru bankası güncellenemedi.'));
    setBookmarked(x=>({...x,[questionId]:active}));
    setMsg(active?'Soru kişisel soru bankana eklendi.':'Soru kişisel soru bankasından kaldırıldı.');
  }

  async function finish(){
    if(!quiz||submitting||finished)return;
    setSubmitting(true);
    setMsg('Cevapların doğrulanıyor...');
    let j:any;
    try{
      await persistDraft(quiz.id);
      const r=await fetch('/api/student/quizzes/'+quiz.id+'/attempt',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({answers,blankReasons:Object.fromEntries(Object.entries(blankReasons).filter(([id])=>!answers[id]))})});
      j=await r.json();
      if(!r.ok){setMsg('Hata: '+(j.error||'Sonuç kaydedilemedi.'));return}
    }catch{setMsg('Hata: Bağlantı kurulamadı. Sonuç kaydedilemedi.');return}
    finally{setSubmitting(false)}
    setFinished(true);setShowFinishConfirm(false);setResult(j);
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
      if(j.completed)setMsg('Doğru. Bu yanlış soru 0–1–3–7–14–28. Gün Tekrar Sistemi döngüsünü başarıyla tamamladı ve kuyruktan çıktı.');
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

  return <div className="stack keksFocusArea">
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

    {quiz&&<section className="card keksFocusExam" aria-label="KEKS Focus Pro sınav">
      <div className="keksFocusHero">
        <div className="keksFocusHeroTop"><span className="keksFocusBrand">KEKS AKADEMİ <small>FOCUS PRO</small></span><span>{questions.filter(q=>Boolean(answers[q.id])).length} / {questions.length} cevaplandı</span></div>
        <h2>{quiz.title}</h2>
        <div className="keksFocusProgress" role="progressbar" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={questions.filter(q=>Boolean(answers[q.id])).length} aria-label="Cevaplanan soru sayısı"><span style={{width:(questions.length?questions.filter(q=>Boolean(answers[q.id])).length/questions.length*100:0)+'%'}}/></div>
      </div>
      {finished?<div className="keksFocusResult" role="status">
        <h3>Test sonucu ve öğrenme analizi</h3>
        {result?.attempt?<><div className="keksFocusStats">
          <div><strong>{result.attempt.correct}</strong><span>Doğru</span></div>
          <div><strong>{result.attempt.wrong}</strong><span>Yanlış</span></div>
          <div><strong>{result.attempt.blank}</strong><span>Boş</span></div>
          <div><strong>{Number(result.attempt.net).toLocaleString('tr-TR')}</strong><span>Net</span></div>
        </div>
        <div className="row">
          <button className={'btn '+(resultTab==='topics'?'primary':'')} onClick={()=>setResultTab('topics')}>Konu analizi</button>
          <button className={'btn '+(resultTab==='questions'?'primary':'')} onClick={()=>setResultTab('questions')}>Soru inceleme</button>
          <button className={'btn '+(resultTab==='plan'?'primary':'')} onClick={()=>setResultTab('plan')}>Öğrenme planı</button>
        </div>
        {resultTab==='topics'&&<div className="keksFocusResultList">{(result.topicAnalysis||[]).map((t:any)=><div className="keksFocusResultRow" key={t.subject+'-'+t.topic}><strong>{t.subject} · {t.topic}</strong><span>{t.correct} doğru · {t.wrong} yanlış · {t.blank} boş</span><small>Bu tek sınavdır; kalıcı öğrenme kanıtı değildir.</small></div>)}</div>}
        {resultTab==='questions'&&<div className="keksFocusResultList">{(result.details||[]).map((d:any,i:number)=><details className="keksFocusResultRow" key={d.questionId}><summary>Soru {i+1} · {d.topic} · {d.outcome==='CORRECT'?'Doğru':d.outcome==='WRONG'?'Yanlış':'Boş'}</summary><p>Senin cevabın: {d.selectedAnswer||'Boş'} · Doğru seçenek: {d.correctAnswer}</p>{d.explanation&&<p>{d.explanation}</p>}{!d.sourceVerified&&<p>Bu sorunun cevap anahtarı bağımsız doğrulama gerektirir.</p>}</details>)}</div>}
        {resultTab==='plan'&&<div className="keksFocusResultList">{(result.feedback||[]).map((f:any)=><div className="keksFocusResultRow" key={f.questionId}><strong>{f.subject} · {f.topic} · {f.outcome==='BLANK'?'Boş':'Yanlış'}</strong><p>{f.firstStep}</p><p>{f.method}</p><small>Yeni soru önerisi: {f.recommendedQuestions}. 0–1–3–7–14–28. gün tekrarlarıyla yeniden ölç.</small></div>)}</div>}
        </>:<p>Test daha önce teslim edilmiş. Mevcut sonuçlarını koç raporlarında inceleyebilirsin.</p>}
        <p>Yalnızca bu testteki performans değerlendirilmiştir; öğrenme düzeyi farklı günlerde tekrar ölçülmelidir.</p>
      </div>:questions[activeQuestion]&&<article className="keksFocusQuestion" key={questions[activeQuestion].id}>
        <div className="keksFocusQuestionHeader">
          <span className="keksFocusKicker">SORU {activeQuestion+1} / {questions.length}</span>
          <div className="row">
            <button className="btn" type="button" aria-pressed={Boolean(markedForReturn[questions[activeQuestion].id])} onClick={()=>setMarkedForReturn(x=>({...x,[questions[activeQuestion].id]:!x[questions[activeQuestion].id]}))}>{markedForReturn[questions[activeQuestion].id]?'★ Tekrar bakacağım':'☆ İşaretle'}</button>
            <button className="btn" type="button" onClick={()=>toggleBookmark(questions[activeQuestion].id)}>{bookmarked[questions[activeQuestion].id]?'★ Bankamda':'☆ Soru bankama ekle'}</button>
          </div>
        </div>
        <p className="keksFocusPrompt">{questions[activeQuestion].prompt}</p>
        <fieldset className="keksFocusOptions"><legend>Bir cevap seç</legend>
          {Object.entries(questions[activeQuestion].options).map(([key,val])=><label className={'keksFocusOption '+(answers[questions[activeQuestion].id]===key?'selected':'')} key={key}>
            <input type="radio" name={questions[activeQuestion].id} value={key} checked={answers[questions[activeQuestion].id]===key} onChange={()=>setAnswers(a=>({...a,[questions[activeQuestion].id]:key}))}/>
            <span className="keksFocusLetter" aria-hidden="true">{key}</span><span>{val}</span>
          </label>)}
        </fieldset>
        {questions[activeQuestion].officialSourceUrl&&<p><a href={questions[activeQuestion].officialSourceUrl} target="_blank" rel="noreferrer">Resmî kaynak</a></p>}
        <div className="keksFocusQuestionFooter"><span>{answers[questions[activeQuestion].id]?'Cevap seçildi':'Bu soru boş'}</span><button className="btn" type="button" onClick={()=>setAnswers(a=>{const n={...a};delete n[questions[activeQuestion].id];return n})}>Boş bırak</button></div>
      </article>}
      {!finished&&<><div className="keksFocusSaveStatus" role="status" aria-live="polite">{saveState==='loading'?'Cevap taslağı yükleniyor…':saveState==='saving'?'Sunucuya kaydediliyor…':saveState==='saved'?'✓ Cevaplar sunucuda kaydedildi':'Kayıt doğrulanamadı. Bağlantını kontrol et ve tekrar dene.'}{saveState==='error'&&quiz&&<button className="btn" type="button" onClick={()=>void persistDraft(quiz.id)}>Yeniden kaydet</button>}</div><div className="keksFocusNavigation">
        <div className="keksFocusNavHead"><strong>Soru haritası</strong><span>Yeşil: cevaplandı · Altın: işaretli</span></div>
        <div className="keksFocusMap" aria-label="Soru haritası">{questions.map((q,i)=><button type="button" key={q.id} aria-label={`Soru ${i+1}, ${answers[q.id]?'cevaplandı':'boş'}${markedForReturn[q.id]?', işaretli':''}`} aria-current={activeQuestion===i?'step':undefined} className={'keksFocusMapItem '+(answers[q.id]?'answered ':'')+(markedForReturn[q.id]?'flagged ':'')+(activeQuestion===i?'active':'')} onClick={()=>{setActiveQuestion(i);setShowFinishConfirm(false)}}>{i+1}{markedForReturn[q.id]?<span aria-hidden="true">★</span>:null}</button>)}</div>
        <div className="keksFocusActions">
          <button className="btn" type="button" disabled={activeQuestion===0} onClick={()=>setActiveQuestion(i=>Math.max(0,i-1))}>← Önceki soru</button>
          {activeQuestion<questions.length-1?<button className="btn primary" type="button" onClick={()=>setActiveQuestion(i=>Math.min(questions.length-1,i+1))}>Sonraki soru →</button>:<button className="btn primary" type="button" onClick={()=>setShowFinishConfirm(true)}>Testi bitir</button>}
        </div>
        {showFinishConfirm&&<div className="keksFocusConfirm" role="group" aria-label="Test teslim onayı">
          <h3>Testi teslim etmek istiyor musun?</h3>
          <p>{questions.filter(q=>Boolean(answers[q.id])).length} cevaplandı · {questions.filter(q=>!answers[q.id]).length} boş · {questions.filter(q=>markedForReturn[q.id]).length} işaretli soru.</p>
          <p>Boş sorular geçerlidir; teslimden sonra cevaplarını değiştiremezsin.</p>
          {questions.filter(q=>!answers[q.id]).length>0&&<div className="keksFocusBlankReasons">
            <strong>Boş bırakma nedenleri (isteğe bağlı)</strong>
            <p>Yanlışlardan ayrı analiz edilir. Neden seçmek zorunda değilsin.</p>
            {questions.filter(q=>!answers[q.id]).map((q,i)=><label className="field" key={q.id}>Soru {questions.findIndex(item=>item.id===q.id)+1} · Neden boş?
              <select value={blankReasons[q.id]||''} onChange={e=>setBlankReasons(x=>({...x,[q.id]:e.target.value}))}>
                <option value="">Belirtmek istemiyorum</option>
                {Object.entries(BLANK_REASON_CODES).map(([code,label])=><option key={code} value={code}>{label}</option>)}
              </select>
            </label>)}
          </div>}
          <div className="row"><button className="btn" type="button" onClick={()=>setShowFinishConfirm(false)}>Sorulara dön</button><button className="btn primary" disabled={submitting||!hydrated} type="button" onClick={finish}>{submitting?'Kaydediliyor…':'Teslimi onayla'}</button></div>
        </div>}
      </div></>}
    </section>}

    <div className="card">
      <div className="moduleHeaderRow">
        <div><div className="moduleEyebrow">0–1–3–7–14–28. GÜN TEKRAR SİSTEMİ</div><h2>Yanlış Soru Tekrar Kuyruğu</h2><p className="muted">Yanlış yaptığın sorular otomatik kuyruğa girer. Doğru çözdükçe tekrar aralığı 1 → 3 → 7 → 14 → 28 güne genişler; tekrar yanlış olursa soru 0. güne döner.</p></div>
        <span className="pill">{reviews.length} soru</span>
      </div>
      {reviews.length===0?<div className="notice">Tekrar kuyruğun boş. Testlerde yanlış yaptığın sorular burada branş branş görünecek.</div>:<div className="stack">
        {reviewGroups.map(([branch,items])=><details key={branch} open={items.some(x=>x.status==='DUE')}>
          <summary><strong>{branch}</strong> <span className="muted">· {items.length} tekrar sorusu</span></summary>
          <div className="stack" style={{marginTop:12}}>
            {items.map(item=>{
              const due=item.status==='DUE';
              const day=reviewStage(item.stepIndex);
              return <article className="card keksFocusReview" key={item.id} style={{padding:14}}>
                <div className="moduleHeaderRow">
                  <div><strong>{item.question.topic||'Karma'} · {day}. gün tekrarı</strong><div className="muted">Tekrar tarihi: {trDate(item.dueAt)} · {due?'Bugün çözülmeli':'Yaklaşan tekrar'}</div></div>
                  <span className="pill">{due?'SIRA GELDİ':day+'. GÜN'}</span>
                </div>
                <p><strong>{item.question.prompt}</strong></p>
                <div className="stack">
                  {Object.entries(item.question.options||{}).map(([key,val])=><label className={"keksFocusOption "+(reviewAnswers[item.id]===key?"selected":"")} key={key}>
                    <input type="radio" name={'review-'+item.id} checked={reviewAnswers[item.id]===key} onChange={()=>setReviewAnswers(a=>({...a,[item.id]:key}))} disabled={!due}/>
                    <span className="keksFocusLetter" aria-hidden="true">{key}</span><span>{String(val)}</span>
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
