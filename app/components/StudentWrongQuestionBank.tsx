'use client';

import Image from 'next/image';
import { FormEvent,useEffect,useState } from 'react';

const SUBJECTS=[
  'Matematik','Türkçe','Türk Dili ve Edebiyatı','Tarih','Coğrafya',
  'Eğitim Bilimleri','Mevzuat','Fizik','Kimya','Biyoloji',
  'Geometri','Felsefe','Din Kültürü','İngilizce'
];

export function StudentWrongQuestionBank({defaultExam}:{defaultExam:string}){
  const [items,setItems]=useState<any[]>([]);
  const [reviews,setReviews]=useState<any[]>([]);
  const [reviewAnswers,setReviewAnswers]=useState<Record<string,string>>({});
  const [msg,setMsg]=useState('');
  const [busy,setBusy]=useState(false);
  const [editing,setEditing]=useState<Record<string,string>>({});

  async function load(){
    const [wr,rr]=await Promise.all([
      fetch('/api/student/wrong-questions',{cache:'no-store'}),
      fetch('/api/student/reviews',{cache:'no-store'})
    ]);
    const [wj,rj]=await Promise.all([wr.json(),rr.json()]);
    if(wr.ok)setItems(wj.items||[]);
    if(rr.ok)setReviews((rj.items||[]).filter((x:any)=>String(x.question?.sourceKind||'').startsWith('STUDENT_WRONG:')));
  }
  useEffect(()=>{load()},[]);

  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setMsg('');
    const form=e.currentTarget;
    const fd=new FormData(form);
    if(!fd.get('examType'))fd.set('examType',defaultExam);
    const r=await fetch('/api/student/wrong-questions',{method:'POST',body:fd});
    const j=await r.json();setBusy(false);
    if(!r.ok)return setMsg('Hata: '+(j.error||'Yanlış soru yüklenemedi.'));
    setMsg(j.message+' · Tekrar döngüsü: 0–1–3–7–14–28 gün.');
    form.reset();
    await load();
  }

  async function answerReview(id:string){
    const answer=String(reviewAnswers[id]||'').trim();
    if(!answer)return;
    const r=await fetch('/api/student/reviews',{
      method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({id,answer})
    });
    const j=await r.json();
    if(!r.ok)return setMsg('Hata: '+(j.error||'Tekrar görevi kaydedilemedi.'));
    setReviewAnswers(x=>({...x,[id]:''}));
    setMsg(j.correct
      ? (j.completed?'Doğru. Bu yanlış soru için 0–1–3–7–14–28 tekrar döngüsü tamamlandı.':'Doğru. Bir sonraki tekrar günü otomatik planlandı.')
      : 'Tekrar yanlış. Doğru cevap: '+j.correctAnswer+(j.explanation?' · '+j.explanation:'')+' · Döngü 0. güne döndü.');
    await load();
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
        <div><div className="moduleEyebrow">BUGÜNÜN YANLIŞ SORU GÖREVLERİ</div><h2>Tekrar günü gelen sorular</h2><p className="muted">Soruyu yeniden çöz. Doğru cevap bir sonraki aşamaya geçirir; tekrar yanlışsa döngü 0. güne döner.</p></div>
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
          <div className="reviewTextAnswer">
            <input value={reviewAnswers[x.id]||''} onChange={e=>setReviewAnswers(v=>({...v,[x.id]:e.target.value}))} placeholder="Cevabını yeniden çözerek yaz"/>
            <button className="btn primary" type="button" disabled={!String(reviewAnswers[x.id]||'').trim()} onClick={()=>answerReview(x.id)}>Görevi Kontrol Et</button>
          </div>
        </article>)}
      </div>}
    </div>

    <div className="card wrongQuestionUploadCard">
      <div className="moduleHeaderRow">
        <div>
          <div className="moduleEyebrow">GÜNLÜK YANLIŞ SORU BANKASI</div>
          <h2>Yanlış yaptığın soruyu yükle</h2>
          <p className="muted">Dersi seç, soru fotoğrafını veya metnini ekle. KEKS konuyu otomatik sınıflandırır ve soruyu 0–1–3–7–14–28 gün tekrar görevine dönüştürür.</p>
        </div>
        <span className="moduleIcon">↺</span>
      </div>

      <form className="wrongQuestionForm" onSubmit={submit}>
        <div className="field">
          <label>Sınav / grup</label>
          <input name="examType" defaultValue={defaultExam} required/>
        </div>
        <div className="field">
          <label>Ders</label>
          <input name="subject" list="wrong-question-subjects" required placeholder="Örn. Matematik"/>
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
              <span className="pill">{Math.round((q.classificationConfidence||0)*100)}% konu eşleşmesi</span>
            </div>
            <p>{q.prompt}</p>
            <div className="wrongQuestionTopicEdit">
              <span>KEKS konusu:</span>
              <input value={editing[q.id]??q.topic} onChange={e=>setEditing(x=>({...x,[q.id]:e.target.value}))}/>
              <button className="btn" type="button" onClick={()=>saveTopic(q.id,q.topic)}>Konuyu Güncelle</button>
            </div>
            {q.review&&<small className="muted">Tekrar aşaması: {q.review.stepIndex} · Sonraki görev: {new Date(q.review.dueAt).toLocaleDateString('tr-TR')} · {q.review.status}</small>}
          </div>
        </article>)}
      </div>}
    </div>
  </div>;
}
