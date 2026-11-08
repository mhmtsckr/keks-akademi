'use client';

import {useEffect,useState} from 'react';

export function AdminPartnerCoachNetwork(){
  const [coaches,setCoaches]=useState<any[]>([]);
  const [students,setStudents]=useState<any[]>([]);
  const [selectedStudent,setSelectedStudent]=useState<Record<string,string>>({});
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState('');
  const [msg,setMsg]=useState('');

  async function load(){
    setLoading(true);
    try{
      const r=await fetch('/api/admin/partner-coaches',{cache:'no-store'});
      const j=await r.json();
      if(!r.ok){setMsg('Hata: '+(j.error||'Partner Koç ağı yüklenemedi.'));return}
      setCoaches(j.coaches||[]);
      const sr=await fetch('/api/admin/partner-coach-assignments',{cache:'no-store'});
      const sj=await sr.json();
      if(sr.ok)setStudents(sj.students||[]);
      else setMsg('Hata: '+(sj.error||'Öğrenciler yüklenemedi.'));
    }finally{setLoading(false)}
  }

  useEffect(()=>{void load()},[]);

  async function update(coachId:string,partnerStatus:'ACTIVE'|'PAUSED'|'REVIEW'){
    setBusy(coachId+partnerStatus);setMsg('');
    try{
      const r=await fetch('/api/admin/partner-coaches',{
        method:'PATCH',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({coachId,partnerStatus})
      });
      const j=await r.json();
      if(!r.ok){setMsg('Hata: '+(j.error||'Ağ durumu güncellenemedi.'));return}
      setMsg('Partner Koç ağ durumu güncellendi.');
      await load();
    }finally{setBusy('')}
  }

  async function assign(coachId:string){
    const studentId=selectedStudent[coachId];
    if(!studentId){setMsg('Hata: Önce bir öğrenci seçin.');return}
    const student=students.find(x=>x.id===studentId);
    const coach=coaches.find(x=>x.id===coachId);
    if(!window.confirm((student?.fullName||'Öğrenci')+' öğrencisini '+(coach?.user.name||'Partner Koç')+' hesabına atamak istiyor musunuz? Mevcut koçu varsa değişecektir.'))return;
    setBusy(coachId+'assign');setMsg('');
    try{
      const r=await fetch('/api/admin/partner-coach-assignments',{
        method:'PATCH',headers:{'content-type':'application/json'},
        body:JSON.stringify({studentId,coachId})
      });
      const j=await r.json();
      if(!r.ok){setMsg('Hata: '+(j.error||'Öğrenci atanamadı.'));return}
      setMsg('Öğrenci Partner Koç hesabına atandı.');
      await load();
    }catch{setMsg('Hata: Atama isteği tamamlanamadı.')}
    finally{setBusy('')}
  }

  const active=coaches.filter(x=>x.partnerStatus==='ACTIVE').length;
  const accepting=coaches.filter(x=>x.partnerStatus==='ACTIVE'&&x.acceptingStudents&&x.availableSlots>0).length;

  return <div className="card" style={{marginBottom:16}}>
    <div className="moduleHeaderRow">
      <div>
        <div className="moduleEyebrow">KEKS PARTNER KOÇ AĞI</div>
        <h2>Koç kalite ve kapasite ağı</h2>
        <p className="muted">Profil kapsamı, öğrenci kabul kapasitesi ve son 30 günlük operasyon göstergelerini birlikte izleyin.</p>
      </div>
      <div className="row"><span className="pill">{active} aktif partner</span><span className="pill">{accepting} eşleşmeye açık</span><button className="btn" onClick={load}>Yenile</button></div>
    </div>

    {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')}>{msg}</div>}
    {loading?<p className="muted">Partner Koç ağı yükleniyor…</p>:coaches.length===0?<p className="muted">Henüz koç profili yok.</p>:<div className="stack">
      {coaches.map(coach=><article className="card" key={coach.id}>
        <div className="moduleHeaderRow">
          <div>
            <strong>{coach.user.name}</strong>
            <div className="muted">{coach.displayTitle||'Profil unvanı girilmedi'} · {coach.user.status}</div>
          </div>
          <div className="row"><span className="pill">{coach.partnerStatus}</span><span className="pill">Profil %{coach.profileCompleteness}</span></div>
        </div>
        <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))'}}>
          <div><small className="muted">Kapasite</small><strong style={{display:'block'}}>{coach.studentCount}/{coach.maxActiveStudents}</strong><span>{coach.availableSlots} açık</span></div>
          <div><small className="muted">Yanıt süresi</small><strong style={{display:'block'}}>{coach.responseTime}</strong><span>Hedef ≤ {coach.responseTargetHours} sa.</span></div>
          <div><small className="muted">Görüşme tamamlama</small><strong style={{display:'block'}}>{coach.sessionCompletion}</strong><span>{coach.sessionStatus}</span></div>
          <div><small className="muted">KEKS standartları</small><strong style={{display:'block'}}>{coach.standardsMet}/{coach.standardsMeasured}</strong><span>{coach.operationalSamples} olay</span></div>
        </div>
        <div className="muted" style={{marginTop:10}}><strong>Düzeyler:</strong> {coach.supportedEducationLevels.join(' · ')||'Tanımlanmadı'}</div>
        <div className="muted"><strong>Uzmanlık:</strong> {coach.specialties.join(' · ')||'Tanımlanmadı'}</div>
        <div className="form" style={{marginTop:12}}>
          <label htmlFor={'student-assign-'+coach.id}>Öğrenci ata / koç değiştir</label>
          <div className="row">
            <select id={'student-assign-'+coach.id} value={selectedStudent[coach.id]||''} onChange={e=>setSelectedStudent(prev=>({...prev,[coach.id]:e.target.value}))}>
              <option value="">Öğrenci seçin</option>
              {students.map(student=><option key={student.id} value={student.id}>
                {student.fullName} ({student.studentCode}) · {student.gradeLevel||'Düzey belirtilmedi'} · {student.coachName||'Atanmamış'}
              </option>)}
            </select>
            <button className="btn primary" disabled={Boolean(busy)||!selectedStudent[coach.id]||coach.partnerStatus!=='ACTIVE'||!coach.acceptingStudents||coach.availableSlots<=0} onClick={()=>assign(coach.id)}>Öğrenciyi Ata</button>
          </div>
        </div>
        <div className="row" style={{marginTop:12}}>
          <button className="btn primary" disabled={Boolean(busy)} onClick={()=>update(coach.id,'ACTIVE')}>Ağa Aç</button>
          <button className="btn" disabled={Boolean(busy)} onClick={()=>update(coach.id,'REVIEW')}>İncelemeye Al</button>
          <button className="btn" disabled={Boolean(busy)} onClick={()=>update(coach.id,'PAUSED')}>Eşleştirmeyi Duraklat</button>
        </div>
      </article>)}
    </div>}
  </div>;
}
