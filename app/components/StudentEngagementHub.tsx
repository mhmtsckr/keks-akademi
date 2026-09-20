'use client';

import { FormEvent,useEffect,useMemo,useState } from 'react';

export function StudentEngagementHub(){
  const [data,setData]=useState<any>(null);
  const [msg,setMsg]=useState('');
  const [chat,setChat]=useState<Array<{role:string,content:string}>>([]);
  const [busy,setBusy]=useState(false);
  const [leaderMode,setLeaderMode]=useState<'weekly'|'monthly'>('weekly');

  async function load(){const r=await fetch('/api/student/engagement');const j=await r.json();if(j.ok)setData(j)}
  useEffect(()=>{load()},[]);

  async function api(body:any){
    const r=await fetch('/api/student/engagement',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const j=await r.json();
    if(!r.ok){setMsg('Hata: '+(j.error||'İşlem başarısız.'));return null}await load();return j;
  }
  async function progress(id:string,currentValue:number){const j=await api({action:'progress',id,currentValue});if(j)setMsg('Aksiyon ilerlemesi güncellendi.')}
  async function analytics(e:FormEvent<HTMLFormElement>){e.preventDefault();const fd=new FormData(e.currentTarget);const j=await api({action:'analytics',examType:fd.get('examType'),subject:fd.get('subject'),topic:fd.get('topic'),questionType:fd.get('questionType')||'GENEL',correct:Number(fd.get('correct')),wrong:Number(fd.get('wrong')),blank:Number(fd.get('blank')),avgSeconds:fd.get('avgSeconds')?Number(fd.get('avgSeconds')):undefined,examDate:fd.get('examDate')||undefined});if(j){setMsg('Test/deneme analitiği kaydedildi.');e.currentTarget.reset()}}
  async function forum(e:FormEvent<HTMLFormElement>,cohortId:string){e.preventDefault();const fd=new FormData(e.currentTarget);const body=String(fd.get('body')||'');const j=await api({action:'forum_post',cohortId,body});if(j){setMsg('Kohort mesajı gönderildi.');e.currentTarget.reset()}}

  async function chatSubmit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();const fd=new FormData(e.currentTarget);const message=String(fd.get('message')||'').trim();if(!message)return;
    setChat(x=>[...x,{role:'user',content:message}]);setBusy(true);e.currentTarget.reset();
    const r=await fetch('/api/student/coachbot',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message})});const j=await r.json();setBusy(false);
    setChat(x=>[...x,{role:'assistant',content:r.ok?j.reply:'Yanıt oluşturulamadı.'}]);
  }

  if(!data)return <div className="card"><p className="muted">Koçluk ve oyunlaştırma verileri yükleniyor…</p></div>;
  const xp=data.gamification?.xp||0,level=data.gamification?.level||1;
  const leaderboard=leaderMode==='weekly'?data.weeklyLeaderboard:data.monthlyLeaderboard;

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
      <div className="card leaderboardCard"><div className="moduleHeaderRow"><div><div className="moduleEyebrow">LİDERLİK TABLOSU</div><h2>XP Sıralaması</h2></div><div className="row"><button className={'btn '+(leaderMode==='weekly'?'primary':'')} onClick={()=>setLeaderMode('weekly')}>Haftalık</button><button className={'btn '+(leaderMode==='monthly'?'primary':'')} onClick={()=>setLeaderMode('monthly')}>Aylık</button></div></div>{leaderboard.slice(0,10).map((x:any,i:number)=><div className="leaderRow" key={x.studentId}><b>{i+1}</b><span>{x.student?.fullName||'Öğrenci'}</span><strong>{x.xp} XP</strong></div>)}</div>
    </div>

    <div className="card"><div className="moduleEyebrow">TEST / DENEME ANALİTİĞİ</div><h2>Eksik haritasına veri ekle</h2><form className="analyticsEntryForm" onSubmit={analytics}><input name="examType" placeholder="TYT / AYT / LGS" required/><input name="subject" placeholder="Ders" required/><input name="topic" placeholder="Konu" required/><input name="questionType" placeholder="Soru tipi"/><input name="correct" type="number" min="0" placeholder="Doğru" required/><input name="wrong" type="number" min="0" placeholder="Yanlış" required/><input name="blank" type="number" min="0" placeholder="Boş" required/><input name="avgSeconds" type="number" min="0" placeholder="Ort. sn"/><input name="examDate" type="date"/><button className="btn primary">Kaydet</button></form></div>

    <div className="card"><div className="moduleEyebrow">EĞİTSEL OYUNLAR</div><h2>Mikro tekrar alanı</h2>{data.games.length===0?<p className="muted">Yönetici henüz oyun içeriği yayınlamadı.</p>:<div className="gameGrid">{data.games.map((g:any)=><GameCard key={g.id} game={g} onDone={async(score,maxScore,durationSeconds,mistakes)=>{const j=await api({action:'game_attempt',gameContentId:g.id,score,maxScore,durationSeconds,mistakes});if(j)setMsg('+'+j.xp+' XP kazandınız.')}}/>)}</div>}</div>

    {data.cohorts.length>0&&<div className="card"><div className="moduleEyebrow">KAPALI KOHORT FORUMU</div><h2>Birbirinizi motive edin</h2><div className="cohortGrid">{data.cohorts.map((m:any)=><div className="cohortCard" key={m.cohort.id}><h3>{m.cohort.name}</h3><p className="muted">{m.cohort.description}</p><div className="forumFeed">{m.cohort.posts.slice().reverse().map((p:any)=><div className="forumPost" key={p.id}><strong>{p.student?.fullName||'Koç'}</strong><span>{new Date(p.createdAt).toLocaleString('tr-TR')}</span><p>{p.body}</p></div>)}</div><form className="row" onSubmit={e=>forum(e,m.cohort.id)}><input name="body" placeholder="Kohorta mesaj yaz…" required style={{flex:1}}/><button className="btn primary">Gönder</button></form></div>)}</div></div>}
  </div>;
}

