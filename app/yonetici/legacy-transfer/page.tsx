'use client';

import { useEffect, useState } from 'react';

export default function LegacyTransferPage() {
  const [status,setStatus]=useState('Eski KEKS verisi okunuyor…');

  useEffect(()=>{
    (async()=>{
      try{
        if(!window.name) throw new Error('Aktarım verisi bulunamadı. Eski KEKS sayfasından aktarımı başlatın.');
        const backup=JSON.parse(window.name);
        window.name='';
        const r=await fetch('/api/admin/legacy-import',{
          method:'POST',
          headers:{'content-type':'application/json'},
          body:JSON.stringify({
            sourceStudentCode:'211',
            targetStudentCode:'256090',
            targetName:'Elif Koçak',
            targetGradeLevel:'12. Sınıf/YKS',
            backup
          })
        });
        const j=await r.json();
        if(r.status===401 || r.status===403){
          setStatus('Yönetici oturumu gerekli. Önce /yonetici adresinden giriş yapın, sonra eski KEKS sayfasında aktarım komutunu tekrar çalıştırın.');
          return;
        }
        if(!r.ok) throw new Error(j.error||'Aktarım başarısız.');
        const i=j.imported||{};
        setStatus(
          'Aktarım tamamlandı. Elif Koçak (256090): program '+(i.schedule||0)+
          ', aktivite '+(i.activities||0)+', çalışma oturumu '+(i.studySessions||0)+
          ', net '+(i.nets||0)+', sınav '+(i.exams||0)+', test '+(i.tests||0)+
          '. Tüm diğer eski öğrenci verileri de ham arşiv olarak saklandı.'
        );
      }catch(e){
        setStatus('Hata: '+(e instanceof Error?e.message:'Aktarım tamamlanamadı.'));
      }
    })();
  },[]);

  return <main className="shell">
    <nav className="nav"><a className="brand" href="/">KEKS AKADEMİ</a><div className="navlinks"><a href="/yonetici">Yönetici Paneli</a></div></nav>
    <section className="section" style={{maxWidth:760}}>
      <div className="card">
        <span className="pill">Eski KEKS → Yeni KEKS</span>
        <h1>Öğrenci Veri Aktarımı</h1>
        <div className={`notice ${status.startsWith('Hata:')?'error':''}`}>{status}</div>
        <p className="muted">Kaynak: öğrenci 211 · Hedef: Elif Koçak · 256090 · 12. Sınıf/YKS. Hedef öğrencinin mevcut kayıtları silinmez.</p>
      </div>
    </section>
  </main>;
}
