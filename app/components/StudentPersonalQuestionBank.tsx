'use client';

import Image from 'next/image';
import {useEffect,useMemo,useState} from 'react';

type BankItem={
  questionId:string;examType:string;subject:string;topic:string;prompt:string;
  addedAt:string;reason:'WRONG'|'MARKED'|'UPLOADED_WRONG';imageUrl?:string|null;
};
type GeneratedQuestion={
  id:string;examType:string;subject:string;topic:string;prompt:string;
  options:Record<string,string>;imageUrl?:string|null;inputMode:'CHOICE'|'TEXT';
};

function reasonLabel(v:BankItem['reason']){
  if(v==='MARKED')return 'İşaretlenen';
  if(v==='UPLOADED_WRONG')return 'Yüklenen yanlış';
  return 'Yanlış yapılan';
}

export function StudentPersonalQuestionBank(){
  const [items,setItems]=useState<BankItem[]>([]);
  const [stats,setStats]=useState({total:0,wrong:0,marked:0});
  const [quiz,setQuiz]=useState<{id:string;title:string;kind:string}|null>(null);
  const [questions,setQuestions]=useState<GeneratedQuestion[]>([]);
  const [answers,setAnswers]=useState<Record<string,string>>({});
  const [msg,setMsg]=useState('');
  const [busy,setBusy]=useState('');

  async function load(){
    const r=await fetch('/api/student/personal-question-bank',{cache:'no-store'});
    const j=await r.json();
    if(!r.ok)return setMsg('Hata: '+(j.error||'Kişisel soru bankası yüklenemedi.'));
    setItems(j.items||[]);
    setStats(j.stats||{total:0,wrong:0,marked:0});
  }
  useEffect(()=>{void load()},[]);

  async function generate(kind:'WEEKLY_WRONGS'|'MONTHLY_MIXED'){
    setBusy(kind);setMsg('');
    const r=await fetch('/api/student/personal-question-bank',{
      method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({action:'generate',kind})
    });
    const j=await r.json();setBusy('');
    if(!r.ok)return setMsg('Hata: '+(j.error||'Test oluşturulamadı.'));
    setQuiz(j.quiz);setQuestions(j.questions||[]);setAnswers({});
    setMsg(j.quiz.title+' hazırlandı · '+(j.questions?.length||0)+' soru.');
  }

  async function finish(){
    if(!quiz)return;
    setBusy('finish');setMsg('');
    const r=await fetch('/api/student/quizzes/'+quiz.id+'/attempt',{
      method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({answers})
    });
    const j=await r.json();setBusy('');
    if(!r.ok)return setMsg('Hata: '+(j.error||'Test sonucu kaydedilemedi.'));
    setMsg('Test tamamlandı · D '+j.attempt.correct+' · Y '+j.attempt.wrong+' · B '+j.attempt.blank+' · Net '+j.attempt.net+(j.reviewAdded?' · '+j.reviewAdded+' yanlış tekrar kuyruğuna eklendi.':''));
    await load();
  }

  async function removeMarked(questionId:string){
    const r=await fetch('/api/student/personal-question-bank',{
      method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({action:'bookmark',questionId,active:false})
    });
    const j=await r.json();
    if(!r.ok)return setMsg('Hata: '+(j.error||'İşaret kaldırılamadı.'));
    setMsg('İşaret kaldırıldı.');
    await load();
  }

  const groups=useMemo(()=>{
    const m=new Map<string,BankItem[]>();
    for(const item of items){const arr=m.get(item.subject)||[];arr.push(item);m.set(item.subject,arr)}
    return [...m.entries()];
  },[items]);

  return <div className="stack">
    {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')}>{msg}</div>}

    <div className="card">
      <div className="moduleHeaderRow">
        <div>
          <div className="moduleEyebrow">KİŞİSEL SORU BANKASI</div>
          <h2>Yanlışlarım ve işaretlediğim sorular</h2>
          <p className="muted">Yanlış yaptığın veya daha sonra tekrar görmek için işaretlediğin sorular tek havuzda tutulur.</p>
        </div>
        <span className="pill">{stats.total} soru</span>
      </div>

      <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))'}}>
        <div className="card" style={{margin:0}}><div className="kpi">{stats.wrong}</div><div className="muted">Yanlış soru</div></div>
        <div className="card" style={{margin:0}}><div className="kpi">{stats.marked}</div><div className="muted">İşaretlenen soru</div></div>
        <div className="card" style={{margin:0}}><div className="kpi">{stats.total}</div><div className="muted">Toplam kişisel havuz</div></div>
      </div>

      <div className="row" style={{marginTop:16,flexWrap:'wrap'}}>
        <button className="btn primary" onClick={()=>generate('WEEKLY_WRONGS')} disabled={busy==='WEEKLY_WRONGS'}>
          {busy==='WEEKLY_WRONGS'?'Hazırlanıyor…':'Haftalık Yanlışlar Testi Oluştur'}
        </button>
        <button className="btn" onClick={()=>generate('MONTHLY_MIXED')} disabled={busy==='MONTHLY_MIXED'}>
          {busy==='MONTHLY_MIXED'?'Hazırlanıyor…':'Aylık Karma Tekrar Oluştur'}
        </button>
      </div>
      <small className="muted">Haftalık test son 7 gündeki yanlışlardan; aylık karma tekrar son 30 gündeki yanlış + işaretli sorulardan, dersleri mümkün olduğunca dengeli dağıtarak hazırlanır.</small>
    </div>

    {quiz&&<div className="card">
      <div className="moduleHeaderRow"><div><div className="moduleEyebrow">OTOMATİK KİŞİSEL TEST</div><h2>{quiz.title}</h2></div><span className="pill">{questions.length} soru</span></div>
      {questions.map((q,i)=><article key={q.id} style={{padding:'18px 0',borderBottom:'1px solid var(--line)'}}>
        <div><strong>{i+1}. {q.subject} · {q.topic}</strong></div>
        {q.imageUrl&&<Image src={q.imageUrl} alt="Kişisel soru bankası sorusu" width={900} height={600} unoptimized style={{maxWidth:'100%',height:'auto',marginTop:12}}/>}
        <p>{q.prompt}</p>
        {q.inputMode==='CHOICE'
          ?<div className="stack">{Object.entries(q.options||{}).map(([key,val])=><label key={key} style={{display:'flex',gap:10,alignItems:'flex-start'}}>
              <input type="radio" name={'personal-'+q.id} checked={answers[q.id]===key} onChange={()=>setAnswers(a=>({...a,[q.id]:key}))}/>
              <span><strong>{key}</strong>) {String(val)}</span>
            </label>)}</div>
          :<input value={answers[q.id]||''} onChange={e=>setAnswers(a=>({...a,[q.id]:e.target.value}))} placeholder="Cevabını yaz"/>}
      </article>)}
      <button className="btn primary" style={{marginTop:16}} onClick={finish} disabled={busy==='finish'}>{busy==='finish'?'Sonuç hesaplanıyor…':'Testi Bitir ve Sonucu Kaydet'}</button>
    </div>}

    <div className="card">
      <div className="moduleHeaderRow"><div><div className="moduleEyebrow">SORU HAVUZUM</div><h2>Tüm kişisel sorularım</h2></div><span className="pill">{items.length} kayıt</span></div>
      {!items.length?<p className="muted">Henüz kişisel soru bankanda soru yok. Testte yanlış yaptığın veya işaretlediğin sorular otomatik burada toplanacak.</p>:<div className="stack">
        {groups.map(([subject,rows])=><details key={subject} open>
          <summary><strong>{subject}</strong> <span className="muted">· {rows.length} soru</span></summary>
          <div className="stack" style={{marginTop:12}}>
            {rows.slice(0,30).map(q=><article className="card" style={{margin:0}} key={q.questionId}>
              <div className="moduleHeaderRow">
                <div><strong>{q.topic}</strong><div className="muted">{q.examType} · {new Date(q.addedAt).toLocaleDateString('tr-TR')}</div></div>
                <span className="pill">{reasonLabel(q.reason)}</span>
              </div>
              {q.imageUrl&&<Image src={q.imageUrl} alt="Kişisel soru" width={220} height={150} unoptimized style={{maxWidth:220,height:'auto'}}/>}
              <p>{q.prompt}</p>
              {q.reason==='MARKED'&&<button type="button" className="btn" onClick={()=>removeMarked(q.questionId)}>İşareti Kaldır</button>}
            </article>)}
          </div>
        </details>)}
      </div>}
    </div>
  </div>;
}
