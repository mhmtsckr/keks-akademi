'use client';

import {useEffect,useMemo,useState} from 'react';
import {useRouter} from 'next/navigation';

type Student={
  id:string;fullName:string;studentCode:string;gradeLevel:string|null;priorityScore:number;
  priorityLevel:'HIGH'|'MEDIUM'|'LOW';reasons:string[];suggestedAction:string;
  overdueActions:number;dueReviews:number;openAlerts:number;
};
type Planned={studentId:string;studentName:string;date:string;kind:'PRACTICE'|'REVIEW'|'COACH_CHECK';minutes:number;priority:'HIGH'|'MEDIUM'|'LOW';reason:string};
const dateKey=(d:Date)=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
const dayLabel=(date:string)=>new Date(date+'T12:00:00+03:00').toLocaleDateString('tr-TR',{timeZone:'Europe/Istanbul',weekday:'short',day:'2-digit',month:'short'});
const upcoming=()=>Array.from({length:7},(_,i)=>dateKey(new Date(Date.now()+i*86400000)));
const taskName=(kind:Planned['kind'])=>kind==='REVIEW'?'Gecikmeli tekrar':kind==='PRACTICE'?'Yeni soruyla ölçüm':'Koç değerlendirmesi';

export function CoachFocusPlanner({students}:{students:Student[]}){
  const router=useRouter();
  const [days,setDays]=useState<string[]>([]);
  const [capacity,setCapacity]=useState(60);
  const [override,setOverride]=useState<Record<string,string>>({});
  const [confirmed,setConfirmed]=useState(false);
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('');
  const [existing,setExisting]=useState<any[]>([]);
  const [tab,setTab]=useState<'plan'|'load'|'alerts'>('plan');
  const [now,setNow]=useState(0);
  useEffect(()=>{setDays(upcoming().filter(x=>{const dow=new Date(x+'T12:00:00+03:00').getUTCDay();return dow!==0&&dow!==6;}))},[]);
  useEffect(()=>{
    fetch('/api/coach/focus-plan',{cache:'no-store'}).then(r=>r.json()).then(j=>{if(j.ok)setExisting(j.coachTasks||[])}).catch(()=>{});
    const timer=setInterval(()=>{setNow(v=>v+1);router.refresh()},120000);
    return ()=>clearInterval(timer);
  },[router]);
  const dates=useMemo(()=>upcoming(),[now]);
  const proposed=useMemo(()=>{
    const loads:Record<string,number>=Object.fromEntries(dates.map(d=>[d,0]));
    const planned:Planned[]=[];
    const unassigned:Student[]=[];
    const eligible=students.filter(s=>s.priorityScore>0||s.dueReviews>0||s.overdueActions>0);
    for(const s of [...eligible].sort((a,b)=>b.priorityScore-a.priorityScore)){
      const minutes=s.priorityLevel==='HIGH'?30:s.priorityLevel==='MEDIUM'?20:15;
      const kind:Planned['kind']=s.dueReviews>0?'REVIEW':s.overdueActions>0?'PRACTICE':'COACH_CHECK';
      const forced=override[s.id];
      const available=forced?[forced]:days.filter(d=>dates.includes(d)).sort((a,b)=>(loads[a]||0)-(loads[b]||0)||a.localeCompare(b));
      const date=available.find(d=>days.includes(d)&&(loads[d]||0)+minutes<=capacity);
      if(!date){unassigned.push(s);continue}
      loads[date]=(loads[date]||0)+minutes;
      planned.push({studentId:s.id,studentName:s.fullName,date,kind,minutes,priority:s.priorityLevel,reason:s.reasons.join(' · ').slice(0,240)||s.suggestedAction||'Rutin öğrenme kontrolü'});
    }
    return {planned,unassigned,loads};
  },[students,days,capacity,override,dates]);
  const total=proposed.planned.reduce((s,t)=>s+t.minutes,0);
  const overloaded=proposed.unassigned.length>0;
  const overdue=existing.filter(x=>x.status==='OPEN'&&x.dueAt&&new Date(x.dueAt).getTime()<Date.now());
  async function approve(){
    if(busy||!confirmed||overloaded||proposed.planned.length===0)return;
    setBusy(true);setMsg('');
    try{
      const response=await fetch('/api/coach/focus-plan',{method:'POST',headers:{'content-type':'application/json'},
        body:JSON.stringify({dailyCapacity:capacity,tasks:proposed.planned.map(t=>({studentId:t.studentId,date:t.date,kind:t.kind,minutes:t.minutes,priority:t.priority,reason:t.reason}))})});
      const result=await response.json();
      if(!response.ok)throw new Error(result.error||'Plan kaydedilemedi.');
      setMsg('Onaylandı: '+result.createdCoach+' koç işi, '+result.createdStudent+' öğrenci görevi oluşturuldu. '+result.skipped+' tekrar kayıt atlandı.');
      const rr=await fetch('/api/coach/focus-plan',{cache:'no-store'});const jj=await rr.json();
      if(jj.ok)setExisting(jj.coachTasks||[]);
      router.refresh();
    }catch(e){setMsg('Hata: '+(e instanceof Error?e.message:'Bağlantı hatası'))}
    finally{setBusy(false);setConfirmed(false)}
  }
  return <section className="card keksFocusPlanner" aria-label="KEKS Focus Pro haftalık koç planlayıcısı">
    <div className="keksFocusHero">
      <div className="keksFocusHeroTop"><span className="keksFocusBrand">KEKS AKADEMİ <small>KOÇ PLANLAYICI</small></span><span>{students.length} öğrenci</span></div>
      <h2>Haftalık Müdahale ve Takip</h2>
      <p>Öncelikleri karşılaştır, iş yükünü dengele ve yalnız onayladığın görevleri kaydet.</p>
    </div>
    <div className="row" role="tablist" aria-label="Planlayıcı sekmeleri">
      <button type="button" className={'btn '+(tab==='plan'?'primary':'')} onClick={()=>setTab('plan')}>Taslak plan</button>
      <button type="button" className={'btn '+(tab==='load'?'primary':'')} onClick={()=>setTab('load')}>İş yükü</button>
      <button type="button" className={'btn '+(tab==='alerts'?'primary':'')} onClick={()=>setTab('alerts')}>Uyarılar</button>
    </div>
    {tab==='plan'&&<>
      <div className="keksFocusPlannerControls">
        <label>Günlük koç kapasitesi
          <select value={capacity} onChange={e=>{setCapacity(Number(e.target.value));setConfirmed(false)}}>
            {[30,45,60,75,90,120,150,180].map(n=><option key={n} value={n}>{n} dakika</option>)}
          </select>
        </label>
        <fieldset><legend>Uygun günler</legend><div className="row">{dates.map(d=><label className="keksFocusDayOption" key={d}><input type="checkbox" checked={days.includes(d)} onChange={e=>{setDays(v=>e.target.checked?[...v,d]:v.filter(x=>x!==d));setConfirmed(false)}}/>{dayLabel(d)}</label>)}</div></fieldset>
      </div>
      <div className="keksFocusStats">
        <div><strong>{proposed.planned.length}</strong><span>Planlanan iş</span></div>
        <div><strong>{total}</strong><span>Koç dakikası</span></div>
        <div><strong>{proposed.unassigned.length}</strong><span>Yerleştirilemeyen</span></div>
        <div><strong>{existing.filter(x=>x.status==='OPEN').length}</strong><span>Onaylı açık iş</span></div>
      </div>
      {overloaded&&<div className="notice error" role="alert">{proposed.unassigned.length} öğrenci için kapasite bulunamadı: {proposed.unassigned.map(s=>s.fullName).join(', ')}. Gün veya süre değiştirin.</div>}
      <div className="keksFocusResultList">{proposed.planned.map(t=><article className="keksFocusResultRow" key={t.studentId}>
        <div className="moduleHeaderRow"><div><strong>{t.studentName}</strong><div className="muted">{taskName(t.kind)} · {t.minutes} dk · {t.priority==='HIGH'?'Yüksek':t.priority==='MEDIUM'?'Orta':'Rutin'} öncelik</div></div>
        <label>Gün
          <select aria-label={t.studentName+' için gün seç'} value={t.date} onChange={e=>{setOverride(x=>({...x,[t.studentId]:e.target.value}));setConfirmed(false)}}>{days.sort().map(d=><option key={d} value={d}>{dayLabel(d)}</option>)}</select>
        </label></div>
        <small>{t.reason}</small>
      </article>)}</div>
      <div className="notice">Gün seçimi bir takvim günü önerisidir; öğrenciyle kesin görüşme saati oluşturulmaz. Koç değerlendirme işleri öğrenciye atanmaz. Çalışma/tekrar görevleri ise onay sonrasında öğrenci paneline gider.</div>
      <label className="row"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>Planı ve öğrencilerin uygunluğunu kontrol ettim; taslağı onaylıyorum.</label>
      <button className="btn primary" type="button" onClick={approve} disabled={!confirmed||busy||overloaded||proposed.planned.length===0}>{busy?'Kaydediliyor…':'Onaylanan planı kaydet ve görevleri ata'}</button>
    </>}
    {tab==='load'&&<div className="keksFocusResultList">{dates.map(d=><div className="keksFocusResultRow" key={d}>
      <div className="moduleHeaderRow"><strong>{dayLabel(d)}</strong><span>{proposed.loads[d]||0} / {days.includes(d)?capacity:0} dk</span></div>
      <div className="keksFocusProgress"><span style={{width:days.includes(d)?Math.min(100,(proposed.loads[d]||0)/capacity*100)+'%':'0%'}}/></div>
      <small>{proposed.planned.filter(t=>t.date===d).map(t=>t.studentName).join(' · ')||'Planlı iş yok'}</small>
    </div>)}</div>}
    {tab==='alerts'&&<div className="keksFocusResultList">
      <h3>Gecikme ve öğrenme uyarıları</h3>
      {students.filter(s=>s.overdueActions||s.dueReviews||s.openAlerts).sort((a,b)=>b.priorityScore-a.priorityScore).map(s=><div className="keksFocusResultRow" key={s.id}>
        <strong>{s.fullName} · Öncelik {s.priorityScore}/100</strong>
        <span>{s.overdueActions} geciken aksiyon · {s.dueReviews} tekrar · {s.openAlerts} açık uyarı</span>
        <small>{s.reasons.join(' · ')}</small>
        <a className="btn" href={'/koc/ogrenci/'+s.id}>Öğrenciyi incele</a>
      </div>)}
      <h3>Onaylanmış geciken koç işleri ({overdue.length})</h3>
      {overdue.map(t=><div className="keksFocusResultRow" key={t.id}><strong>{t.title}</strong><span>{t.description}</span></div>)}
    </div>}
    {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')} role="status">{msg}</div>}
    <p className="muted">Öncelik, mevcut koç sinyallerinden hesaplanır. Eksik veriler kesin öğrenme açığı sayılmaz; görev tamamlanması kalıcı öğrenme kanıtı değildir.</p>
  </section>;
}
