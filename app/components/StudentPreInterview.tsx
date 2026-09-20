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
    for(const q of data.form.questions){
      const v=fd.get('q_'+q.id);
      answers[q.id]=v;
    }
    const r=await fetch('/api/student/pre-interview',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
      academicTrack:fd.get('academicTrack'),
      answers
    })});
    const j=await r.json();setBusy(false);
    if(!r.ok)return setMsg('Hata: '+(j.error||'Form kaydedilemedi.'));
    setMsg('Ön görüşme tamamlandı. Değerlendirme raporu koçunuza iletildi ve alanınıza göre günlük/haftalık/aylık planınız oluşturuldu.');
    await load();
  }

  if(!data)return <div className="card"><p className="muted">Ön görüşme yükleniyor…</p></div>;
  if(data.locked)return <div className="card"><div className="notice">{data.reason}</div></div>;
  if(!data.form)return <div className="card"><div className="moduleEyebrow">ÖN GÖRÜŞME</div><h2>Form henüz yüklenmedi</h2><p className="muted">Ön görüşme soru linki sisteme aktarıldığında sorular burada otomatik açılacak.</p></div>;

  return <div className="card">
    <div className="moduleHeaderRow">
      <div><div className="moduleEyebrow">AKTİF FORM</div><h2>{data.form.title}</h2><p className="muted">Yanıtlarınız koçunuz tarafından soru-cevap bazında görülebilir.</p></div>
      {data.latest&&<span className="pill">Son tamamlanma: {new Date(data.latest.completedAt).toLocaleDateString('tr-TR')}</span>}
    </div>
    <form className="form preInterviewForm" onSubmit={submit}>
      <div className="field"><label>Hazırlık alanım</label><select name="academicTrack" defaultValue={data.latest?.academicTrack||''} required><option value="">Seçiniz</option><option value="SAYISAL">Sayısal</option><option value="ESIT_AGIRLIK">Eşit Ağırlık</option><option value="SOZEL">Sözel</option></select></div>
      <div className="preInterviewQuestions">{data.form.questions.map((q:any)=><div className="preInterviewQuestion" key={q.id}>
        <div className="questionMeta"><span>{q.orderNo}</span><small>{q.dimension}</small></div>
        <div><strong>{q.prompt}</strong>
        {q.responseType==='TEXT'?<textarea name={'q_'+q.id} rows={3} required={q.required}/>:q.responseType==='CHOICE'&&Array.isArray(q.options)?<select name={'q_'+q.id} required={q.required}><option value="">Seçiniz</option>{q.options.map((o:any)=><option key={String(o.value??o)} value={String(o.value??o)}>{String(o.label??o)}</option>)}</select>:<div className="likertRow">{[1,2,3,4,5].map(n=><label key={n}><input type="radio" name={'q_'+q.id} value={n} required={q.required}/><span>{n}</span></label>)}</div>}</div>
      </div>)}</div>
      <button className="btn primary" disabled={busy}>{busy?'Değerlendiriliyor…':'Formu Tamamla ve Planımı Oluştur'}</button>
      {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')}>{msg}</div>}
    </form>
  </div>;
}
