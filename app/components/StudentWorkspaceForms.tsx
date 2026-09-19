'use client';

import { FormEvent, useState } from 'react';

async function postJson(studentId:string, body:any) {
  const r=await fetch('/api/coach/students/'+studentId+'/workspace',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  const j=await r.json();
  if(!r.ok) throw new Error(j.error||'İşlem başarısız.');
  return j;
}

export function StudentWorkspaceForms({studentId}:{studentId:string}) {
  const [msg,setMsg]=useState('');
  async function handle(e:FormEvent<HTMLFormElement>, action:string) {
    e.preventDefault(); setMsg('');
    const fd=new FormData(e.currentTarget);
    try {
      let body:any={action};
      if(action==='plan') body={action,title:fd.get('title'),payload:{details:fd.get('details')}};
      if(action==='log') body={action,date:fd.get('date'),payload:{duration:fd.get('duration'),details:fd.get('details')}};
      if(action==='technique') body={action,title:fd.get('title'),description:fd.get('description')};
      if(action==='exam') body={action,examType:fd.get('examType'),payload:{score:fd.get('score'),net:fd.get('net'),ranking:fd.get('ranking'),percentile:fd.get('percentile'),note:fd.get('note')}};
      if(action==='profile') body={action,goal:fd.get('goal'),profile:{school:fd.get('school'),target:fd.get('target'),notes:fd.get('notes')}};
      if(action==='report') body={action,title:fd.get('title'),summary:fd.get('summary'),content:fd.get('content'),visibleToStudent:true,visibleToParent:true};
      const j=await postJson(studentId,body);
      setMsg('Kayıt eklendi.');
      e.currentTarget.reset();
      setTimeout(()=>location.reload(),500);
    } catch(err:any) { setMsg('Hata: '+err.message); }
  }

  async function parentCode(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); const fd=new FormData(e.currentTarget); setMsg('');
    try {
      const j=await postJson(studentId,{action:'parentCode',parentName:fd.get('parentName')});
      setMsg('Veli giriş bilgileri — Öğrenci kodu: '+j.studentCode+' · Veli kodu: '+j.code);
    } catch(err:any){setMsg('Hata: '+err.message)}
  }

  async function library(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setMsg('');
    const fd=new FormData(e.currentTarget);
    try{
      const r=await fetch('/api/coach/students/'+studentId+'/library',{method:'POST',body:fd});
      const j=await r.json();
      if(!r.ok) throw new Error(j.error||'Dosya eklenemedi.');
      setMsg('Kütüphane kaydı eklendi.');
      e.currentTarget.reset();
      setTimeout(()=>location.reload(),500);
    }catch(err:any){setMsg('Hata: '+err.message)}
  }

  return <div className="stack">
    {msg&&<div className={`notice ${msg.startsWith('Hata:')?'error':''}`}>{msg}</div>}

    <details className="card" open><summary><strong>Program Oluştur</strong></summary><form className="form" onSubmit={e=>handle(e,'plan')} style={{marginTop:12}}><div className="field"><label>Program başlığı</label><input name="title" required placeholder="Örn. 1. Hafta YKS Programı"/></div><div className="field"><label>Görevler / açıklama</label><textarea name="details" rows={5} required/></div><button className="btn primary">Programı Kaydet</button></form></details>

    <details className="card"><summary><strong>Çalışma Kaydı</strong></summary><form className="form" onSubmit={e=>handle(e,'log')} style={{marginTop:12}}><div className="field"><label>Tarih</label><input name="date" type="date" required/></div><div className="field"><label>Süre (dakika)</label><input name="duration" type="number" min="0"/></div><div className="field"><label>Yapılan çalışma</label><textarea name="details" rows={4} required/></div><button className="btn primary">Çalışmayı Kaydet</button></form></details>

    <details className="card"><summary><strong>Ders Çalışma Tekniği</strong></summary><form className="form" onSubmit={e=>handle(e,'technique')} style={{marginTop:12}}><div className="field"><label>Teknik</label><input name="title" required placeholder="Aktif Hatırlama, Pomodoro, Cornell..."/></div><div className="field"><label>Nasıl uygulanacak?</label><textarea name="description" rows={4}/></div><button className="btn primary">Tekniği Ata</button></form></details>

    <details className="card"><summary><strong>Deneme Sonucu</strong></summary><form className="form" onSubmit={e=>handle(e,'exam')} style={{marginTop:12}}><div className="field"><label>Deneme türü</label><input name="examType" required placeholder="TYT Genel Deneme"/></div><div className="row"><div className="field" style={{flex:1}}><label>Net</label><input name="net"/></div><div className="field" style={{flex:1}}><label>Puan</label><input name="score"/></div></div><div className="row"><div className="field" style={{flex:1}}><label>Başarı sırası (YKS)</label><input name="ranking" type="number"/></div><div className="field" style={{flex:1}}><label>Yüzdelik dilim (LGS)</label><input name="percentile" type="number" step="0.01"/></div></div><div className="field"><label>Koç notu</label><textarea name="note"/></div><button className="btn primary">Denemeyi Kaydet</button></form></details>

    <details className="card"><summary><strong>Hedef ve Öğrenci Bilgileri</strong></summary><form className="form" onSubmit={e=>handle(e,'profile')} style={{marginTop:12}}><div className="field"><label>Ana hedef</label><textarea name="goal" rows={3}/></div><div className="field"><label>Okul / kurum</label><input name="school"/></div><div className="field"><label>Hedef bölüm / sınav</label><input name="target"/></div><div className="field"><label>Bilgiler ve notlar</label><textarea name="notes" rows={4}/></div><button className="btn primary">Bilgileri Güncelle</button></form></details>

    <details className="card"><summary><strong>Öğrenci / Veli Raporu</strong></summary><form className="form" onSubmit={e=>handle(e,'report')} style={{marginTop:12}}><div className="field"><label>Rapor başlığı</label><input name="title" required/></div><div className="field"><label>Kısa özet</label><textarea name="summary" rows={2}/></div><div className="field"><label>Rapor</label><textarea name="content" rows={8} required/></div><button className="btn primary">Raporu Kaydet</button></form></details>

    <details className="card"><summary><strong>Kütüphane / Not / Dosya</strong></summary><form className="form" onSubmit={library} style={{marginTop:12}}><div className="field"><label>Başlık</label><input name="title" required/></div><div className="field"><label>Not</label><textarea name="note" rows={4}/></div><div className="field"><label>Dosya (en fazla 5 MB)</label><input name="file" type="file"/></div><button className="btn primary">Kütüphaneye Ekle</button></form></details>

    <details className="card"><summary><strong>Veli Girişi Oluştur</strong></summary><form className="form" onSubmit={parentCode} style={{marginTop:12}}><div className="field"><label>Veli adı</label><input name="parentName" placeholder="Ad Soyad"/></div><button className="btn primary">Yeni Veli Giriş Kodu Oluştur</button><p className="muted">Yeni kod üretildiğinde önceki veli kodu geçersiz olur.</p></form></details>
  </div>;
}
