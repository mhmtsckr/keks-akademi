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
  const [msg,setMsg]=useState('');
  const [busy,setBusy]=useState(false);
  const [editing,setEditing]=useState<Record<string,string>>({});

  async function load(){
    const r=await fetch('/api/student/wrong-questions',{cache:'no-store'});
    const j=await r.json();
    if(r.ok)setItems(j.items||[]);
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

  return <div className="wrongQuestionBank">
    {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')}>{msg}</div>}

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
