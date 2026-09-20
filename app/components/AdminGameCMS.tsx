'use client';

import { ChangeEvent,FormEvent,useEffect,useState } from 'react';

export function AdminGameCMS(){
  const [items,setItems]=useState<any[]>([]);const [msg,setMsg]=useState('');const [json,setJson]=useState('');
  async function load(){const r=await fetch('/api/admin/games');const j=await r.json();if(j.ok)setItems(j.items||[])}
  useEffect(()=>{load()},[]);
  async function add(e:FormEvent<HTMLFormElement>){
    e.preventDefault();const fd=new FormData(e.currentTarget);let payload:any={};try{payload=JSON.parse(String(fd.get('payload')||'{}'))}catch{return setMsg('Hata: payload geçerli JSON olmalı.')}
    const item={gameType:fd.get('gameType'),examType:fd.get('examType')||undefined,subject:fd.get('subject'),topic:fd.get('topic'),title:fd.get('title'),difficulty:fd.get('difficulty'),payload};
    const r=await fetch('/api/admin/games',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({items:[item]})});const j=await r.json();if(!r.ok)return setMsg('Hata: '+(j.error||'Eklenemedi.'));setMsg('Oyun içeriği eklendi.');(e.currentTarget as HTMLFormElement).reset();load();
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
  return <div className="stack"><div className="card"><div className="moduleEyebrow">OYUN İÇERİK CMS</div><h2>Yeni Mikro Tekrar Oyunu</h2><form className="form" onSubmit={add}><div className="row"><div className="field"><label>Oyun</label><select name="gameType"><option value="WORD">Günün Kelimesi</option><option value="CROSSWORD">Çengel/Kare Bulmaca</option><option value="CONNECTIONS">Connections</option><option value="MATCH">Kart Eşleştirme</option></select></div><div className="field"><label>Zorluk</label><select name="difficulty"><option>KOLAY</option><option>ORTA</option><option>ZOR</option></select></div></div><div className="row"><input name="examType" placeholder="Sınav"/><input name="subject" placeholder="Ders" required/><input name="topic" placeholder="Konu" required/></div><input name="title" placeholder="Başlık" required/><textarea name="payload" rows={6} placeholder='WORD örneği: {"answer":"SERVET","clue":"Edebî topluluk...","explanation":"..."}' required/><button className="btn primary">İçeriği Ekle</button></form></div>
    <div className="card"><h3>JSON / CSV ile Toplu Yükleme</h3><textarea rows={8} value={json} onChange={e=>setJson(e.target.value)} placeholder='[{"gameType":"MATCH",...}]'/><div className="row"><button className="btn" onClick={bulk}>JSON Aktar</button><label className="btn">CSV Seç<input type="file" accept=".csv,text/csv" onChange={csv} style={{display:'none'}}/></label></div><p className="muted">CSV başlıkları: gameType, examType, subject, topic, title, difficulty, payload. Payload alanı JSON olabilir.</p></div>
    {msg&&<div className={`notice ${msg.startsWith('Hata:')?'error':''}`}>{msg}</div>}
    <div className="card"><h3>Yayınlanan Oyunlar ({items.length})</h3>{items.slice(0,30).map(x=><div className="adminSimpleRow" key={x.id}><div><strong>{x.title}</strong><span>{x.gameType} · {x.subject} · {x.topic}</span></div><span>{x.difficulty}</span></div>)}</div>
  </div>;
}
