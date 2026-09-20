'use client';

import { FormEvent,useEffect,useState } from 'react';

export function StudentPreInterview(){
  const [data,setData]=useState<any>(null);
  const [msg,setMsg]=useState('');
  const [busy,setBusy]=useState(false);

  async function load(){
    const r=await fetch('/api/student/pre-interview');
    const j=await r.json();
    setData(j);
  }
  useEffect(()=>{load()},[]);

  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setMsg('');setBusy(true);
    const fd=new FormData(e.currentTarget);
    const answers:Record<string,unknown>={};
    for(const q of data.form.questions)answers[q.id]=fd.get('q_'+q.id);
    const r=await fetch('/api/student/pre-interview',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
      academicTrack:fd.get('academicTrack'),
      answers
    })});
    const j=await r.json();setBusy(false);
    if(!r.ok)return setMsg('Hata: '+(j.error||'Form kaydedilemedi.'));
    setMsg('Ön görüşme tamamlandı. Sonuçlarınız önce koçunuza gönderildi. Koçunuz onay verirse değerlendirme raporu ve kişisel planınız öğrenci panelinizde açılacak.');
    await load();
  }

  if(!data)return <div className="card"><p className="muted">Ön görüşme yükleniyor…</p></div>;
  if(data.locked)return <div className="card"><div className="notice">{data.reason}</div></div>;
  if(!data.form)return <div className="card"><div className="moduleEyebrow">ÖN GÖRÜŞME</div><h2>Form henüz yüklenmedi</h2><p className="muted">Ön görüşme soruları sisteme aktarıldığında ve koçunuz size açtığında burada görünecek.</p></div>;

  if(data.assignment?.status==='COMPLETED'){
    return <div className="card preInterviewPending">
      <div className="moduleEyebrow">KOÇ İNCELEMESİNDE</div>
      <h2>Ön görüşmeniz tamamlandı</h2>
      <p>Yanıtlarınız ve değerlendirme raporunuz koçunuza iletildi.</p>
      <div className="notice">Koçunuz “Öğrenciye Gönder ve Planı Aktifleştir” onayı vermeden sonuç raporu ve plan size gösterilmez.</div>
      {msg&&<div className="notice" style={{marginTop:10}}>{msg}</div>}
    </div>;
  }

  if(data.assignment?.status==='APPROVED'){
    return <div className="card preInterviewApproved">
      <div className="moduleEyebrow">KOÇ ONAYLADI</div>
      <h2>Değerlendirme ve kişisel planınız yayınlandı</h2>
      <p className="muted">Koç raporunuz “Koç Raporlarım” bölümünde; günlük görevleriniz ise “Günlük Görevlerim” alanında görünür.</p>
    </div>;
  }

  return <div className="card">
    <div className="moduleHeaderRow">
      <div><div className="moduleEyebrow">KOÇUNUZ TARAFINDAN AÇILDI</div><h2>{data.form.title}</h2><p className="muted">Yanıtlarınız önce yalnız koçunuz tarafından incelenir.</p></div>
      <span className="pill">{data.form.version}</span>
    </div>
    <form className="form preInterviewForm" onSubmit={submit}>
      <div className="field"><label>Hazırlık alanım</label><select name="academicTrack" required><option value="">Seçiniz</option><option value="SAYISAL">Sayısal</option><option value="ESIT_AGIRLIK">Eşit Ağırlık</option><option value="SOZEL">Sözel</option></select></div>
      <div className="preInterviewQuestions">{data.form.questions.map((q:any)=><div className="preInterviewQuestion" key={q.id}>
        <div className="questionMeta"><span>{q.orderNo}</span><small>{q.dimension}</small></div>
        <div><strong>{q.prompt}</strong>
        {q.responseType==='TEXT'?<textarea name={'q_'+q.id} rows={3} required={q.required}/>:q.responseType==='CHOICE'&&Array.isArray(q.options)?<select name={'q_'+q.id} required={q.required}><option value="">Seçiniz</option>{q.options.map((o:any)=><option key={String(o.value??o)} value={String(o.value??o)}>{String(o.label??o)}</option>)}</select>:<div className="likertRow">{[1,2,3,4,5].map(n=><label key={n}><input type="radio" name={'q_'+q.id} value={n} required={q.required}/><span>{n}</span></label>)}</div>}</div>
      </div>)}</div>
      <button className="btn primary" disabled={busy}>{busy?'Değerlendiriliyor…':'Formu Tamamla ve Koçuma Gönder'}</button>
      {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')}>{msg}</div>}
    </form>
  </div>;
}
