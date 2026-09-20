'use client';

import { FormEvent,useEffect,useMemo,useState } from 'react';

export function CoachOperationsHub({studentId}:{studentId:string}){
  const [data,setData]=useState<any>(null);
  const [msg,setMsg]=useState('');
  async function load(){const r=await fetch('/api/coach/students/'+studentId+'/operations');const j=await r.json();if(j.ok)setData(j)}
  useEffect(()=>{load()},[]);

  async function post(body:any){
    setMsg('');
    const r=await fetch('/api/coach/students/'+studentId+'/operations',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json();
    if(!r.ok){setMsg('Hata: '+(j.error||'İşlem başarısız.'));return}
    setMsg('Kaydedildi.');await load();
  }

  function session(e:FormEvent<HTMLFormElement>){
    e.preventDefault();const fd=new FormData(e.currentTarget);
    post({action:'session',title:fd.get('title'),startsAt:fd.get('startsAt'),endsAt:fd.get('endsAt'),timeZone:fd.get('timeZone'),calendarProvider:fd.get('calendarProvider'),meetingProvider:fd.get('meetingProvider'),notes:fd.get('notes')});
  }
  function action(e:FormEvent<HTMLFormElement>){
    e.preventDefault();const fd=new FormData(e.currentTarget);
    post({action:'coaching_action',title:fd.get('title'),description:fd.get('description'),metricType:fd.get('metricType'),targetValue:Number(fd.get('targetValue')),cadence:fd.get('cadence'),periodStart:fd.get('periodStart'),periodEnd:fd.get('periodEnd')});
  }
  function analytics(e:FormEvent<HTMLFormElement>){
    e.preventDefault();const fd=new FormData(e.currentTarget);
    post({action:'analytics',examType:fd.get('examType'),subject:fd.get('subject'),topic:fd.get('topic'),questionType:fd.get('questionType')||'GENEL',correct:Number(fd.get('correct')),wrong:Number(fd.get('wrong')),blank:Number(fd.get('blank')),avgSeconds:fd.get('avgSeconds')?Number(fd.get('avgSeconds')):undefined,examDate:fd.get('examDate')||undefined});
  }

  const weakness=useMemo(()=>{
    const rows=data?.analytics||[];const map:any={};
    for(const x of rows){const k=x.subject+' · '+x.topic;const total=x.correct+x.wrong+x.blank;const acc=total?x.correct/total:0;if(!map[k])map[k]={subject:x.subject,topic:x.topic,total:0,correct:0,seconds:[]};map[k].total+=total;map[k].correct+=x.correct;if(x.avgSeconds!=null)map[k].seconds.push(x.avgSeconds)}
    return Object.values(map).map((x:any)=>({...x,accuracy:x.total?Math.round(x.correct/x.total*100):0,avgSeconds:x.seconds.length?Math.round(x.seconds.reduce((a:number,b:number)=>a+b,0)/x.seconds.length):null})).sort((a:any,b:any)=>a.accuracy-b.accuracy).slice(0,12);
  },[data]);

  if(!data)return <div className="card"><p className="muted">Koçluk operasyonları yükleniyor…</p></div>;
  return <div className="stack">
    {msg&&<div className={`notice ${msg.startsWith('Hata:')?'error':''}`}>{msg}</div>}

    <div className="coachOpsGrid">
      <div className="card">
        <div className="moduleEyebrow">SEANS & REZERVASYON</div><h2>Koçluk Görüşmesi Planla</h2>
        <form className="form" onSubmit={session}>
          <div className="field"><label>Başlık</label><input name="title" defaultValue="Koçluk Görüşmesi" required/></div>
          <div className="row"><div className="field" style={{flex:1}}><label>Başlangıç</label><input name="startsAt" type="datetime-local" required/></div><div className="field" style={{flex:1}}><label>Bitiş</label><input name="endsAt" type="datetime-local" required/></div></div>
          <div className="row"><div className="field" style={{flex:1}}><label>Saat dilimi</label><select name="timeZone" defaultValue="Europe/Istanbul"><option>Europe/Istanbul</option><option>Europe/London</option><option>America/New_York</option><option>Asia/Dubai</option></select></div>
          <div className="field" style={{flex:1}}><label>Takvim</label><select name="calendarProvider"><option value="LOCAL">KEKS</option><option value="GOOGLE">Google Calendar</option><option value="OUTLOOK">Outlook</option></select></div></div>
          <div className="field"><label>Görüşme bağlantısı</label><select name="meetingProvider"><option value="NONE">Bağlantı yok</option><option value="GOOGLE_MEET">Google Meet</option><option value="ZOOM">Zoom</option></select></div>
          <div className="field"><label>Seans notu</label><textarea name="notes" rows={3}/></div>
          <button className="btn primary">Seansı Oluştur</button>
        </form>
        <div className="connectionStatus">{['GOOGLE','OUTLOOK','ZOOM'].map(p=><span className="pill" key={p}>{p}: {data.connections.some((x:any)=>x.provider===p)?'Bağlı':'Bağlı değil'}</span>)}</div>
      </div>

      <div className="card">
        <div className="moduleEyebrow">AKSİYON TAKİBİ</div><h2>Haftalık / Aylık Hedef Ata</h2>
        <form className="form" onSubmit={action}>
          <div className="field"><label>Aksiyon</label><input name="title" placeholder="Örn. 400 soru çöz" required/></div>
          <div className="field"><label>Açıklama</label><textarea name="description" rows={2}/></div>
          <div className="row"><div className="field" style={{flex:1}}><label>Ölçüm</label><select name="metricType"><option value="QUESTIONS">Soru</option><option value="MINUTES">Dakika</option><option value="PAGES">Sayfa</option><option value="COUNT">Adet</option></select></div><div className="field" style={{flex:1}}><label>Hedef</label><input name="targetValue" type="number" min="1" required/></div></div>
          <div className="row"><div className="field" style={{flex:1}}><label>Döngü</label><select name="cadence"><option value="WEEKLY">Haftalık</option><option value="MONTHLY">Aylık</option></select></div><div className="field" style={{flex:1}}><label>Başlangıç</label><input name="periodStart" type="date" required/></div><div className="field" style={{flex:1}}><label>Bitiş</label><input name="periodEnd" type="date" required/></div></div>
          <button className="btn primary">Aksiyon Ata</button>
        </form>
      </div>
    </div>

    <div className="card">
      <div className="moduleEyebrow">EKSİK HARİTASI</div><h2>Test / Deneme Analitiği Ekle</h2>
      <form className="form analyticsEntryForm" onSubmit={analytics}>
        <input name="examType" placeholder="TYT / AYT / LGS" required/><input name="subject" placeholder="Ders" required/><input name="topic" placeholder="Konu" required/><input name="questionType" placeholder="Soru tipi"/><input name="correct" type="number" min="0" placeholder="Doğru" required/><input name="wrong" type="number" min="0" placeholder="Yanlış" required/><input name="blank" type="number" min="0" placeholder="Boş" required/><input name="avgSeconds" type="number" min="0" placeholder="Ort. sn"/><input name="examDate" type="date"/><button className="btn primary">Analize Ekle</button>
      </form>
      <div className="weaknessMap">{weakness.map((x:any)=><div className="weaknessItem" key={x.subject+x.topic}><div><strong>{x.subject}</strong><span>{x.topic}</span></div><div className="weaknessBar"><i style={{width:x.accuracy+'%'}}/></div><b>%{x.accuracy}</b>{x.avgSeconds!=null&&<small>{x.avgSeconds} sn/soru</small>}</div>)}</div>
    </div>

    <div className="coachOpsGrid">
      <div className="card"><div className="moduleEyebrow">YAKLAŞAN SEANSLAR</div><h2>Rezervasyonlar</h2>{data.sessions.length===0?<p className="muted">Henüz seans yok.</p>:data.sessions.slice(0,10).map((x:any)=><div className="sessionRow" key={x.id}><div><strong>{x.title}</strong><span>{new Date(x.startsAt).toLocaleString('tr-TR')} · {x.syncStatus}</span></div>{x.meetingUrl&&<a className="btn" href={x.meetingUrl} target="_blank">Görüşmeye Katıl</a>}</div>)}</div>
      <div className="card"><div className="moduleEyebrow">AKSİYONLAR</div><h2>İlerleme</h2>{data.actions.length===0?<p className="muted">Aksiyon yok.</p>:data.actions.slice(0,12).map((x:any)=>{const pct=Math.min(100,Math.round((x.currentValue/x.targetValue)*100));return <div className="actionProgress" key={x.id}><div><strong>{x.title}</strong><span>{x.currentValue} / {x.targetValue} · {x.cadence}</span></div><div className="goldProgress"><i style={{width:pct+'%'}}/></div></div>})}</div>
    </div>
  </div>;
}
