'use client';

import { FormEvent,ReactNode,useEffect,useState } from 'react';
import {CoachWeeklyPlanApproval} from './CoachWeeklyPlanApproval';

export function CoachSessionWorkflow({studentId}:{studentId:string}){
  const [sessions,setSessions]=useState<any[]>([]);
  const [brief,setBrief]=useState<any>(null);
  const [planAudit,setPlanAudit]=useState<any>(null);
  const [learningImpact,setLearningImpact]=useState<any[]>([]);
  const [impactNote,setImpactNote]=useState('');
  const [selected,setSelected]=useState('');
  const [msg,setMsg]=useState('');
  const [pendingTopic,setPendingTopic]=useState('');
  const [followUpDone,setFollowUpDone]=useState<Record<string,boolean>>({});

  async function load(){
    const r=await fetch('/api/coach/students/'+studentId+'/operations');const j=await r.json();
    if(j.ok){
      const list=(j.sessions||[]).filter((x:any)=>x.status!=='CANCELED');
      setSessions(list);
      if(!selected&&list[0])setSelected(list[0].id);
    }
    const b=await fetch('/api/coach/students/'+studentId+'/session-workflow');const bj=await b.json();
    if(bj.ok)setBrief(bj.brief);
    try{
      const planResponse=await fetch('/api/coach/students/'+studentId+'/plan-adherence',{cache:'no-store'});
      if(planResponse.ok){const pa=await planResponse.json();if(pa.ok)setPlanAudit(pa);}
    }catch{/* Plan telemetry is supplemental; keep coach session accessible. */}
    const impact=await fetch('/api/coach/students/'+studentId+'/learning-impact',{cache:'no-store'});
    if(impact.ok){
      const ij=await impact.json();
      setLearningImpact(ij.items||[]);
      setImpactNote(ij.truncated?'Son kayıtların bir bölümü analize dahil edilemedi; değerlendirme sınırlıdır.':'');
    }
  }
  useEffect(()=>{void load()},[]);

  async function createLearningFollowUp(proposal:any){
    const key=proposal.subject+'|'+proposal.topic;
    if(pendingTopic||followUpDone[key])return;
    setPendingTopic(key);setMsg('');
    try{
      const r=await fetch('/api/coach/students/'+studentId+'/learning-follow-up',{
        method:'POST',headers:{'content-type':'application/json'},
        body:JSON.stringify({subject:proposal.subject,topic:proposal.topic})
      });
      const j=await r.json();
      if(!r.ok)throw new Error(j.error||'Yeniden ölçüm takibi açılamadı.');
      setFollowUpDone(x=>({...x,[key]:true}));
      void load();
      setMsg(j.alreadyPending
        ?'Bu konu için açık bir koç takip görevi zaten var.'
        :'Konu yeniden ölçüm önerisi koç takip kutuna eklendi. Öğrenci planı değiştirilmedi.');
    }catch(e){
      setMsg('Hata: '+(e instanceof Error?e.message:'Koç takibi oluşturulamadı.'));
    }finally{setPendingTopic('');}
  }

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
    <CoachWeeklyPlanApproval studentId={studentId} onActivated={()=>void load()}/>
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

        {planAudit&&<div className="card">
          <div className="moduleEyebrow">AKILLI ÇALIŞMA PLANI · ONAYLI PLANIN GERÇEKLEŞMESİ</div>
          <h3>Koç kararları için gerçekleşme sinyalleri</h3>
          {!planAudit.report
            ?<p className="muted">{planAudit.note||'Aktif ve onaylı akıllı haftalık program yok.'}</p>
            :<>
              <p className="muted">Onaylı plan: {planAudit.report.title}</p>
              <div className="row" style={{flexWrap:'wrap',gap:10}}>
                <span className="pill">Teslim edilen koç görevi: {planAudit.report.summary.confirmedCoachTasks}/{planAudit.report.summary.expectedCoachTasks}</span>
                <span className="pill">Geçmiş, teslimsiz: {planAudit.report.summary.missedCoachTasks}</span>
                <span className="pill">Zamanlayıcı verili gün: {planAudit.report.summary.observedFocusDays}</span>
              </div>
              {planAudit.report.recommendations?.length
                ?planAudit.report.recommendations.map((x:any,i:number)=><div className="notice" key={i}>
                    <strong>{x.reason}</strong><p>{x.action}</p>
                  </div>)
                :<p className="muted">Ek revizyon sinyali yok. Bu, bütün öneri bloklarının tamamlandığını göstermez.</p>}
              <details><summary>Günlük plan ve ölçülen süreleri karşılaştır</summary>
                {planAudit.report.days.map((d:any)=><p key={d.date}>
                  <strong>{d.date}:</strong> {d.plannedMinutes} dk planlanan;
                  {' '}{d.observedFocusMinutes==null?'ölçülen süre yok':d.observedFocusMinutes+' dk ölçülen odak'};
                  {' · '}Koç teslimi {d.coachConfirmed}/{d.coachAssigned}
                </p>)}
              </details>
              <small className="muted">{planAudit.report.evidenceNote}</small>
              {planAudit.dataLimitReached&&<p className="muted">Veri üst sınırına ulaşıldı; tüm oturumlar dahil olmayabilir.</p>}
            </>}
        </div>}

        <div className="card">
          <div className="moduleEyebrow">MİZA · KOÇ MÜDAHALE ETKİ İZLEME</div>
          <h3>Yeniden ölçümün gözlemlenen sonucu</h3>
          <p className="muted">Koçun açtığı konu kontrollerinin önceki 14 gün ve sonraki en fazla 21 günlük soru sonuçları karşılaştırılır. Tekrar görevinin tamamlanması öğrenme kanıtı değildir.</p>
          {impactNote&&<p className="muted">{impactNote}</p>}
          {learningImpact.length===0
            ?<p className="muted">Son 45 günde koçun açtığı yeniden ölçüm takibi bulunmuyor.</p>
            :<div className="stack">
              {learningImpact.slice(0,8).map((item:any)=><div className="notice" key={item.taskId}>
                <div className="row" style={{justifyContent:'space-between',gap:8,flexWrap:'wrap',alignItems:'center'}}>
                  <strong>{item.subject} · {item.topic}</strong>
                  <span className="pill">{item.state==='IMPROVED_SIGNAL'?'Olumlu sinyal':
                    item.state==='DECLINED_SIGNAL'?'Gerileme sinyali':
                    item.state==='NO_CLEAR_CHANGE'?'Belirgin değişim yok':
                    item.state==='WAITING_FOR_RECHECK'?'Yeniden ölçüm bekleniyor':'Kanıt yetersiz'}</span>
                </div>
                <p><strong>Önce:</strong> {item.baseline.questions} soru / {item.baseline.studyDays} gün
                  {' · '}<strong>Sonra:</strong> {item.followUp.questions} soru / {item.followUp.studyDays} gün</p>
                {item.accuracyDelta!==null
                  ?<p>Doğruluk: %{item.baseline.accuracy} → %{item.followUp.accuracy}
                    {' · '}<strong>{item.accuracyDelta>0?'+':''}{item.accuracyDelta} puan</strong></p>
                  :<p className="muted">Karşılaştırılabilir iki dönem verisi henüz yok.</p>}
                <p className="muted">{item.note}</p>
                <p><strong>Önerilen koç adımı:</strong> {item.nextAction}</p>
              </div>)}
            </div>}
          <small className="muted">Bunlar gözlemsel ilişkilerdir; müdahalenin değişime neden olduğu bilimsel olarak doğrulanmaz.</small>
        </div>

        {brief.topicDiagnostics?.length>0&&<div className="card">
          <div className="moduleEyebrow">ÖĞRENME KANITI · SON 14 GÜN</div>
          <h3>Farklı günlerdeki konu sonuçları</h3>
          <p className="muted">Öğrenci görev beyanları tek başına kalıcı öğrenme kanıtı sayılmaz. En az dört ayrı gün ve iki dönem karşılaştırması gerekir.</p>
          <div className="stack">
            {brief.topicDiagnostics.slice(0,5).map((x:any)=><div key={x.subject+'|'+x.topic} className="notice">
              <strong>{x.subject} · {x.topic}</strong>
              <p className="muted">{x.reason}</p>
              <p><strong>Koç için öneri:</strong> {x.nextAction}</p>
              {brief.topicFollowUps?.find((p:any)=>p.subject===x.subject&&p.topic===x.topic)&&(()=>{
                const proposal=brief.topicFollowUps.find((p:any)=>p.subject===x.subject&&p.topic===x.topic);
                const key=proposal.subject+'|'+proposal.topic;
                return <div className="row" style={{gap:8,alignItems:'center',flexWrap:'wrap'}}>
                  <small className="muted">{proposal.questionCount} yeni soru · önerilen kontrol günü: {new Date(proposal.dueDate+'T12:00:00+03:00').toLocaleDateString('tr-TR')}</small>
                  <button type="button" className="btn" disabled={Boolean(pendingTopic)||followUpDone[key]}
                    onClick={()=>void createLearningFollowUp(proposal)}>
                    {followUpDone[key]?'Koç takibinde':pendingTopic===key?'Kaydediliyor…':'Koç Takibine Ekle'}
                  </button>
                </div>;
              })()}
            </div>)}
          </div>
        </div>}

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

function BriefBlock({title,children}:{title:string;children:ReactNode}){
  return <div className="card" style={{margin:0}}><div className="moduleEyebrow">{title}</div>{children}</div>;
}
