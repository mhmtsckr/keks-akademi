'use client';

import {FormEvent,useEffect,useState} from 'react';

export function StudentResourceTracker(){
  const [resources,setResources]=useState<any[]>([]);
  const [msg,setMsg]=useState('');
  const [busy,setBusy]=useState(false);

  async function load(){
    const r=await fetch('/api/student/resources',{cache:'no-store'});
    const j=await r.json();
    if(!r.ok){setMsg('Hata: '+(j.error||'Kaynaklar yüklenemedi.'));return}
    setResources(j.resources||[]);
  }
  useEffect(()=>{void load()},[]);

  async function create(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setMsg('');
    try{
      const fd=new FormData(e.currentTarget);
      const total=String(fd.get('totalPages')||'').trim();
      const body={
        action:'create',
        title:String(fd.get('title')||''),
        examType:String(fd.get('examType')||''),
        subject:String(fd.get('subject')||''),
        publisher:String(fd.get('publisher')||'')||null,
        totalPages:total?Number(total):null
      };
      const r=await fetch('/api/student/resources',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
      const j=await r.json();
      if(!r.ok){setMsg('Hata: '+(j.error||'Kaynak eklenemedi.'));return}
      e.currentTarget.reset();setMsg(j.message);await load();
    }finally{setBusy(false)}
  }

  async function progress(e:FormEvent<HTMLFormElement>,resourceId:string){
    e.preventDefault();setBusy(true);setMsg('');
    try{
      const fd=new FormData(e.currentTarget);
      const n=(name:string)=>{const v=String(fd.get(name)||'').trim();return v?Number(v):null};
      const body={
        action:'progress',resourceId,
        topic:String(fd.get('topic')||'')||null,
        pageStart:n('pageStart'),pageEnd:n('pageEnd'),
        questions:Number(fd.get('questions')||0),
        correct:Number(fd.get('correct')||0),
        wrong:Number(fd.get('wrong')||0),
        blank:Number(fd.get('blank')||0)
      };
      const r=await fetch('/api/student/resources',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
      const j=await r.json();
      if(!r.ok){setMsg('Hata: '+(j.error||'İlerleme kaydedilemedi.'));return}
      e.currentTarget.reset();setMsg(j.message);await load();
    }finally{setBusy(false)}
  }

  return <div className="stack">
    {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')}>{msg}</div>}
    <div className="card">
      <div className="moduleEyebrow">KAYNAK TAKİP SİSTEMİ</div>
      <h2>Kullandığın kitabı çalışma verisine dönüştür</h2>
      <p className="muted">Kaynak → konu → çözülen sayfa → soru → doğruluk zinciri koç paneline de yansır.</p>
      <form className="grid" onSubmit={create} style={{gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))'}}>
        <label className="field"><span>Kaynak adı</span><input name="title" required placeholder="Örn. TYT Matematik Soru Bankası"/></label>
        <label className="field"><span>Sınav</span><input name="examType" required placeholder="TYT"/></label>
        <label className="field"><span>Ders</span><input name="subject" required placeholder="Matematik"/></label>
        <label className="field"><span>Yayınevi</span><input name="publisher" placeholder="İsteğe bağlı"/></label>
        <label className="field"><span>Toplam sayfa</span><input name="totalPages" type="number" min="1" max="10000"/></label>
        <div className="field" style={{justifyContent:'end'}}><button className="btn primary" disabled={busy}>Kaynağı Ekle</button></div>
      </form>
    </div>

    {resources.length===0?<div className="notice">Henüz takip edilen kaynak yok.</div>:resources.map(resource=><div className="card" key={resource.id}>
      <div className="moduleHeaderRow">
        <div><div className="moduleEyebrow">{resource.examType} · {resource.subject}</div><h3>{resource.title}</h3><p className="muted">{resource.publisher||'Yayınevi belirtilmedi'}{resource.currentPage?' · Son sayfa '+resource.currentPage:''}</p></div>
        <span className="pill">{resource.accuracy==null?'Yeni':'%'+resource.accuracy+' doğruluk'}</span>
      </div>
      {resource.pageProgress!=null&&<div className="notice"><strong>Sayfa ilerlemesi:</strong> %{resource.pageProgress} · Toplam {resource.questions} soru</div>}
      {resource.paceSignal&&<div className="notice"><strong>Kaynak tempo sinyali:</strong> {resource.paceSignal}</div>}
      <details>
        <summary>Bu kaynağa çalışma kaydı ekle</summary>
        <form className="grid" onSubmit={e=>progress(e,resource.id)} style={{gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',marginTop:12}}>
          <label className="field"><span>Konu</span><input name="topic" placeholder="Problemler"/></label>
          <label className="field"><span>Başlangıç sayfa</span><input name="pageStart" type="number" min="1"/></label>
          <label className="field"><span>Bitiş sayfa</span><input name="pageEnd" type="number" min="1"/></label>
          <label className="field"><span>Soru</span><input name="questions" type="number" min="0" required/></label>
          <label className="field"><span>Doğru</span><input name="correct" type="number" min="0" required/></label>
          <label className="field"><span>Yanlış</span><input name="wrong" type="number" min="0" required/></label>
          <label className="field"><span>Boş</span><input name="blank" type="number" min="0" required/></label>
          <div className="field" style={{justifyContent:'end'}}><button className="btn primary" disabled={busy}>Kaydet</button></div>
        </form>
      </details>
      {resource.recentEntries?.length>0&&<details style={{marginTop:10}}><summary>Son kaynak çalışmaları</summary><div className="stack" style={{marginTop:8}}>{resource.recentEntries.map((x:any)=><div className="row" key={x.id} style={{justifyContent:'space-between'}}><span>{new Date(x.date).toLocaleDateString('tr-TR')} · {x.topic||'Genel'} · s. {x.pageStart||'—'}–{x.pageEnd||'—'}</span><span>{x.questions} soru · {x.correct}D {x.wrong}Y {x.blank}B</span></div>)}</div></details>}
    </div>)}
  </div>;
}
