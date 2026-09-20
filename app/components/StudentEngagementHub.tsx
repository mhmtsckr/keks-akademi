'use client';

import { FormEvent,useEffect,useState } from 'react';

export function StudentEngagementHub(){
  const [data,setData]=useState<any>(null);
  const [msg,setMsg]=useState('');
  const [chat,setChat]=useState<Array<{role:string,content:string}>>([]);
  const [busy,setBusy]=useState(false);

  async function load(){const r=await fetch('/api/student/engagement');const j=await r.json();if(j.ok)setData(j)}
  useEffect(()=>{load()},[]);

  async function progress(id:string,currentValue:number){
    const r=await fetch('/api/student/engagement',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'progress',id,currentValue})});
    const j=await r.json();if(!r.ok){setMsg('Hata: '+(j.error||'Güncellenemedi.'));return}setMsg('Aksiyon ilerlemesi güncellendi.');load();
  }

  async function chatSubmit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();const fd=new FormData(e.currentTarget);const message=String(fd.get('message')||'').trim();if(!message)return;
    setChat(x=>[...x,{role:'user',content:message}]);setBusy(true);(e.currentTarget as HTMLFormElement).reset();
    const r=await fetch('/api/student/coachbot',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message})});const j=await r.json();setBusy(false);
    setChat(x=>[...x,{role:'assistant',content:r.ok?j.reply:'Yanıt oluşturulamadı.'}]);
  }

  if(!data)return <div className="card"><p className="muted">Koçluk ve oyunlaştırma verileri yükleniyor…</p></div>;
  const xp=data.gamification?.xp||0,level=data.gamification?.level||1;

  return <div className="stack">
    {msg&&<div className={`notice ${msg.startsWith('Hata:')?'error':''}`}>{msg}</div>}
    <div className="engagementTop">
      <div className="card xpCard"><div className="moduleEyebrow">KONU HAKİMİYETİ</div><div className="xpMain"><div><div className="kpi">{xp} XP</div><strong>Seviye {level}</strong></div><span className="moduleIcon">★</span></div><div className="goldProgress"><i style={{width:Math.min(100,(xp%500)/5)+'%'}}/></div><p className="muted">Sonraki seviye için {500-(xp%500)} XP.</p></div>
      <div className="card"><div className="moduleEyebrow">YAKLAŞAN GÖRÜŞME</div><h2>{data.sessions[0]?.title||'Planlanmış seans yok'}</h2>{data.sessions[0]&&<><p>{new Date(data.sessions[0].startsAt).toLocaleString('tr-TR')}</p>{data.sessions[0].meetingUrl&&<a className="btn primary" href={data.sessions[0].meetingUrl} target="_blank">Görüşmeye Katıl</a>}</>}</div>
      <div className="card"><div className="moduleEyebrow">ROZETLER</div><h2>{data.badges.length}</h2><p className="muted">{data.badges.slice(0,3).map((x:any)=>x.title).join(' · ')||'Henüz rozet yok.'}</p></div>
    </div>

    <div className="card"><div className="moduleEyebrow">KOÇLUK AKSİYONLARI</div><h2>Bu dönem hedeflerim</h2>{data.actions.length===0?<p className="muted">Koçunuz henüz aksiyon tanımlamadı.</p>:<div className="actionGrid">{data.actions.map((x:any)=>{const pct=Math.min(100,Math.round(x.currentValue/x.targetValue*100));return <div className="actionStudentCard" key={x.id}><div><strong>{x.title}</strong><span>{x.cadence} · {x.metricType}</span></div><div className="goldProgress"><i style={{width:pct+'%'}}/></div><div className="actionControls"><input type="number" min="0" max={x.targetValue} defaultValue={x.currentValue} id={'a-'+x.id}/><button className="btn" onClick={()=>{const el=document.getElementById('a-'+x.id) as HTMLInputElement;progress(x.id,Number(el.value))}}>Güncelle</button><b>%{pct}</b></div></div>})}</div>}</div>

    <div className="engagementGrid">
      <div className="card coachBotCard"><div className="moduleEyebrow">KEKS REHBER</div><h2>Seans dışı çalışma asistanı</h2><div className="chatBox">{chat.length===0&&<p className="muted">“Bu hafta nasıl çalışmalıyım?”, “Son çalışmalarımı özetle” veya “Bugün ne yapayım?” diye sorabilirsiniz.</p>}{chat.map((x,i)=><div key={i} className={'chatBubble '+x.role}>{x.content}</div>)}{busy&&<div className="chatBubble assistant">Yanıt hazırlanıyor…</div>}</div><form className="row" onSubmit={chatSubmit}><input name="message" placeholder="Rehbere sor…" required style={{flex:1}}/><button className="btn primary">Gönder</button></form></div>
      <div className="card leaderboardCard"><div className="moduleEyebrow">LİDERLİK TABLOSU</div><h2>XP Sıralaması</h2>{data.leaderboard.slice(0,10).map((x:any,i:number)=><div className="leaderRow" key={x.studentId}><b>{i+1}</b><span>{x.student.fullName}</span><strong>{x.xp} XP</strong></div>)}</div>
    </div>

    <div className="card"><div className="moduleEyebrow">EĞİTSEL OYUNLAR</div><h2>Mikro tekrar alanı</h2>{data.games.length===0?<p className="muted">Yönetici henüz oyun içeriği yayınlamadı.</p>:<div className="gameGrid">{data.games.map((g:any)=><GameCard key={g.id} game={g} onDone={async(score,maxScore,durationSeconds,mistakes)=>{const r=await fetch('/api/student/engagement',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'game_attempt',gameContentId:g.id,score,maxScore,durationSeconds,mistakes})});const j=await r.json();if(r.ok){setMsg('+'+j.xp+' XP kazandınız.');load()}}}/>)}</div>}</div>
  </div>;
}

function GameCard({game,onDone}:{game:any;onDone:(score:number,max:number,duration:number,mistakes:any)=>void}){
  const [open,setOpen]=useState(false);const [answer,setAnswer]=useState('');const [started,setStarted]=useState(0);const payload=game.payload||{};
  function start(){setOpen(true);setStarted(Date.now())}
  function submit(){
    let score=0,max=1,mistakes:any[]=[];
    if(game.gameType==='WORD'){score=answer.trim().toLocaleLowerCase('tr-TR')===String(payload.answer||'').trim().toLocaleLowerCase('tr-TR')?1:0;if(!score)mistakes=[answer]}
    else {score=1}
    onDone(score,max,Math.max(1,Math.round((Date.now()-started)/1000)),mistakes);setOpen(false);setAnswer('');
  }
  return <div className="gameCard"><span className="pill">{game.gameType}</span><h3>{game.title}</h3><p>{game.subject} · {game.topic}</p>{!open?<button className="btn primary" onClick={start}>Oyunu Başlat</button>:<div className="gamePlay">{game.gameType==='WORD'?<><p>{payload.clue||'İpucunu kullanarak kavramı bul.'}</p><input value={answer} onChange={e=>setAnswer(e.target.value)} maxLength={20} placeholder="Cevap"/></>:<p>{payload.instructions||'Görevi tamamlayın ve sonucu kaydedin.'}</p>}<button className="btn primary" onClick={submit}>Tamamla</button></div>}</div>;
}
