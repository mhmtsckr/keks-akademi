'use client';

import { FormEvent,useEffect,useState } from 'react';

export function CoachSessionWorkflow({studentId}:{studentId:string}){
  const [sessions,setSessions]=useState<any[]>([]);
  const [brief,setBrief]=useState<any>(null);
  const [selected,setSelected]=useState('');
  const [msg,setMsg]=useState('');

  async function load(){
    const r=await fetch('/api/coach/students/'+studentId+'/operations');const j=await r.json();
    if(j.ok){
      const list=(j.sessions||[]).filter((x:any)=>x.status!=='CANCELED');
      setSessions(list);
      if(!selected&&list[0])setSelected(list[0].id);
    }
    const b=await fetch('/api/coach/students/'+studentId+'/session-workflow');const bj=await b.json();if(bj.ok)setBrief(bj.brief);
  }
  useEffect(()=>{load()},[]);

  async function prepare(){
    if(!selected)return setMsg('Hata: Önce bir seans seçin.');
    const r=await fetch('/api/coach/students/'+studentId+'/session-workflow',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'prepare',sessionId:selected})});
    const j=await r.json();if(!r.ok)return setMsg('Hata: '+(j.error||'Brifing oluşturulamadı.'));
    setBrief(j.brief);setMsg('Seans brifingi güncellendi.');
  }

  async function complete(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(!selected)return setMsg('Hata: Seans seçin.');
    const fd=new FormData(e.currentTarget);
    const decisions=String(fd.get('decisions')||'').split('\n').map(x=>x.trim()).filter(Boolean);
    const follow=String(fd.get('followUpAt')||'');
    const body={action:'complete',sessionId:selected,outcome:fd.get('outcome'),decisions,nextStep:fd.get('nextStep')||undefined,followUpAt:follow?new Date(follow).toISOString():undefined,createFollowUpTask:true};
    const r=await fetch('/api/coach/students/'+studentId+'/session-workflow',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json();if(!r.ok)return setMsg('Hata: '+(j.error||'Seans kapanışı kaydedilemedi.'));
    setMsg('Seans tamamlandı; kararlar ve takip görevi kaydedildi.');e.currentTarget.reset();load();
  }

  const selectedSession=sessions.find(x=>x.id===selected);

  return <div className="coachSessionFlow">
    <div className="card">
      <div className="moduleHeaderRow"><div><div className="moduleEyebrow">SEANS ÖNCESİ</div><h2>Hazırlık Brifingi</h2><p className="muted">Son 7 gün, açık uyarılar, geciken aksiyonlar ve yanlış tekrarları tek özette.</p></div><button className="btn primary" onClick={prepare}>Brifingi Güncelle</button></div>
      <div className="field"><label>Seans</label><select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Seans seçin</option>{sessions.map(x=><option value={x.id} key={x.id}>{new Date(x.startsAt).toLocaleString('tr-TR')} · {x.title} · {x.status}</option>)}</select></div>
      {brief&&<div className="briefingGrid">
        <div className="briefMetric"><b>{brief.last7Days?.totalQuestions||0}</b><span>Son 7 gün soru</span></div>
        <div className="briefMetric"><b>{brief.dueReviews||0}</b><span>Bekleyen yanlış tekrar</span></div>
        <div className="briefMetric"><b>{brief.overdueActions?.length||0}</b><span>Geciken aksiyon</span></div>
        <div className="briefMetric"><b>{brief.activeAlerts?.length||0}</b><span>Açık uyarı</span></div>
      </div>}
      {brief?.agenda?.length>0&&<div className="briefAgenda"><h3>Görüşme gündemi</h3>{brief.agenda.map((x:string,i:number)=><div key={i}><span>{i+1}</span><p>{x}</p></div>)}</div>}
      {brief?.weakSubjects?.length>0&&<div className="row" style={{flexWrap:'wrap',marginTop:12}}>{brief.weakSubjects.map((x:any)=><span className="pill" key={x.subject}>{x.subject} · %{x.accuracy}</span>)}</div>}
    </div>

    <div className="card">
      <div className="moduleEyebrow">SEANS SONRASI</div><h2>Karar & Takip Kaydı</h2>
      <p className="muted">{selectedSession?new Date(selectedSession.startsAt).toLocaleString('tr-TR')+' · '+selectedSession.title:'Seans seçilmedi'}</p>
      <form className="form" onSubmit={complete}>
        <div className="field"><label>Seans sonucu / kısa değerlendirme</label><textarea name="outcome" rows={4} required placeholder="Ne görüldü, ne değişti, temel sonuç nedir?"/></div>
        <div className="field"><label>Alınan kararlar</label><textarea name="decisions" rows={4} placeholder={'Her kararı yeni satıra yazın\nÖrn. Matematik denemesi haftada 2 kez\nTelefon çalışma saatinde başka odada'}/></div>
        <div className="field"><label>Bir sonraki somut adım</label><input name="nextStep" placeholder="Örn. Cuma günü net analizini kontrol et"/></div>
        <div className="field"><label>Takip tarihi</label><input name="followUpAt" type="datetime-local"/></div>
        <button className="btn primary">Seansı Kapat ve Takibe Al</button>
      </form>
      {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')} style={{marginTop:12}}>{msg}</div>}
    </div>
  </div>;
}
