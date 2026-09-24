'use client';

import { useEffect,useState } from 'react';

export function AdminOabtFieldApprovals(){
  const [data,setData]=useState<any>({items:[],pending:0});
  const [busy,setBusy]=useState('');
  const [msg,setMsg]=useState('');
  const [studentCode,setStudentCode]=useState('');

  async function load(code=studentCode){
    const q=code.trim()?('?studentCode='+encodeURIComponent(code.trim())):'';
    const r=await fetch('/api/admin/oabt-fields'+q,{cache:'no-store'});
    const j=await r.json();
    if(r.ok)setData(j);
  }
  useEffect(()=>{
    void load('');
    const timer=window.setInterval(()=>{void load(studentCode)},6000);
    return ()=>window.clearInterval(timer);
  },[]);

  async function decide(studentId:string,action:'APPROVE'|'REJECT'){
    let note: string|undefined;
    if(action==='REJECT')note=window.prompt('Öğrenciye gösterilecek yeniden seçim notu:')||undefined;
    setBusy(studentId+action);setMsg('');
    const r=await fetch('/api/admin/oabt-fields',{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({studentId,action,note})
    });
    const j=await r.json();setBusy('');
    if(!r.ok)return setMsg('Hata: '+(j.error||'İşlem tamamlanamadı.'));
    setMsg(action==='APPROVE'?'ÖABT alanı onaylandı. Öğrenci ve koç paneli birkaç saniye içinde otomatik güncellenecek.':'Alan seçimi öğrenciye yeniden gönderildi.');
    setData((prev:any)=>({...prev,items:(prev.items||[]).map((x:any)=>x.id===studentId?{
      ...x,
      status:action==='APPROVE'?'APPROVED':'REJECTED',
      approvedField:action==='APPROVE'?x.requestedField:null,
      approvedAt:action==='APPROVE'?new Date().toISOString():null
    }:x)}));
    await load();
  }

  const pending=(data.items||[]).filter((x:any)=>x.status==='PENDING');
  const approved=(data.items||[]).filter((x:any)=>x.status==='APPROVED');

  return <div className="card adminOabtApprovals">
    <div className="moduleHeaderRow">
      <div><div className="moduleEyebrow">AGS/ÖABT ALAN ONAYI</div><h2>ÖABT Alan Seçimleri</h2><p className="muted">Öğrencinin seçtiği branşı doğrulayın. Onaylanan alan öğrenci profilinde kilitlenir ve daha sonra öğrenci tarafından değiştirilemez.</p></div>
      <div className="row"><button className="btn" type="button" onClick={()=>load(studentCode)} disabled={Boolean(busy)}>Yenile</button><span className="pill">{pending.length} onay bekliyor</span></div>
    </div>
    <div className="adminOabtSearchBar">
      <div className="field">
        <label>Öğrenci koduyla doğrudan bul</label>
        <input value={studentCode} onChange={e=>setStudentCode(e.target.value.replace(/\D/g,'').slice(0,12))} placeholder="Örn. 445212" inputMode="numeric"/>
      </div>
      <button className="btn primary" type="button" disabled={Boolean(busy)||studentCode.trim().length<3} onClick={()=>load(studentCode)}>Öğrenciyi Bul</button>
      {studentCode&&<button className="btn" type="button" onClick={()=>{setStudentCode('');void load('')}}>Filtreyi Temizle</button>}
    </div>
    {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')}>{msg}</div>}
    {data.searchedCode&&data.foundExact===false&&<div className="notice error">Kod {data.searchedCode} ile öğrenci bulunamadı.</div>}
    {data.searchedCode&&data.foundExact&&<div className="notice"><strong>Kod {data.searchedCode} bulundu.</strong><div className="muted">Kayıt aşağıda gösteriliyor. Geçerli eski ÖABT alanı varsa otomatik olarak yönetici onay kuyruğuna taşınır.</div></div>}
    {(data.items||[]).filter((x:any)=>x.status==='NONE').map((x:any)=><article className="adminOabtRow" key={'waiting-'+x.id}>
      <div><strong>{x.fullName}</strong><span>Kod: {x.studentCode} · {x.gradeLevel||'Sınav grubu belirtilmemiş'}</span>{x.coachName&&<span>Koç: {x.coachName}</span>}</div>
      <div className="adminOabtField"><small>ALAN DURUMU</small><strong>Öğrencinin alan seçimi bekleniyor</strong><span>Öğrenci alanını gönderdiğinde bu kayıt otomatik olarak onay kuyruğuna geçer.</span></div>
      <span className="adminStatus pending">SEÇİM BEKLİYOR</span>
    </article>)}
    {pending.length===0?<div className="notice">Şu anda onay bekleyen ÖABT alan seçimi yok.</div>:<div className="adminOabtList">
      {pending.map((x:any)=><article className="adminOabtRow" key={x.id}>
        <div>
          <strong>{x.fullName}</strong>
          <span>Kod: {x.studentCode} · {x.gradeLevel}</span>
          {x.coachName&&<span>Koç: {x.coachName}</span>}
        </div>
        <div className="adminOabtField"><small>ÖĞRENCİNİN SEÇİMİ</small><strong>{x.requestedField}</strong><span>{x.requestedAt?new Date(x.requestedAt).toLocaleString('tr-TR'):''}</span></div>
        <div className="row">
          <button className="btn primary" disabled={Boolean(busy)} onClick={()=>decide(x.id,'APPROVE')}>{busy===x.id+'APPROVE'?'Onaylanıyor…':'Onayla ve Kilitle'}</button>
          <button className="btn danger" disabled={Boolean(busy)} onClick={()=>decide(x.id,'REJECT')}>Yeniden Seçtir</button>
        </div>
      </article>)}
    </div>}
    {approved.length>0&&<details className="adminOabtApprovedHistory"><summary><strong>Onaylanmış alanlar ({approved.length})</strong></summary><div className="adminOabtList">{approved.slice(0,30).map((x:any)=><div className="adminOabtRow compact" key={x.id}><div><strong>{x.fullName}</strong><span>{x.studentCode}</span></div><div className="adminOabtField"><small>KİLİTLİ ALAN</small><strong>{x.approvedField||x.academicTrack}</strong></div><span className="adminStatus active">ONAYLI</span></div>)}</div></details>}
  </div>;
}
