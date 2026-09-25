'use client';

import { useMemo,useState } from 'react';

type PriorityStudent={
  id:string;fullName:string;studentCode:string;gradeLevel:string|null;
  priorityScore:number;priorityLevel:'HIGH'|'MEDIUM'|'LOW';reasons:string[];
  suggestedAction:string;
  overdueActions:number;openAlerts:number;dueReviews:number;lastActivity:string|null;
  activePlans?:number;profileReady?:boolean;screeningReady?:boolean;preInterviewReady?:boolean;
  monthlyDevelopmentReady?:boolean;hasExamData?:boolean;
};
type AgendaItem={id:string;studentId:string;studentName:string;title:string;startsAt:string;endsAt:string;meetingUrl:string|null};
type Task={id:string;title:string;description:string|null;priority:string;status:string;dueAt:string|null;student:{id:string;fullName:string}|null};

export function CoachCommandCenter({students,agenda,initialTasks}:{students:PriorityStudent[];agenda:AgendaItem[];initialTasks:Task[]}){
  const [tasks,setTasks]=useState(initialTasks);
  const [filter,setFilter]=useState<'ALL'|'HIGH'|'MEDIUM'>('ALL');

  const visible=useMemo(()=>students.filter(s=>filter==='ALL'||s.priorityLevel===filter),[students,filter]);
  const openTasks=tasks.filter(t=>t.status==='OPEN');
  const overdueTasks=openTasks.filter(t=>t.dueAt&&new Date(t.dueAt)<new Date());
  const systemSummary={
    profile:students.filter(x=>x.profileReady).length,
    plans:students.filter(x=>(x.activePlans||0)>0).length,
    performance:students.filter(x=>x.hasExamData).length,
    reviews:students.reduce((n,x)=>n+x.dueReviews,0),
    intervention:students.filter(x=>x.priorityLevel==='HIGH'||x.priorityLevel==='MEDIUM').length,
    monthly:students.filter(x=>x.monthlyDevelopmentReady).length
  };

  async function complete(id:string){
    const r=await fetch('/api/coach/tasks',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({id,status:'COMPLETED'})});
    if(r.ok)setTasks(x=>x.map(t=>t.id===id?{...t,status:'COMPLETED'}:t));
  }

  return <div className="stack">
    <div className="coachCommandKpis">
      <div className="card"><div className="moduleEyebrow">BUGÜN / YAKIN</div><div className="kpi">{agenda.length}</div><span className="muted">planlı seans</span></div>
      <div className="card"><div className="moduleEyebrow">MÜDAHALE</div><div className="kpi">{students.filter(x=>x.priorityLevel==='HIGH').length}</div><span className="muted">acil takip gereken öğrenci</span></div>
      <div className="card"><div className="moduleEyebrow">GECİKEN</div><div className="kpi">{students.reduce((n,x)=>n+x.overdueActions,0)}</div><span className="muted">öğrenci aksiyonu</span></div>
      <div className="card"><div className="moduleEyebrow">KOÇ GÖREVLERİ</div><div className="kpi">{openTasks.length}</div><span className="muted">{overdueTasks.length} gecikmiş görev</span></div>
    </div>

    <div className="coachSystemOverview">
      <div className="coachSystemTile"><span>01</span><div><small>EĞİTSEL PROFİL</small><strong>Profil & Ön Görüşme</strong><p>{systemSummary.profile}/{students.length} öğrencide tarama + ön görüşme verisi hazır</p></div></div>
      <div className="coachSystemTile"><span>02</span><div><small>AKILLI PLANLAMA</small><strong>Kişisel Çalışma Planı</strong><p>{systemSummary.plans}/{students.length} öğrencide aktif plan bulunuyor</p></div></div>
      <div className="coachSystemTile"><span>03</span><div><small>PERFORMANS</small><strong>Akademik Performans Merkezi</strong><p>{systemSummary.performance}/{students.length} öğrencide güncel sınav/deneme verisi var</p></div></div>
      <div className="coachSystemTile"><span>04</span><div><small>ÖĞRENME & TEKRAR</small><strong>Tekrar Motoru</strong><p>{systemSummary.reviews} vadesi gelmiş yanlış soru tekrarı</p></div></div>
      <div className="coachSystemTile"><span>05</span><div><small>KOÇ KOMUTA</small><strong>Müdahale & Görüşme</strong><p>{systemSummary.intervention} öğrenci aktif izlem/müdahale düzeyinde</p></div></div>
      <div className="coachSystemTile"><span>06</span><div><small>AYLIK GELİŞİM</small><strong>Gelişim & Değerlendirme</strong><p>{systemSummary.monthly}/{students.length} öğrencide öz değerlendirme verisi mevcut</p></div></div>
    </div>

    <div className="coachCommandGrid">
      <div className="card">
        <div className="moduleHeaderRow"><div><div className="moduleEyebrow">MÜDAHALE KUYRUĞU</div><h2>Öncelikli Öğrenciler</h2><p className="muted">Her öncelik, altında gösterilen somut sinyallerden hesaplanır: geciken aksiyonlar, aktivite, tekrarlar ve deneme/görev kayıtları.</p></div>
        <div className="row"><button className={'btn '+(filter==='ALL'?'primary':'')} onClick={()=>setFilter('ALL')}>Tümü</button><button className={'btn '+(filter==='HIGH'?'primary':'')} onClick={()=>setFilter('HIGH')}>Acil</button><button className={'btn '+(filter==='MEDIUM'?'primary':'')} onClick={()=>setFilter('MEDIUM')}>İzlem</button></div></div>
        <div className="priorityQueue">{visible.slice(0,12).map(s=><a className="priorityStudent" href={'/koc/ogrenci/'+s.id} key={s.id}>
          <div className={'priorityDot '+s.priorityLevel.toLowerCase()}/>
          <div className="priorityStudentMain"><strong>{s.fullName}</strong><span>{s.gradeLevel||'Grup yok'} · {s.studentCode}</span><small>{s.reasons.join(' · ')||'Aktif uyarı yok'}</small><small><strong>Önerilen koç aksiyonu:</strong> {s.suggestedAction}</small></div>
        </a>)}</div>
      </div>

      <div className="card">
        <div className="moduleEyebrow">AJANDA</div><h2>Yaklaşan Seanslar</h2>
        {agenda.length===0?<p className="muted">Yaklaşan 7 günde planlı seans yok.</p>:<div className="agendaList">{agenda.map(x=><div className="agendaItem" key={x.id}>
          <div className="agendaTime"><b>{new Date(x.startsAt).toLocaleDateString('tr-TR',{day:'2-digit',month:'short'})}</b><span>{new Date(x.startsAt).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})}</span></div>
          <div><strong>{x.studentName}</strong><span>{x.title}</span></div>
          <div className="row"><a className="btn" href={'/koc/ogrenci/'+x.studentId+'#seans-akisi'}>Hazırlan</a>{x.meetingUrl&&<a className="btn primary" href={x.meetingUrl} target="_blank">Katıl</a>}</div>
        </div>)}</div>}
      </div>
    </div>

    <div className="card">
        <div className="moduleEyebrow">KOÇ TAKİP KUTUSU</div><h2>Bekleyen İşler</h2>
        {openTasks.length===0?<p className="muted">Açık koç görevi yok.</p>:openTasks.slice(0,12).map(t=><div className={'coachTaskRow '+(t.dueAt&&new Date(t.dueAt)<new Date()?'overdue':'')} key={t.id}>
          <button className="taskCheck" onClick={()=>complete(t.id)} aria-label="Görevi tamamla">✓</button>
          <div><strong>{t.title}</strong><span>{t.student?.fullName||'Genel görev'}{t.dueAt?' · '+new Date(t.dueAt).toLocaleString('tr-TR'):''}</span></div>
          <span className={'pill priority-'+t.priority.toLowerCase()}>{t.priority}</span>
        </div>)}
      </div>
  </div>;
}
