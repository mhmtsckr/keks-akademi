'use client';

import { FormEvent,useEffect,useState } from 'react';

export function CoachSessionWorkflow({studentId}:{studentId:string}){
  const [sessions,setSessions]=useState<any[]>([]);
  const [brief,setBrief]=useState<any>(null);
  const [selected,setSelected]=useState('');
  const [msg,setMsg]=useState('');

  async function load(){
    const r=await fetch('/api/coach/students/'+studentId+'/operations');const j=await r.json();
    if(j.ok){
      const list=(j.sessions||[]).filter((x:any)=>x.status!=='CANCELED');
      setSessions(list);
      if(!selected&&list[0])setSelected(list[0].id);
    }
    const b=await fetch('/api/coach/students/'+studentId+'/session-workflow');const bj=await b.json();
    if(bj.ok)setBrief(bj.brief);
  }
  useEffect(()=>{void load()},[]);

  async function prepare(){
    if(!selected)return setMsg('Hata: Önce bir seans seçin.');
    const r=await fetch('/api/coach/students/'+studentId+'/session-workflow',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'prepare',sessionId:selected})});
    const j=await r.json();if(!r.ok)return setMsg('Hata: '+(j.error||'Brifing oluşturulamadı.'));
    setBrief(j.brief);setMsg('Görüşme hazırlığı güncellendi.');
  }

  async function complete(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(!selected)return setMsg('Hata: Seans seçin.');
    const fd=new FormData(e.currentTarget);
    const checked=brief?.decisionSuggestions?.filter((_:string,i:number)=>fd.get('decision_'+i)==='on')||[];
    const custom=String(fd.get('customDecision')||'').split('\n').map(x=>x.trim()).filter(Boolean);
    const decisions=[...checked,...custom];
    const outcome=String(fd.get('outcome')||'').trim();
    if(!outcome)return setMsg('Hata: Görüşme sonucunu işaretleyin.');
    if(!decisions.length)return setMsg('Hata: En az bir yeni karar seçin veya yazın.');
    const body={action:'complete',sessionId:selected,outcome,decisions,createFollowUpTask:false};
    const r=await fetch('/api/coach/students/'+studentId+'/session-workflow',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json();if(!r.ok)return setMsg('Hata: '+(j.error||'Seans kapanışı kaydedilemedi.'));
    setMsg('Görüşme tamamlandı. Sonuç ve yeni kararlar kaydedildi.');e.currentTarget.reset();void load();
  }

  const selectedSession=sessions.find(x=>x.id===selected);

  return <div className="coachSessionFlow">
    <div className="card">
      <div className="moduleHeaderRow">
        <div>
          <div className="moduleEyebrow">GÖRÜŞME ÖNCESİ · OTOMATİK HAZIRLIK</div>
          <h2>Koç Görüşme Brifingi</h2>
          <p className="muted">Geçen görüşme kararları, bu haftanın yapılan/yapılmayan işleri, net değişimi, tekrar durumu ve sorulacak 5 soru otomatik hazırlanır.</p>
        </div>
        <button className="btn primary" onClick={prepare}>Brifingi Güncelle</button>
      </div>

      <div className="field"><label>Seans</label><select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Seans seçin</option>{sessions.map(x=><option value={x.id} key={x.id}>{new Date(x.startsAt).toLocaleString('tr-TR')} · {x.title} · {x.status}</option>)}</select></div>

      {brief&&<>
        <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))'}}>
          <BriefBlock title="GEÇEN GÖRÜŞMEDE ALINAN KARARLAR">
            {brief.previousSession?.decisions?.length
              ?brief.previousSession.decisions.map((x:string,i:number)=><p key={i}>✓ {x}</p>)
              :<p className="muted">Kayıtlı karar yok.</p>}
            {brief.previousSession?.nextStep&&<p><strong>Sonraki adım:</strong> {brief.previousSession.nextStep}</p>}
          </BriefBlock>

          <BriefBlock title="BU HAFTA YAPILANLAR">
            {brief.week?.completedActions?.length
              ?brief.week.completedActions.map((x:any)=><p key={x.id}>✓ {x.title}</p>)
              :<p className="muted">Tamamlanan görev kaydı yok.</p>}
          </BriefBlock>

          <BriefBlock title="YAPILMAYANLAR">
            {brief.week?.notCompletedActions?.length
              ?brief.week.notCompletedActions.map((x:any)=><p key={x.id} className="riskText">• {x.title}</p>)
              :<p className="muted">Geciken görev yok.</p>}
          </BriefBlock>

          <BriefBlock title="NET DEĞİŞİMİ">
            {brief.netChange
              ?<>
                <p><strong>{brief.netChange.examType}</strong></p>
                <p>{brief.netChange.previous==null?'Önceki karşılaştırılabilir deneme yok':brief.netChange.previous+' → '+brief.netChange.current}</p>
                <p className={brief.netChange.delta<0?'riskText':''}><strong>{brief.netChange.delta==null?'—':(brief.netChange.delta>0?'+':'')+brief.netChange.delta+' net'}</strong></p>
              </>
              :<p className="muted">Deneme verisi yok.</p>}
          </BriefBlock>

          <BriefBlock title="TEKRAR DURUMU">
            <p>Bu hafta tamamlanan: <strong>{brief.reviews?.completedCount||0}</strong></p>
            <p>Tekrar başarı oranı: <strong>{brief.reviews?.successPercent==null?'—':'%'+brief.reviews.successPercent}</strong></p>
            <p>Bugün yapılacak: <strong>{brief.reviews?.dueTodayCount||0}</strong></p>
            <p className={brief.reviews?.overdueCount?'riskText':''}>Geciken: <strong>{brief.reviews?.overdueCount||0}</strong></p>
          </BriefBlock>

          <BriefBlock title="HAFTALIK ÖZET">
            <p>Soru: <strong>{brief.weeklyChange?.questions?.current||0}</strong></p>
            <p>Doğruluk: <strong>%{brief.weeklyChange?.accuracy?.current||0}</strong></p>
            <p>Görev tamamlama: <strong>%{brief.weeklyChange?.taskCompletion?.current||0}</strong></p>
            <p>Odak: <strong>{brief.weeklyChange?.focusMinutes?.current||0} dk</strong></p>
          </BriefBlock>
        </div>

        {brief.agenda?.length>0&&<div className="briefAgenda"><h3>GÖRÜŞME GÜNDEMİ</h3>{brief.agenda.map((x:string,i:number)=><div key={i}><span>{i+1}</span><p>{x}</p></div>)}</div>}
        {brief.questions?.length>0&&<div className="briefAgenda"><h3>SORULMASI GEREKEN 5 SORU</h3>{brief.questions.map((x:string,i:number)=><div key={i}><span>{i+1}</span><p>{x}</p></div>)}</div>}
      </>}
    </div>

    <div className="card">
      <div className="moduleEyebrow">GÖRÜŞME SONRASI · SADE KAPANIŞ</div>
      <h2>Yalnız Sonucu ve Yeni Kararları İşaretle</h2>
      <p className="muted">{selectedSession?new Date(selectedSession.startsAt).toLocaleString('tr-TR')+' · '+selectedSession.title:'Seans seçilmedi'}</p>

      <form className="form" onSubmit={complete}>
        <fieldset className="field">
          <legend>Görüşme sonucu</legend>
          <label><input type="radio" name="outcome" value="PLAN_SURDURULSUN"/> Plan sürdürülsün</label>
          <label><input type="radio" name="outcome" value="PLAN_REVIZE_EDILSIN"/> Plan revize edilsin</label>
          <label><input type="radio" name="outcome" value="YAKIN_TAKIP_GEREKIYOR"/> Yakın takip gerekiyor</label>
          <label><input type="radio" name="outcome" value="HEDEF_GUNCELLENDI"/> Hedef / öncelik güncellendi</label>
        </fieldset>

        <div className="field">
          <label>Yeni kararlar</label>
          <div className="stack">
            {(brief?.decisionSuggestions||[]).map((x:string,i:number)=><label key={i}><input type="checkbox" name={'decision_'+i}/> {x}</label>)}
          </div>
        </div>

        <div className="field"><label>Ek karar (opsiyonel)</label><textarea name="customDecision" rows={3} placeholder="Varsa ek kararı yazın. Her karar yeni satırda olabilir."/></div>
        <button className="btn primary">Görüşmeyi Tamamla</button>
      </form>

      {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')} style={{marginTop:12}}>{msg}</div>}
    </div>
  </div>;
}

function BriefBlock({title,children}:{title:string;children:React.ReactNode}){
  return <div className="card" style={{margin:0}}><div className="moduleEyebrow">{title}</div>{children}</div>;
}
