'use client';

import Image from 'next/image';
import { FormEvent,useEffect,useState } from 'react';

const ERROR_REASONS=[
  ['','Henüz belirleyemedim'],
  ['BILGI_EKSIKLIGI','Bilgi eksikliği'],
  ['ISLEM_HATASI','İşlem hatası'],
  ['DIKKAT','Dikkat'],
  ['SORU_KOKU','Soru kökünü yanlış okuma'],
  ['SURE','Süre'],
  ['YONTEM_BILMEME','Yöntem bilmeme'],
  ['UNUTMA','Unutma']
] as const;

const SUBJECTS=[
  'Matematik','Türkçe','Türk Dili ve Edebiyatı','Tarih','Coğrafya',
  'Eğitim Bilimleri','Mevzuat','Fizik','Kimya','Biyoloji',
  'Geometri','Felsefe','Din Kültürü','İngilizce'
];

export function StudentWrongQuestionBank({defaultExam}:{defaultExam:string}){
  const [items,setItems]=useState<any[]>([]);
  const [reviews,setReviews]=useState<any[]>([]);
  const [reviewReasons,setReviewReasons]=useState<Record<string,string>>({});
  const [support,setSupport]=useState<any|null>(null);
  const [practice,setPractice]=useState<any|null>(null);
  const [practiceAnswers,setPracticeAnswers]=useState<Record<string,string>>({});
  const [practiceResult,setPracticeResult]=useState<any|null>(null);
  const [practiceBusy,setPracticeBusy]=useState(false);
  const [guided,setGuided]=useState<any|null>(null);
  const [guidedAnswer,setGuidedAnswer]=useState('');
  const [guidedResult,setGuidedResult]=useState<any|null>(null);
  const [guidedBusy,setGuidedBusy]=useState(false);
  const [lessonCatalog,setLessonCatalog]=useState<any[]>([]);
  const [selectedSubject,setSelectedSubject]=useState('');
  const [gradeSelection,setGradeSelection]=useState('');
  const [curriculumContext,setCurriculumContext]=useState<any|null>(null);
  const [reviewAnswers,setReviewAnswers]=useState<Record<string,string>>({});
  const [msg,setMsg]=useState('');
  const [busy,setBusy]=useState(false);
  const [editing,setEditing]=useState<Record<string,string>>({});
  const [sets,setSets]=useState<any>(null);
  const [openSet,setOpenSet]=useState<'weekly'|'monthly'|null>(null);

  async function load(){
    const params=new URLSearchParams();
    if(gradeSelection)params.set('grade',gradeSelection);
    if(defaultExam)params.set('examType',defaultExam);
    const [wr,rr,lr]=await Promise.all([
      fetch('/api/student/wrong-questions',{cache:'no-store'}),
      fetch('/api/student/reviews',{cache:'no-store'}),
      fetch('/api/student/reviews/guided?'+params.toString(),{cache:'no-store'})
    ]);
    const [wj,rj,lj]=await Promise.all([wr.json(),rr.json(),lr.json()]);
    if(wr.ok){setItems(wj.items||[]);setSets(wj.sets||null);}
    if(rr.ok)setReviews((rj.items||[]).filter((x:any)=>String(x.question?.sourceKind||'').startsWith('STUDENT_WRONG:')));
    if(lr.ok){setLessonCatalog(lj.lessons||[]);setCurriculumContext(lj.curriculumContext||null);}
  }
  useEffect(()=>{void load()},[]);
  useEffect(()=>{
    let alive=true;
    const params=new URLSearchParams();
    if(gradeSelection)params.set('grade',gradeSelection);
    if(defaultExam)params.set('examType',defaultExam);
    fetch('/api/student/reviews/guided?'+params.toString(),{cache:'no-store'})
      .then(r=>r.json()).then(j=>{
        if(!alive||!j.ok)return;
        setLessonCatalog(j.lessons||[]);
        setCurriculumContext(j.curriculumContext||null);
      }).catch(()=>{});
    return ()=>{alive=false};
  },[gradeSelection,defaultExam]);
  useEffect(()=>{
    if(guided)document.getElementById('keks-guided-remediation')?.scrollIntoView({behavior:'smooth',block:'start'});
  },[guided]);

  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setMsg('');
    const form=e.currentTarget;
    const fd=new FormData(form);
    if(!fd.get('examType'))fd.set('examType',defaultExam);
    const r=await fetch('/api/student/wrong-questions',{method:'POST',body:fd});
    const j=await r.json();setBusy(false);
    if(!r.ok)return setMsg('Hata: '+(j.error||'Yanlış soru yüklenemedi.'));
    setMsg(j.message+' · Tekrar motoru 0–1–3–7–14–28 gün tabanlıdır; sonraki aralık performansına göre otomatik değişir.');
    form.reset();setSelectedSubject('');
    await load();
  }

  async function answerReview(id:string){
    const answer=String(reviewAnswers[id]||'').trim();
    if(!answer)return;
    const r=await fetch('/api/student/reviews',{
      method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({id,answer,errorReason:reviewReasons[id]||undefined})
    });
    const j=await r.json();
    if(!r.ok)return setMsg('Hata: '+(j.error||'Tekrar görevi kaydedilemedi.'));
    setReviewAnswers(x=>({...x,[id]:''}));
    setSupport(j.correct?null:{...j.support,reviewId:id});
    setPractice(null);setPracticeResult(null);
    setGuided(null);setGuidedResult(null);setGuidedAnswer('');
    const intervalText=j.completed?'':(' · Sonraki tekrar: '+j.nextIntervalDays+' gün sonra.');
    const streakText=j.correctStreak>=2?(' · Ardışık doğru: '+j.correctStreak):j.incorrectStreak>=2?(' · Ardışık yanlış: '+j.incorrectStreak):'';
    setMsg(j.correct
      ? (j.completed?'Doğru. Bu soru için aktif tekrar döngüsü tamamlandı.':'Doğru.'+intervalText+streakText+' · '+(j.intervalReason||'Kişisel unutma eğrisi güncellendi.'))
      : 'Tekrar yanlış. Doğru cevap: '+j.correctAnswer+(j.explanation?' · '+j.explanation:'')+intervalText+streakText+' · '+(j.intervalReason||'Bir sonraki tekrar daha yakın tarihe çekildi.'));
    await load();
  }

  async function startGuided(reviewId:string){
    setGuidedBusy(true);setMsg('');
    setGuided(null);setGuidedResult(null);setGuidedAnswer('');
    try{
      const r=await fetch('/api/student/reviews/guided',{
        method:'POST',headers:{'content-type':'application/json'},
        body:JSON.stringify({action:'start',reviewId})
      });
      const j=await r.json();
      if(!r.ok){setMsg('Bilgi: '+(j.error||'Bu konu için örnek henüz hazırlanmadı.'));return;}
      setGuided(j);setGuidedResult(null);setGuidedAnswer('');
      setPractice(null);
    }catch{setMsg('Hata: Çözümlü örnek yüklenemedi.');}
    finally{setGuidedBusy(false)}
  }

  async function finishGuided(){
    if(!guided?.sessionId||!guidedAnswer.trim())return;
    setGuidedBusy(true);setMsg('');
    try{
      const r=await fetch('/api/student/reviews/guided',{
        method:'POST',headers:{'content-type':'application/json'},
        body:JSON.stringify({action:'submit',sessionId:guided.sessionId,answer:guidedAnswer.trim()})
      });
      const j=await r.json();
      if(!r.ok){setMsg('Hata: '+(j.error||'Alıştırma kontrol edilemedi.'));return;}
      setGuidedResult(j);
    }catch{setMsg('Hata: Alıştırma sonucu kaydedilemedi.');}
    finally{setGuidedBusy(false)}
  }

  async function startPractice(reviewId:string){
    setPracticeBusy(true);setMsg('');
    try{
      const r=await fetch('/api/student/reviews/practice',{
        method:'POST',headers:{'content-type':'application/json'},
        body:JSON.stringify({reviewId})
      });
      const j=await r.json();
      if(!r.ok){setMsg('Hata: '+(j.error||'Pekiştirme testi oluşturulamadı.'));return;}
      setPractice(j);setPracticeAnswers({});setPracticeResult(null);
    }catch{setMsg('Hata: Pekiştirme testi yüklenemedi.');}
    finally{setPracticeBusy(false)}
  }

  async function finishPractice(){
    if(!practice?.quiz?.id)return;
    setPracticeBusy(true);setMsg('');
    try{
      const r=await fetch('/api/student/quizzes/'+practice.quiz.id+'/attempt',{
        method:'POST',headers:{'content-type':'application/json'},
        body:JSON.stringify({answers:practiceAnswers})
      });
      const j=await r.json();
      if(!r.ok){setMsg('Hata: '+(j.error||'Test kaydedilemedi.'));return;}
      setPracticeResult(j.attempt);
      await load();
    }catch{setMsg('Hata: Test sonucu kaydedilemedi.');}
    finally{setPracticeBusy(false)}
  }

  function openGuidedFromBank(q:any){
    if(!q.review?.id)return;
    setSupport({
      reviewId:q.review.id,subject:q.subject,topic:q.topic,
      topicConfirmationNeeded:(q.classificationConfidence||0)<0.65,
      acquisition:null,reasonLabel:null,
      instruction:'Konuyu ayrı hazırlanmış örnek üzerinde incele, ardından kendi soruna tekrar dön.',
      explanation:q.explanation||null,steps:[]
    });
    void startGuided(q.review.id);
  }

  async function saveTopic(questionId:string,current:string){
    const topic=(editing[questionId]??current).trim();
    if(topic.length<2)return;
    const r=await fetch('/api/student/wrong-questions',{
      method:'PATCH',headers:{'content-type':'application/json'},
      body:JSON.stringify({questionId,topic})
    });
    const j=await r.json();
    if(!r.ok)return setMsg('Hata: '+(j.error||'Konu güncellenemedi.'));
    setMsg('Konu sınıflandırması güncellendi.');
    setEditing(x=>({...x,[questionId]:''}));
    await load();
  }

  const dueReviews=reviews.filter((x:any)=>new Date(x.dueAt)<=new Date());

  return <div className="wrongQuestionBank">
    {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')}>{msg}</div>}

    <div className="card wrongQuestionDueCard">
      <div className="moduleHeaderRow">
        <div><div className="moduleEyebrow">BUGÜNÜN YANLIŞ SORU GÖREVLERİ</div><h2>Tekrar günü gelen sorular</h2><p className="muted">Soruyu yeniden çöz. KEKS her soru için senin doğru/yanlış serini ve yakın dönem tekrar başarını öğrenir; güçlü hatırlamada aralığı uzatır, unutma sinyalinde tekrar tarihini öne çeker.</p></div>
        <span className="pill">{dueReviews.length} görev</span>
      </div>
      {dueReviews.length===0?<div className="notice"><strong>Bugün vadesi gelen yanlış soru yok.</strong><div className="muted">Yeni yanlış yüklediğinde 0. gün görevi hemen burada görünür.</div></div>:<div className="wrongReviewTaskList">
        {dueReviews.map((x:any)=><article className="wrongReviewTask" key={x.id}>
          <div className="wrongQuestionRowHead">
            <div><strong>{x.question.subject} · {x.question.topic}</strong><span>Aşama {x.stepIndex} · {new Date(x.dueAt).toLocaleDateString('tr-TR')}</span></div>
            <span className="pill">TEKRAR GÖREVİ</span>
          </div>
          {x.question.imageUrl&&<Image src={x.question.imageUrl} alt="Tekrar görevi yanlış soru" width={900} height={600} unoptimized className="wrongReviewTaskImage"/>}
          <p>{x.question.prompt}</p>
          {x.support&&<details style={{marginBottom:12}}>
            <summary>Önce konuyu hatırla: {x.support.subject} · {x.support.topic}</summary>
            <div className="notice" style={{marginTop:8}}>
              {x.support.topicConfirmationNeeded&&<p><strong>Konu eşleşmesi doğrulanmalı:</strong> Otomatik sınıflandırmanın güveni düşük. Konuyu aşağıdaki listeden düzenleyebilirsin.</p>}
              {x.support.acquisition&&<p><strong>Kazanım:</strong> {x.support.acquisition.id} · {x.support.acquisition.label}</p>}
              <p>Önce konunun kuralını notlarına bakmadan açıklamayı dene. Sonra soruyu çöz.</p>
            </div>
          </details>}
          <div className="reviewTextAnswer">
            <input value={reviewAnswers[x.id]||''} onChange={e=>setReviewAnswers(v=>({...v,[x.id]:e.target.value}))} placeholder="Cevabını yeniden çözerek yaz"/>
            <div className="field" style={{marginBottom:8}}>
              <label>Hata nedeni (isteğe bağlı; yanlışsa kaydedilir)</label>
              <select value={reviewReasons[x.id]||''} onChange={e=>setReviewReasons(v=>({...v,[x.id]:e.target.value}))}>
                {ERROR_REASONS.map(([value,label])=><option value={value} key={value}>{label}</option>)}
              </select>
            </div>
            <button className="btn primary" type="button" disabled={!String(reviewAnswers[x.id]||'').trim()} onClick={()=>answerReview(x.id)}>Görevi Kontrol Et</button>
          </div>
        </article>)}
      </div>}
    </div>

    {support&&<div id="keks-guided-remediation" className="card" aria-live="polite">
      <div className="moduleEyebrow">MİZA · YANLIŞTAN ÖĞRENME</div>
      <h2>{support.subject} · {support.topic}</h2>
      {support.topicConfirmationNeeded&&<div className="notice">Konu sınıflandırması düşük güvenli. Konuyu bankadan kontrol edip gerekirse düzelt.</div>}
      {support.acquisition
        ?<p><strong>Kazanım:</strong> {support.acquisition.id} · {support.acquisition.label}</p>
        :<p className="muted">Bu kayıt henüz doğrulanmış bir kazanımla eşleşmedi. Gösterilen konu etiketi başlangıç rehberidir.</p>}
      <p><strong>{support.reasonLabel||'Önerilen çalışma'}:</strong> {support.instruction}</p>
      {support.explanation
        ?<div className="notice"><strong>Yüklenen çözüm notu (doğrulama gerektirebilir):</strong> {support.explanation}</div>
        :<div className="notice">Yüklenen soruya ait doğrulanmış bir çözüm yok. İlgili beceri için ayrı hazırlanmış bir çözümlü örnek varsa aşağıdan çalışabilirsin.</div>}
      <ol>{(support.steps||[]).map((step:string,i:number)=><li key={i}>{step}</li>)}</ol>
      <div className="row" style={{flexWrap:'wrap',marginTop:12}}>
        <button type="button" className="btn primary" disabled={guidedBusy} onClick={()=>startGuided(support.reviewId)}>
          {guidedBusy?'Hazırlanıyor…':'Çözümlü Örnek ve Mini Alıştırma'}
        </button>
        <button type="button" className="btn" disabled={practiceBusy} onClick={()=>startPractice(support.reviewId)}>
          {practiceBusy?'Hazırlanıyor…':'Soru Havuzundan Farklı Soru'}
        </button>
        <button type="button" className="btn" onClick={()=>{setSupport(null);setPractice(null);setGuided(null)}}>Kapat</button>
      </div>
      {guided&&<div className="stack" style={{marginTop:14}}>
        <h3>{guided.lesson.title}</h3>
        <p className="muted">{guided.note}</p>
        <small className="muted">{guided.lesson.contentStatus==='APPROVED'
          ?'Yönetici içerik incelemesinden geçti; bağımsız uzman onayı ayrıca doğrulanmalıdır.'
          :'KEKS özgün pilot içeriği: yönetici veya uzman onayı henüz verilmedi.'}</small>
        <div className="card" style={{margin:0}}>
          <strong>Öğreneceğin beceri: {guided.lesson.skill}</strong>
          <p>{guided.lesson.explanation}</p>
          <p><strong>Sık yapılan kavram hatası:</strong> {guided.lesson.misconception}</p>
          <strong>Adım adım çözümlü örnek</strong>
          <p>{guided.lesson.worked.prompt}</p>
          <ol>{guided.lesson.worked.steps.map((step:string,i:number)=><li key={i}>{step}</li>)}</ol>
          <p><strong>Örnek cevabı:</strong> {guided.lesson.worked.answer}</p>
        </div>
        <div className="card" style={{margin:0}}>
          <strong>Şimdi sen çöz · Yeni ve farklı soru</strong>
          <p>{guided.exercise.prompt}</p>
          <div className="reviewTextAnswer">
            {guided.exercise.inputMode==='CHOICE'
              ?<div className="stack" style={{gap:5}}>
                {Object.entries(guided.exercise.options||{}).map(([letter,label])=><label key={letter} style={{display:'flex',gap:9,alignItems:'flex-start'}}>
                  <input type="radio" name={'guided-'+guided.sessionId}
                    checked={guidedAnswer===letter} disabled={Boolean(guidedResult)}
                    onChange={()=>setGuidedAnswer(letter)}/>
                  <span><strong>{letter})</strong> {String(label)}</span>
                </label>)}
              </div>
              :<input value={guidedAnswer} disabled={Boolean(guidedResult)}
                onChange={e=>setGuidedAnswer(e.target.value)}
                placeholder="Sonucu yaz (örn. 3/4, 0,75 veya 198)"/>}
            {!guidedResult&&<button type="button" className="btn primary" disabled={guidedBusy||!guidedAnswer.trim()} onClick={finishGuided}>
              {guidedBusy?'Kontrol ediliyor…':'Alıştırmayı Kontrol Et'}
            </button>}
          </div>
          {guidedResult&&<div className="notice" aria-live="polite">
            <strong>{guidedResult.correct?'Doğru!':'Yeniden deneyimle.'}</strong>
            <p>Beklenen cevap: {guidedResult.correctAnswer}</p>
            <p>{guidedResult.explanation}</p>
            <p>{guidedResult.guidance}</p>
            <small>Bu alıştırma, takvimindeki yanlış soru tekrarını otomatik tamamlamaz.</small>
          </div>}
        </div>
      </div>}
      {practice&&<div className="stack" style={{marginTop:14}}>
        <h3>{practice.quiz.title}</h3>
        {(practice.questions||[]).map((q:any,i:number)=><article key={q.id} className="card" style={{margin:0}}>
          <strong>{i+1}. {q.subject} · {q.topic}</strong>
          <p>{q.prompt}</p>
          {q.inputMode==='CHOICE'
            ?Object.entries(q.options||{}).map(([key,value])=><label key={key} style={{display:'flex',gap:8,marginBottom:8}}>
              <input type="radio" name={'remediation-'+q.id} checked={practiceAnswers[q.id]===key} onChange={()=>setPracticeAnswers(a=>({...a,[q.id]:key}))}/>
              <span>{key}) {String(value)}</span>
            </label>)
            :<input value={practiceAnswers[q.id]||''} onChange={e=>setPracticeAnswers(a=>({...a,[q.id]:e.target.value}))} placeholder="Cevabını yaz"/>}
        </article>)}
        {practiceResult
          ?<div className="notice"><strong>Pekiştirme kaydedildi.</strong> {practiceResult.correct} doğru · {practiceResult.wrong} yanlış · {practiceResult.blank} boş. Yanlışların varsa tekrar kuyruğuna alındı.</div>
          :<button type="button" className="btn primary" disabled={practiceBusy} onClick={finishPractice}>Pekiştirme Testini Kaydet</button>}
      </div>}
    </div>}

    <div className="card">
      <div className="moduleHeaderRow">
        <div><div className="moduleEyebrow">KİŞİSEL SORU BANKASI</div><h2>Otomatik tekrar testleri</h2><p className="muted">Yanlış ve işaretlediğin sorular tek havuzda tutulur. KEKS son 7 gün ve son 30 gün için dengeli tekrar setleri hazırlar.</p></div>
        <span className="pill">{items.length} soru</span>
      </div>
      <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))'}}>
        <div className="card" style={{margin:0}}>
          <strong>Haftalık Yanlışlar Testi</strong>
          <div className="kpi">{sets?.weekly?.count||0}</div>
          <p className="muted">Son 7 gündeki yanlışlardan en fazla 10 soru.</p>
          <button className="btn primary" type="button" disabled={!sets?.weekly?.count} onClick={()=>setOpenSet(openSet==='weekly'?null:'weekly')}>{openSet==='weekly'?'Kapat':'Testi Aç'}</button>
        </div>
        <div className="card" style={{margin:0}}>
          <strong>Aylık Karma Tekrar</strong>
          <div className="kpi">{sets?.monthly?.count||0}</div>
          <p className="muted">Son 30 gündeki yanlış + işaretli sorulardan ders dengeli karma set.</p>
          <button className="btn primary" type="button" disabled={!sets?.monthly?.count} onClick={()=>setOpenSet(openSet==='monthly'?null:'monthly')}>{openSet==='monthly'?'Kapat':'Tekrarı Aç'}</button>
        </div>
      </div>
      {openSet&&<div className="stack" style={{marginTop:16}}>
        {(sets?.[openSet]?.items||[]).map((q:any,i:number)=><div className="card" key={q.id} style={{margin:0}}>
          <div className="moduleHeaderRow"><strong>{i+1}. {q.subject} · {q.topic}</strong>{q.reason&&<span className="pill">{q.reason==='MARKED'?'İşaretli':'Yanlış'}</span>}</div>
          <p>{q.prompt}</p>
        </div>)}
      </div>}
    </div>

    <div id="yanlis-ekle" className="card wrongQuestionUploadCard section-anchor">
      <div className="moduleHeaderRow">
        <div>
          <div className="moduleEyebrow">GÜNLÜK YANLIŞ SORU BANKASI</div>
          <h2>Yanlış yaptığın soruyu yükle</h2>
          <p className="muted">Dersi seç, soru fotoğrafını veya metnini ekle. KEKS konuyu otomatik sınıflandırır. 0–1–3–7–14–28 gün tabanlı tekrar motoru, doğru/yanlış performansına göre sonraki aralığı kişiselleştirir.</p>
        </div>
        <span className="moduleIcon">↺</span>
      </div>

      <form className="wrongQuestionForm" onSubmit={submit}>
        <div className="field">
          <label>Sınav / grup</label>
          <input name="examType" defaultValue={defaultExam} required/>
        </div>
        <div className="field">
          <label>Kayıt nedeni</label>
          <select name="bankReason"><option value="WRONG">Yanlış yaptım</option><option value="MARKED">Sonra tekrar etmek için işaretledim</option></select>
        </div>
        {curriculumContext?.canSelectGrade&&<div className="field wrongQuestionWide">
          <label>Gerçek sınıf (gerekli)</label>
          <select name="educationGrade" value={gradeSelection} required
            onChange={e=>setGradeSelection(e.target.value)}>
            <option value="">Sınıfını seç</option>
            {(curriculumContext.availableGrades||[]).map((grade:number)=>
              <option key={grade} value={grade}>{grade}. sınıf</option>)}
          </select>
          <small className="muted">Aynı eğitim düzeyi birden fazla sınıfı içeriyor. Doğru öğrenme programını seçebilmemiz için gerçek sınıf gerekir.</small>
        </div>}
        <div className="field">
          <label>Ders</label>
          <input name="subject" list="wrong-question-subjects" required placeholder="Örn. Matematik"
            value={selectedSubject} onChange={e=>setSelectedSubject(e.target.value)}/>
          <datalist id="wrong-question-subjects">{SUBJECTS.map(x=><option value={x} key={x}/>)}</datalist>
        </div>
        <div className="field wrongQuestionWide">
          <label>Soru metni</label>
          <textarea name="questionText" rows={4} placeholder="Soruyu yazabilir veya fotoğraf yükleyebilirsin. Konu sınıflandırması soru metni/açıklamadaki kavramlardan yapılır."/>
        </div>
        <div className="field">
          <label>Soru fotoğrafı</label>
          <input name="image" type="file" accept="image/jpeg,image/png,image/webp"/>
          <small className="muted">JPG, PNG veya WebP · en fazla 5 MB</small>
        </div>
        <div className="field wrongQuestionWide">
          <label>Alt beceri / çözümlü örnek (isteğe bağlı)</label>
          <select name="practiceSkillId" key={selectedSubject} defaultValue="">
            <option value="">Otomatik öneri — uygun örnek varsa</option>
            {lessonCatalog.filter(x=>x.subject===selectedSubject).map(x=>
              <option value={x.id} key={x.id}>{x.title} · {x.contentStatus==='APPROVED'?'İçerik onaylı':'Pilot'}</option>)}
          </select>
          <small className="muted">2026–2027 {curriculumContext?.framework==='TYMM'?'TYMM':'MEB/ÖSYM'} yaklaşımı · {curriculumContext?.grade?curriculumContext.grade+'. sınıf':curriculumContext?.framework==='OSYM'?'Sınav grubu':'Sınıf seçimi bekleniyor'}. Bu eşleştirme resmî kazanım onayı değildir. Görsel sorularda beceriyi sen seçmelisin.</small>
        </div>
        <div className="field">
          <label>Senin verdiğin yanlış cevap</label>
          <input name="originalStudentAnswer" placeholder="İsteğe bağlı"/>
        </div>
        <div className="field">
          <label>Doğru cevap</label>
          <input name="correctAnswer" required placeholder="Tekrar gününde bununla kontrol edilir"/>
        </div>
        <div className="field wrongQuestionWide">
          <label>Kısa çözüm / açıklama</label>
          <textarea name="explanation" rows={3} placeholder="Neden yanlış yaptığını veya doğru çözümün kısa notunu yazabilirsin."/>
        </div>
        <button className="btn primary wrongQuestionWide" disabled={busy}>{busy?'Sınıflandırılıyor…':'Yanlış Soruyu Kaydet ve Tekrara Ekle'}</button>
      </form>
    </div>

    <div className="card">
      <div className="moduleHeaderRow">
        <div><div className="moduleEyebrow">OTOMATİK SINIFLANDIRMA</div><h2>Son yanlış sorularım</h2></div>
        <span className="pill">{items.length} kayıt</span>
      </div>
      {items.length===0?<p className="muted">Henüz kendi yanlış sorunu yüklemedin.</p>:<div className="wrongQuestionList">
        {items.slice(0,12).map((q:any)=><article className="wrongQuestionRow" key={q.id}>
          {q.imageUrl&&<Image src={q.imageUrl} alt="Yüklenen yanlış soru" width={150} height={105} unoptimized className="wrongQuestionThumb"/>}
          <div className="wrongQuestionRowBody">
            <div className="wrongQuestionRowHead">
              <div><strong>{q.subject}</strong><span>{q.examType} · {new Date(q.createdAt).toLocaleDateString('tr-TR')}</span></div>
              <div className="row"><span className="pill">{q.bankReason==='MARKED'?'İşaretli':'Yanlış'}</span><span className="pill">{Math.round((q.classificationConfidence||0)*100)}% konu eşleşmesi</span></div>
            </div>
            <p>{q.prompt}</p>
            <div className="wrongQuestionTopicEdit">
              <span>KEKS konusu:</span>
              <input value={editing[q.id]??q.topic} onChange={e=>setEditing(x=>({...x,[q.id]:e.target.value}))}/>
              <button className="btn" type="button" onClick={()=>saveTopic(q.id,q.topic)}>Konuyu Güncelle</button>
            </div>
            {q.review&&<>
              <small className="muted">Tekrar aşaması: {q.review.stepIndex} · Sonraki görev: {new Date(q.review.dueAt).toLocaleDateString('tr-TR')} · {q.review.status}</small>
              <div style={{marginTop:10}}>
                <button className="btn" type="button" disabled={guidedBusy} onClick={()=>openGuidedFromBank(q)}>Bu Konuda Çözümlü Örnek Çalış</button>
              </div>
            </>}
          </div>
        </article>)}
      </div>}
    </div>
  </div>;
}
