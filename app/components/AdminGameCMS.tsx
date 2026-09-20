'use client';

import { FormEvent,useEffect,useState } from 'react';

export function AdminGameCMS(){
  const [items,setItems]=useState<any[]>([]);const [msg,setMsg]=useState('');const [json,setJson]=useState('');
  async function load(){const r=await fetch('/api/admin/games');const j=await r.json();if(j.ok)setItems(j.items||[])}
  useEffect(()=>{load()},[]);
  async function add(e:FormEvent<HTMLFormElement>){
    e.preventDefault();const fd=new FormData(e.currentTarget);let payload:any={};try{payload=JSON.parse(String(fd.get('payload')||'{}'))}catch{return setMsg('Hata: payload geçerli JSON olmalı.')}
    const item={gameType:fd.get('gameType'),examType:fd.get('examType')||undefined,subject:fd.get('subject'),topic:fd.get('topic'),title:fd.get('title'),difficulty:fd.get('difficulty'),payload};
    const r=await fetch('/api/admin/games',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({items:[item]})});const j=await r.json();if(!r.ok)return setMsg('Hata: '+(j.error||'Eklenemedi.'));setMsg('Oyun içeriği eklendi.');(e.currentTarget as HTMLFormElement).reset();load();
  }
  async function bulk(){
    try{const parsed=JSON.parse(json);const items=Array.isArray(parsed)?parsed:parsed.items;const r=await fetch('/api/admin/games',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({items})});const j=await r.json();if(!r.ok)return setMsg('Hata: '+(j.error||'Aktarılamadı.'));setMsg(j.count+' oyun içeriği aktarıldı.');setJson('');load()}catch{setMsg('Hata: Geçerli JSON girin.')}
  }
  return <div className="stack"><div className="card"><div className="moduleEyebrow">OYUN İÇERİK CMS</div><h2>Yeni Mikro Tekrar Oyunu</h2><form className="form" onSubmit={add}><div className="row"><div className="field"><label>Oyun</label><select name="gameType"><option value="WORD">Günün Kelimesi</option><option value="CROSSWORD">Çengel/Kare Bulmaca</option><option value="CONNECTIONS">Connections</option><option value="MATCH">Kart Eşleştirme</option></select></div><div className="field"><label>Zorluk</label><select name="difficulty"><option>KOLAY</option><option>ORTA</option><option>ZOR</option></select></div></div><div className="row"><input name="examType" placeholder="Sınav"/><input name="subject" placeholder="Ders" required/><input name="topic" placeholder="Konu" required/></div><input name="title" placeholder="Başlık" required/><textarea name="payload" rows={6} placeholder='WORD örneği: {"answer":"SERVET","clue":"Edebî topluluk...","explanation":"..."}' required/><button className="btn primary">İçeriği Ekle</button></form></div>
    <div className="card"><h3>JSON ile Toplu Yükleme</h3><textarea rows={8} value={json} onChange={e=>setJson(e.target.value)} placeholder='[{"gameType":"MATCH",...}]'/><button className="btn" onClick={bulk}>JSON Aktar</button></div>
    {msg&&<div className={`notice ${msg.startsWith('Hata:')?'error':''}`}>{msg}</div>}
    <div className="card"><h3>Yayınlanan Oyunlar ({items.length})</h3>{items.slice(0,30).map(x=><div className="adminSimpleRow" key={x.id}><div><strong>{x.title}</strong><span>{x.gameType} · {x.subject} · {x.topic}</span></div><span>{x.difficulty}</span></div>)}</div>
  </div>;
}