function GameCard({game,onDone}:{game:any;onDone:(score:number,max:number,duration:number,mistakes:any)=>void}){
  const [open,setOpen]=useState(false);const [started,setStarted]=useState(0);const [word,setWord]=useState('');const [values,setValues]=useState<Record<string,string>>({});const payload=game.payload||{};
  function start(){setOpen(true);setStarted(Date.now());setValues({});setWord('')}
  function finish(score:number,max:number,mistakes:any){onDone(score,max,Math.max(1,Math.round((Date.now()-started)/1000)),mistakes);setOpen(false)}
  function submit(){
    if(game.gameType==='WORD'){const ok=word.trim().toLocaleLowerCase('tr-TR')===String(payload.answer||'').trim().toLocaleLowerCase('tr-TR');finish(ok?1:0,1,ok?[]:[word]);return}
    if(game.gameType==='CROSSWORD'){const clues=payload.clues||[];let score=0;const mistakes:any[]=[];clues.forEach((x:any,i:number)=>{const v=values[String(i)]||'';if(v.trim().toLocaleLowerCase('tr-TR')===String(x.answer||'').trim().toLocaleLowerCase('tr-TR'))score++;else mistakes.push({clue:x.clue,answer:v})});finish(score,Math.max(1,clues.length),mistakes);return}
    if(game.gameType==='MATCH'){const pairs=payload.pairs||[];let score=0;const mistakes:any[]=[];pairs.forEach((x:any,i:number)=>{if(values[String(i)]===String(x.right))score++;else mistakes.push({left:x.left,answer:values[String(i)]})});finish(score,Math.max(1,pairs.length),mistakes);return}
    const items=payload.items||[];let score=0;const mistakes:any[]=[];items.forEach((x:any,i:number)=>{if(values[String(i)]===String(x.group))score++;else mistakes.push({label:x.label,answer:values[String(i)]})});finish(score,Math.max(1,items.length),mistakes);
  }
  const matchOptions=useMemo(()=>game.gameType==='MATCH'?(payload.pairs||[]).map((x:any)=>String(x.right)).sort():[],[game.gameType,game.payload]);
  const connectionGroups=useMemo(()=>[...new Set((payload.items||[]).map((x:any)=>String(x.group)))],[game.payload]);
  return <div className="gameCard"><span className="pill">{game.gameType}</span><h3>{game.title}</h3><p>{game.subject} · {game.topic}</p>{!open?<button className="btn primary" onClick={start}>Oyunu Başlat</button>:<div className="gamePlay">
    {game.gameType==='WORD'&&<><p>{payload.clue||'İpucunu kullanarak kavramı bul.'}</p><div className="wordCells">{String(payload.answer||'').split('').map((_:string,i:number)=><span key={i}>{word[i]||''}</span>)}</div><input value={word} onChange={e=>setWord(e.target.value.toLocaleUpperCase('tr-TR'))} maxLength={String(payload.answer||'').length||6} placeholder="Tahmin"/></>}
    {game.gameType==='CROSSWORD'&&(payload.clues||[]).map((x:any,i:number)=><div className="gameQuestion" key={i}><span>{i+1}. {x.clue}</span><input value={values[String(i)]||''} onChange={e=>setValues(v=>({...v,[String(i)]:e.target.value}))}/></div>)}
    {game.gameType==='MATCH'&&(payload.pairs||[]).map((x:any,i:number)=><div className="gameQuestion" key={i}><strong>{x.left}</strong><select value={values[String(i)]||''} onChange={e=>setValues(v=>({...v,[String(i)]:e.target.value}))}><option value="">Eşini seç</option>{matchOptions.map((o:string)=><option key={o}>{o}</option>)}</select></div>)}
    {game.gameType==='CONNECTIONS'&&(payload.items||[]).map((x:any,i:number)=><div className="gameQuestion" key={i}><strong>{x.label}</strong><select value={values[String(i)]||''} onChange={e=>setValues(v=>({...v,[String(i)]:e.target.value}))}><option value="">Grup seç</option>{connectionGroups.map((o:any)=><option key={String(o)}>{String(o)}</option>)}</select></div>)}
    <button className="btn primary" onClick={submit}>Kontrol Et ve XP Kazan</button>
  </div>}</div>;
}
