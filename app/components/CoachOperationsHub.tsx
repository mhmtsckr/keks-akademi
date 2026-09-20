'use client';

import { FormEvent,useEffect,useMemo,useState } from 'react';

export function CoachOperationsHub({studentId}:{studentId:string}){
  const [data,setData]=useState<any>(null);
  const [msg,setMsg]=useState('');
  const [shareUrl,setShareUrl]=useState('');
  const [timeZone,setTimeZone]=useState('Europe/Istanbul');
  async function load(){const r=await fetch('/api/coach/students/'+studentId+'/operations');const j=await r.json();if(j.ok)setData(j)}
  useEffect(()=>{
    load();
    try{setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone||'Europe/Istanbul')}catch{}
  },[]);

  async function post(body:any){
    setMsg('');
    const r=await fetch('/api/coach/students/'+studentId+'/operations',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json();
    if(!r.ok){setMsg('Hata: '+(j.error||'İşlem başarısız.'));return null}
    setMsg('Kaydedildi.');await load();return j;
  }

  async function syncCalendars(){
    setMsg('Takvimler senkronize ediliyor…');
    const r=await fetch('/api/integrations/calendar/sync',{method:'POST'});const j=await r.json();
    setMsg(r.ok?'Senkronizasyon tamamlandı. Güncellenen: '+j.updated+' · Hata: '+j.errors:'Hata: '+(j.error||'Senkronizasyon başarısız.'));
    if(r.ok)load();
  }

  async function createShare(e:FormEvent<HTMLFormElement>){
    e.preventDefault();const fd=new FormData(e.currentTarget);
    const body={recipientLabel:fd.get('recipientLabel'),expiresDays:Number(fd.get('expiresDays')||30),scope:{overview:Boolean(fd.get('overview')),exams:Boolean(fd.get('exams')),actions:Boolean(fd.get('actions')),gamification:Boolean(fd.get('gamification'))}};
    const r=await fetch('/api/coach/students/'+studentId+'/share',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const j=await r.json();
    if(!r.ok)return setMsg('Hata: '+(j.error||'Paylaşım oluşturulamadı.'));
    setShareUrl(j.url);setMsg('Gizlilik kapsamlı paylaşım linki oluşturuldu.');
  }

  function session(e:FormEvent<HTMLFormElement>){
    e.preventDefault();const fd=new FormData(e.currentTarget);
    const startsAt=new Date(String(fd.get('startsAt'))).toISOString();
    const endsAt=new Date(String(fd.get('endsAt'))).toISOString();
    post({action:'session',title:fd.get('title'),startsAt,endsAt,timeZone,calendarProvider:fd.get('calendarProvider'),meetingProvider:fd.get('meetingProvider'),notes:fd.get('notes')});
  }
  function action(e:FormEvent<HTMLFormElement>){
    e.preventDefault();const fd=new FormData(e.currentTarget);
    post({
      action:'coaching_action',
      title:fd.get('title'),
      description:fd.get('description'),
      metricType:fd.get('metricType'),
      targetValue:Number(fd.get('targetValue')),
      cadence:fd.get('cadence'),
      periodStart:fd.get('periodStart'),
      periodEnd:fd.get('periodEnd'),
      subject:fd.get('subject'),
      topic:fd.get('topic'),
      taskDate:fd.get('taskDate')
    });
  }
  function analytics(e:FormEvent<HTMLFormElement>){
    e.preventDefault();const fd=new FormData(e.currentTarget);
    post({action:'analytics',examType:fd.get('examType'),subject:fd.get('subject'),topic:fd.get('topic'),questionType:fd.get('questionType')||'GENEL',correct:Number(fd.get('correct')),wrong:Number(fd.get('wrong')),blank:Number(fd.get('blank')),avgSeconds:fd.get('avgSeconds')?Number(fd.get('avgSeconds')):undefined,examDate:fd.get('examDate')||undefined});
  }
  function cohort(e:FormEvent<HTMLFormElement>){
    e.preventDefault();const fd=new FormData(e.currentTarget);const existing=String(fd.get('cohortId')||'');
    post(existing?{action:'cohort',cohortId:existing}:{action:'cohort',name:fd.get('name'),description:fd.get('description')});
  }

  const gameStats=useMemo(()=>{
    const map:any={};
    for(const a of data?.gameAttempts||[]){
      const g=a.gameContent;const key=g.gameType+'|'+g.subject+'|'+g.topic;
      if(!map[key])map[key]={gameType:g.gameType,subject:g.subject,topic:g.topic,count:0,score:0,max:0,duration:0,mistakes:0};
      const x=map[key];x.count++;x.score+=a.score;x.max+=a.maxScore;x.duration+=a.durationSeconds;
      if(Array.isArray(a.mistakes))x.mistakes+=a.mistakes.length;
    }
    return Object.values(map).map((x:any)=>({...x,success:x.max?Math.round(x.score/x.max*100):0,avgSeconds:x.count?Math.round(x.duration/x.count):0})).sort((a:any,b:any)=>a.success-b.success);
  },[data]);

  const weakness=useMemo(()=>{
    const rows=data?.analytics||[];const map:any={};
    for(const x of rows){const k=x.subject+' · '+x.topic;const total=x.correct+x.wrong+x.blank;if(!map[k])map[k]={subject:x.subject,topic:x.topic,total:0,correct:0,seconds:[]};map[k].total+=total;map[k].correct+=x.correct;if(x.avgSeconds!=null)map[k].seconds.push(x.avgSeconds)}
    return Object.values(map).map((x:any)=>({...x,accuracy:x.total?Math.round(x.correct/x.total*100):0,avgSeconds:x.seconds.length?Math.round(x.seconds.reduce((a:number,b:number)=>a+b,0)/x.seconds.length):null})).sort((a:any,b:any)=>a.accuracy-b.accuracy).slice(0,12);
  },[data]);

  if(!data)return <div className="card"><p className="muted">Koçluk operasyonları yükleniyor…</p></div>;

  return <div className="stack">
    {msg&&<div className={`notice ${msg.startsWith('Hata:')?'error':''}`}>{msg}</div>}

    <div className="card integrationCard">
      <div className="moduleHeaderRow"><div><div className="moduleEyebrow">DIŞ ENTEGRASYONLAR</div><h2>Takvim & Görüşme Sağlayıcıları</h2><p className="muted">Google Calendar, Outlook ve Zoom bağlantıları koç hesabınıza özeldir.</p></div><button className="btn" onClick={syncCalendars}>Çift Yönlü Senkronize Et</button></div>
      <div className="providerGrid">{[
        ['GOOGLE','Google Calendar / Meet','google'],
        ['OUTLOOK','Outlook Calendar','outlook'],
        ['ZOOM','Zoom','zoom']
      ].map(([p,label,slug])=>{const connected=data.connections.some((x:any)=>x.provider===p);return <div className="providerCard" key={p}><div><strong>{label}</strong><span>{connected?'Bağlı':'Bağlı değil'}</span></div>{connected?<span className="adminStatus active">BAĞLI</span>:<a className="btn primary" href={'/api/integrations/'+slug+'/start'}>Bağla</a>}</div>})}</div>
    </div>

    <div className="coachOpsGrid">
      <div className="card">
        <div className="moduleEyebrow">SEANS & REZERVASYON</div><h2>Koçluk Görüşmesi Planla</h2>
        <form className="form" onSubmit={session}>
          <div className="field"><label>Başlık</label><input name="title" defaultValue="Koçluk Görüşmesi" required/></div>
          <div className="row"><div className="field" style={{flex:1}}><label>Başlangıç</label><input name="startsAt" type="datetime-local" required/></div><div className="field" style={{flex:1}}><label>Bitiş</label><input name="endsAt" type="datetime-local" required/></div></div>
          <div className="row"><div className="field" style={{flex:1}}><label>Saat dilimi</label><input name="timeZone" value={timeZone} onChange={e=>setTimeZone(e.target.value)}/><div className="muted">Cihazınızdan otomatik algılandı.</div></div>
          <div className="field" style={{flex:1}}><label>Takvim</label><select name="calendarProvider"><option value="LOCAL">KEKS</option><option value="GOOGLE">Google Calendar</option><option value="OUTLOOK">Outlook</option></select></div></div>
          <div className="field"><label>Görüşme bağlantısı</label><select name="meetingProvider"><option value="NONE">Bağlantı yok</option><option value="GOOGLE_MEET">Google Meet</option><option value="ZOOM">Zoom</option></select></div>
          <div className="field"><label>Seans notu</label><textarea name="notes" rows={3}/></div>
          <button className="btn primary">Seansı Oluştur</button>
        </form>
      </div>

      <div className="card">
        <div className="moduleEyebrow">AKSİYON TAKİBİ</div><h2>Haftalık / Aylık Hedef Ata</h2>
        <form className="form" onSubmit={action}>
          <div className="field"><label>Aksiyon</label><input name="title" placeholder="Örn. Matematik 40 soru çöz" required/></div>
          <div className="row"><div className="field" style={{flex:1}}><label>Ders</label><input name="subject" placeholder="Matematik" required/></div><div className="field" style={{flex:1}}><label>Konu</label><input name="topic" placeholder="Problemler"/></div></div>
          <div className="field"><label>Açıklama</label><textarea name="description" rows={2}/></div>
          <div className="row"><div className="field" style={{flex:1}}><label>Ölçüm</label><select name="metricType" defaultValue="QUESTIONS"><option value="QUESTIONS">Soru</option><option value="MINUTES">Dakika</option><option value="PAGES">Sayfa</option><option value="COUNT">Adet</option></select></div><div className="field" style={{flex:1}}><label>Hedef</label><input name="targetValue" type="number" min="1" required/></div></div>
          <div className="row"><div className="field" style={{flex:1}}><label>Görev günü</label><input name="taskDate" type="date" required/></div><div className="field" style={{flex:1}}><label>Döngü</label><select name="cadence" defaultValue="DAILY"><option value="DAILY">Günlük</option><option value="WEEKLY">Haftalık</option><option value="MONTHLY">Aylık</option></select></div></div>
          <div className="row"><div className="field" style={{flex:1}}><label>Başlangıç</label><input name="periodStart" type="date" required/></div><div className="field" style={{flex:1}}><label>Bitiş</label><input name="periodEnd" type="date" required/></div></div>
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

    <div className="card">
      <div className="moduleHeaderRow"><div><div className="moduleEyebrow">OYUN & KAVRAM ANALİTİĞİ</div><h2>Mikro tekrar performansı</h2><p className="muted">Başarı oranı düşük olan kavramlar üstte gösterilir.</p></div><span className="moduleIcon">★</span></div>
      {gameStats.length===0?<p className="muted">Henüz tamamlanmış oyun yok.</p>:<div className="gameAnalyticsTable">
        <div className="gameAnalyticsHead"><span>Oyun</span><span>Ders / Konu</span><span>Deneme</span><span>Başarı</span><span>Ort. Süre</span><span>Hata</span></div>
        {gameStats.slice(0,20).map((x:any)=><div className="gameAnalyticsRow" key={x.gameType+x.subject+x.topic}><span className="pill">{x.gameType}</span><strong>{x.subject} · {x.topic}</strong><span>{x.count}</span><span className={x.success<60?'riskText':''}>%{x.success}</span><span>{x.avgSeconds} sn</span><span>{x.mistakes}</span></div>)}
      </div>}
      {data.badges?.length>0&&<div className="row" style={{marginTop:14,flexWrap:'wrap'}}>{data.badges.slice(0,8).map((b:any)=><span className="pill" key={b.id}>🏅 {b.title}</span>)}</div>}
    </div>

    <div className="coachOpsGrid">
      <div className="card"><div className="moduleEyebrow">YAKLAŞAN SEANSLAR</div><h2>Rezervasyonlar</h2>{data.sessions.length===0?<p className="muted">Henüz seans yok.</p>:data.sessions.slice(0,10).map((x:any)=><div className="sessionRow" key={x.id}><div><strong>{x.title}</strong><span>{new Date(x.startsAt).toLocaleString('tr-TR')} · {x.status} · {x.syncStatus}</span></div><div className="row">{x.meetingUrl&&<a className="btn" href={x.meetingUrl} target="_blank">Görüşmeye Katıl</a>}{x.status!=='COMPLETED'&&<button className="btn" onClick={()=>post({action:'session_status',sessionId:x.id,status:'COMPLETED'})}>Tamamlandı</button>}</div></div>)}</div>
      <div className="card"><div className="moduleEyebrow">AKSİYONLAR</div><h2>İlerleme</h2>{data.actions.length===0?<p className="muted">Aksiyon yok.</p>:data.actions.slice(0,12).map((x:any)=>{const pct=Math.min(100,Math.round((x.currentValue/x.targetValue)*100));return <div className="actionProgress" key={x.id}><div><strong>{x.title}</strong><span>{x.currentValue} / {x.targetValue} · {x.cadence}</span></div><div className="goldProgress"><i style={{width:pct+'%'}}/></div></div>})}</div>
    </div>

    <div className="coachOpsGrid">
      <div className="card"><div className="moduleEyebrow">KAPALI KOHORT</div><h2>Topluluk Grubu</h2><form className="form" onSubmit={cohort}><div className="field"><label>Mevcut kohorta ekle</label><select name="cohortId"><option value="">Yeni kohort oluştur</option>{data.cohorts.map((x:any)=><option key={x.id} value={x.id}>{x.name}</option>)}</select></div><input name="name" placeholder="Yeni kohort adı"/><textarea name="description" rows={2} placeholder="Kohort açıklaması"/><button className="btn primary">Öğrenciyi Kohorta Ekle</button></form></div>
      <div className="card"><div className="moduleEyebrow">VELİ / İK PAYLAŞIMI</div><h2>Gizlilik Kapsamlı Link</h2><form className="form" onSubmit={createShare}><input name="recipientLabel" placeholder="Örn. Veli / İK Yöneticisi" required/><div className="row"><label><input type="checkbox" name="overview" defaultChecked/> Genel</label><label><input type="checkbox" name="exams" defaultChecked/> Denemeler</label><label><input type="checkbox" name="actions" defaultChecked/> Aksiyonlar</label><label><input type="checkbox" name="gamification"/> XP</label></div><div className="field"><label>Geçerlilik (gün)</label><input name="expiresDays" type="number" min="1" max="365" defaultValue="30"/></div><button className="btn primary">Paylaşım Linki Oluştur</button>{shareUrl&&<div className="notice"><strong>Link:</strong><br/><a href={shareUrl} target="_blank">{shareUrl}</a></div>}</form></div>
    </div>
  </div>;
}
