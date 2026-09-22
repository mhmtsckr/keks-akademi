'use client';

import { ChangeEvent,FormEvent,useEffect,useState } from 'react';

export function AdminGameCMS(){
  const [items,setItems]=useState<any[]>([]);const [msg,setMsg]=useState('');const [json,setJson]=useState('');const [autoStatus,setAutoStatus]=useState<any>(null);
  async function load(){
    const [games,status]=await Promise.all([
      fetch('/api/admin/games').then(r=>r.json()),
      fetch('/api/admin/games/publish-meb').then(r=>r.json())
    ]);
    if(games.ok)setItems(games.items||[]);
    if(status.ok)setAutoStatus(status);
  }
  useEffect(()=>{load()},[]);
  async function add(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setMsg('');
    const form=e.currentTarget;
    const fd=new FormData(form);
    const body={
      gameType:fd.get('gameType')||undefined,
      examType:fd.get('examType')||undefined,
      subject:fd.get('subject'),
      topic:fd.get('topic')
    };
    const r=await fetch('/api/admin/games/auto',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json();
    if(!r.ok)return setMsg('Hata: '+(j.error||'Oyun oluşturulamadı.'));
    setMsg((j.game?.subject||body.subject)+' · '+(j.game?.topic||body.topic)+' için '+(j.game?.gameType||'mikro tekrar')+' oyunu otomatik oluşturuldu.');
    form.reset();
    load();
  }
  async function publishMeb(){
    setMsg('MEB kaynaklı oyunlar hazırlanıyor…');
    const r=await fetch('/api/admin/games/publish-meb',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({limit:8})});
    const j=await r.json();
    if(!r.ok)return setMsg('Hata: '+(j.error||'MEB oyunları yayınlanamadı.'));
    setMsg((j.published?.length||0)+' MEB kaynaklı mikro tekrar oyunu otomatik yayınlandı.'+(j.availableTopics!==undefined?' Uygun konu: '+j.availableTopics+'.':''));
    load();
  }

  function parseCsv(text:string){
    const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;
    for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++}else quoted=!quoted}else if(ch===','&&!quoted){row.push(cell);cell=''}else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell=''}else cell+=ch}
    row.push(cell);if(row.some(x=>x.trim()))rows.push(row);if(rows.length<2)return[];
    const headers=rows[0].map(x=>x.trim());
    return rows.slice(1).map(cols=>{const o:any={};headers.forEach((h,i)=>o[h]=cols[i]??'');if(o.payload){try{o.payload=JSON.parse(o.payload)}catch{o.payload={text:o.payload}}}return o});
  }
  async function csv(e:ChangeEvent<HTMLInputElement>){const file=e.target.files?.[0];if(!file)return;const rows=parseCsv(await file.text());if(!rows.length)return setMsg('Hata: CSV içeriği okunamadı.');const r=await fetch('/api/admin/games',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({items:rows})});const j=await r.json();if(!r.ok)return setMsg('Hata: '+(j.error||'CSV aktarılamadı.'));setMsg(j.count+' oyun içeriği CSV üzerinden aktarıldı.');load()}
  async function bulk(){
    try{const parsed=JSON.parse(json);const items=Array.isArray(parsed)?parsed:parsed.items;const r=await fetch('/api/admin/games',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({items})});const j=await r.json();if(!r.ok)return setMsg('Hata: '+(j.error||'Aktarılamadı.'));setMsg(j.count+' oyun içeriği aktarıldı.');setJson('');load()}catch{setMsg('Hata: Geçerli JSON girin.')}
  }
  return <div className="stack"><div className="card"><div className="moduleEyebrow">OYUN İÇERİK CMS</div><h2>Yeni Mikro Tekrar Oyunu</h2><p className="muted">Sınav, ders ve konuyu seçin. Sistem onaylı KEKS soru bankası ve ders bilgisinden oyunu otomatik oluşturur; JSON/payload girmeniz gerekmez.</p><form className="form" onSubmit={add}><div className="row"><div className="field"><label>Oyun türü</label><select name="gameType"><option value="MATCH">Kart Eşleştirme</option><option value="WORD">Kavram Kelimesi</option><option value="CONNECTIONS">Kavram Gruplama</option><option value="CROSSWORD">Kavram Bulmacası</option></select></div><div className="field"><label>Sınav türü</label><input name="examType" placeholder="TYT / AYT / LGS / KPSS / AGS"/></div></div><div className="row"><div className="field" style={{flex:1}}><label>Ders</label><input name="subject" placeholder="Örn. Türk Dili ve Edebiyatı" required/></div><div className="field" style={{flex:1}}><label>Konu</label><input name="topic" placeholder="Örn. Servetifünun Edebiyatı" required/></div></div><button className="btn primary">Ders Bilgisinden Otomatik Oluştur</button></form><div className="row" style={{marginTop:12}}><button type="button" className="btn" onClick={publishMeb}>MEB Kaynaklı Oyunları Şimdi Yayınla</button><span className="muted">Onaylı MEB/TYMM kaynaklı konulardan günlük yayın kuyruğunu elle de çalıştırır.</span></div>{autoStatus&&<div className="notice" style={{marginTop:12}}><strong>Otomatik yayın:</strong> Her gün 07:00 (Türkiye) · {autoStatus.readyTopics} uygun konu · {autoStatus.sourceCount} onaylı MEB/TYMM kaynak maddesi · {autoStatus.activeGames} aktif otomatik oyun<br/><span className="muted">Cron güvenliği: {autoStatus.cronConfigured?'Hazır':'CRON_SECRET bekleniyor'} · İçerik, MEB/TYMM kazanım ve kavramlarına göre özgün mikro oyun olarak üretilir; ders kitabı metni kopyalanmaz.</span></div>}</div>
    <div className="card"><h3>Gelişmiş İçerik Aktarımı</h3><textarea rows={8} value={json} onChange={e=>setJson(e.target.value)} placeholder='[{"gameType":"MATCH",...}]'/><div className="row"><button className="btn" onClick={bulk}>JSON Aktar</button><label className="btn">CSV Seç<input type="file" accept=".csv,text/csv" onChange={csv} style={{display:'none'}}/></label></div><p className="muted">Toplu içerik hazırlamak isteyen yöneticiler için JSON/CSV aktarımı korunmuştur. CSV başlıkları: gameType, examType, subject, topic, title, difficulty, payload.</p></div>
    {msg&&<div className={`notice ${msg.startsWith('Hata:')?'error':''}`}>{msg}</div>}
    <div className="card"><h3>Yayınlanan Oyunlar ({items.length})</h3>{items.slice(0,30).map(x=><div className="adminSimpleRow" key={x.id}><div><strong>{x.title}</strong><span>{x.gameType} · {x.subject} · {x.topic}</span></div><span>{x.difficulty}</span></div>)}</div>
  </div>;
}
