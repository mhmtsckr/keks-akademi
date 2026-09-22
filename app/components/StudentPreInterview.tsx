'use client';

import { FormEvent,useEffect,useState } from 'react';

export function StudentPreInterview(){
  const [data,setData]=useState<any>(null);
  const [msg,setMsg]=useState('');
  const [busy,setBusy]=useState(false);

  async function load(){
    const r=await fetch('/api/student/pre-interview',{cache:'no-store'});
    const j=await r.json();
    setData(j);
  }
  useEffect(()=>{load()},[]);

  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setMsg('');setBusy(true);
    const form=e.currentTarget;
    const fd=new FormData(form);
    const answers:Record<string,unknown>={};
    for(const q of data.form.questions)answers[q.id]=fd.get('q_'+q.id);
    const requiresTrack=['LISE_11_12','YETISKIN_MEZUN'].includes(data.form.educationBand);
    const r=await fetch('/api/student/pre-interview',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
      academicTrack:requiresTrack?fd.get('academicTrack'):'GENERAL',
      answers
    })});
    const j=await r.json();setBusy(false);
    if(!r.ok)return setMsg('Hata: '+(j.error||'Form kaydedilemedi.'));
    setMsg(j.message||'Ön görüşme yönetici onayına gönderildi.');
    await load();
    setTimeout(()=>location.reload(),700);
  }

  if(!data)return <div className="card"><p className="muted">Ön görüşme yükleniyor…</p></div>;
  if(data.locked)return <div className="card"><div className="moduleEyebrow">ÖN GÖRÜŞME</div><div className="notice">{data.reason}</div></div>;
  if(!data.form)return <div className="card"><div className="moduleEyebrow">ÖN GÖRÜŞME</div><h2>Form henüz atanmadı</h2><p className="muted">Eğilim taramasından sonra eğitim ve gelişim düzeyinize uygun açık uçlu form otomatik atanır. Atama görünmüyorsa koç bağlantınız yönetici tarafından kontrol edilir.</p></div>;

  if(data.assignment?.status==='COMPLETED'){
    return <div className="card preInterviewPending">
      <div className="moduleEyebrow">YÖNETİCİ İNCELEMESİNDE</div>
      <h2>Ön görüşmeniz tamamlandı</h2>
      <p>Eğilim taraması ile ön görüşme yanıtlarınız birlikte değerlendirildi.</p>
      <div className="notice">1 yıllık, aylık, haftalık ve günlük çalışma planı taslağınız yönetici onayı bekliyor. Onaydan sonra koçunuza gönderilecek.</div>
      {msg&&<div className="notice" style={{marginTop:10}}>{msg}</div>}
    </div>;
  }

  if(data.assignment?.status==='ADMIN_APPROVED'){
    return <div className="card preInterviewApproved">
      <div className="moduleEyebrow">YÖNETİCİ ONAYLADI</div>
      <h2>Planınız koçunuza gönderildi</h2>
      <p className="muted">Koçunuz yönetici onaylı yıllık, aylık, haftalık ve günlük planı son kez uygulama açısından kontrol edip öğrenci panelinizde aktifleştirecek.</p>
    </div>;
  }

  if(data.assignment?.status==='APPROVED'){
    return <div className="card preInterviewApproved">
      <div className="moduleEyebrow">PLAN AKTİF</div>
      <h2>Değerlendirme ve kişisel planınız yayınlandı</h2>
      <p className="muted">Koç raporunuz “Koç Raporlarım” bölümünde; günlük görevleriniz “Günlük Görevlerim” alanında görünür.</p>
    </div>;
  }

  return <div className="card">
    <div className="moduleHeaderRow">
      <div><div className="moduleEyebrow">TARAMA SONRASI OTOMATİK AÇILDI</div><h2>{data.form.title}</h2><p className="muted">Bu açık uçlu form eğitim ve gelişim düzeyinize göre otomatik seçildi. Yanıtlarınız psikometrik olarak puanlanmaz; çalışma planının bağlamsal girdisi olur ve plan taslağı önce yönetici onayına gider.</p></div>
      <span className="pill">{data.form.version}</span>
    </div>
    <form className="form preInterviewForm" onSubmit={submit}>
      {['LISE_11_12','YETISKIN_MEZUN'].includes(data.form.educationBand)&&<div className="field"><label>Hazırlık alanım</label><select name="academicTrack" required><option value="">Seçiniz</option><option value="SAYISAL">Sayısal</option><option value="ESIT_AGIRLIK">Eşit Ağırlık</option><option value="SOZEL">Sözel</option></select></div>}
      <div className="notice"><strong>Nasıl cevaplamalısınız?</strong> Soruları kendi sözlerinizle ve mümkün olduğunca somut örneklerle yanıtlayın. Doğru/yanlış cevap yoktur. Hedeflerinizi, zorlandığınız noktaları, çalışma ortamınızı ve sizde işe yarayan yöntemleri açıkça anlatın.</div>
      <div className="preInterviewQuestions">{data.form.questions.map((q:any)=><div className="preInterviewQuestion" key={q.id}>
        <div className="questionMeta"><span>{q.orderNo}</span><small>{q.dimension}</small></div>
        <div><strong>{q.prompt}</strong>
        <textarea name={'q_'+q.id} rows={4} required={q.required} placeholder="Kendi sözlerinle açıklayarak yanıtla…"/></div>
      </div>)}</div>
      <button className="btn primary" disabled={busy}>{busy?'Plan hazırlanıyor…':'Ön Görüşmeyi Tamamla ve Plan Taslağını Oluştur'}</button>
      {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')}>{msg}</div>}
    </form>
  </div>;
}
