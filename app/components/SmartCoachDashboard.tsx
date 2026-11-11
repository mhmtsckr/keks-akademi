'use client';

import Image from 'next/image';
import { useEffect,useMemo,useState } from 'react';
import { MizaLogo } from './MizaLogo';

function pctWidth(v:number|null){return Math.max(0,Math.min(100,v??0))+'%';}

export function SmartCoachDashboard(){
  const [metrics,setMetrics]=useState<any>(null);
  const [plan,setPlan]=useState<any>(null);
  const [approvedPlan,setApprovedPlan]=useState<any>(null);
  const [adherence,setAdherence]=useState<any>(null);
  const [reviews,setReviews]=useState<any[]>([]);
  const [reviewAnswers,setReviewAnswers]=useState<Record<string,string>>({});
  const [msg,setMsg]=useState('');
  const [reviewBusy,setReviewBusy]=useState(false);

  async function load(){
    const [m,p,r,a]=await Promise.all([
      fetch('/api/student/metrics').then(x=>x.json()),
      fetch('/api/student/smart-plan').then(x=>x.json()),
      fetch('/api/student/reviews').then(x=>x.json()),
      fetch('/api/student/plan-adherence',{cache:'no-store'}).then(x=>x.json()).catch(()=>({ok:false}))
    ]);
    if(m.ok)setMetrics(m);
    if(p.ok){setPlan(p.plan);setApprovedPlan(p.activePlan||null);}
    if(r.ok)setReviews(r.items||[]);
    if(a.ok)setAdherence(a);
  }
  useEffect(()=>{load()},[]);

  async function savePlan(){
    setMsg('Haftalık taslak hazırlanıyor...');
    try{
      const r=await fetch('/api/student/smart-plan',{method:'POST',cache:'no-store'});
      const j=await r.json();
      if(!r.ok)throw new Error(j.error||'Taslak oluşturulamadı.');
      setPlan(j.plan);
      setMsg('Haftalık taslak güncellendi; koçun aktif programı değiştirilmedi.');
    }catch(error){setMsg('Hata: '+(error instanceof Error?error.message:'Taslak oluşturulamadı.'));}
  }

  async function requestReview(){
    setReviewBusy(true);
    try{
      const r=await fetch('/api/student/smart-plan',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'REQUEST_REVIEW'})});
      const j=await r.json();
      if(!r.ok)throw new Error(j.error||'Koç inceleme talebi oluşturulamadı.');
      setMsg(j.alreadyPending?'Koçunun inceleme kutusunda bu taslak için açık talep var.':'Haftalık taslak koçunun incelemesine gönderildi; aktif plan değişmedi.');
    }catch(error){setMsg('Hata: '+(error instanceof Error?error.message:'Talep gönderilemedi.'));}
    finally{setReviewBusy(false);}
  }

  async function review(id:string,answer:string){
    const r=await fetch('/api/student/reviews',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id,answer})});
    const j=await r.json();
    if(!r.ok){setMsg('Hata: '+(j.error||'Tekrar güncellenemedi.'));return}
    setMsg(j.correct?'Doğru: bir sonraki tekrar tarihi planlandı.':'Yanlış. Doğru cevap: '+j.correctAnswer+(j.explanation?' · '+j.explanation:''));
    setReviewAnswers(x=>({...x,[id]:''}));
    load();
  }

  const trends=useMemo(()=>{
    const rows=metrics?.series||[];
    const by:any={};
    for(const x of rows){
      const p=x.payload||{};
      const subjectNets=p.subjectNets||{};
      for(const [s,n] of Object.entries(subjectNets)){
        by[s]=by[s]||[];
        by[s].push({date:x.date,net:Number(n)||0});
      }
      if(p.net!=null){
        by[x.examType]=by[x.examType]||[];
        by[x.examType].push({date:x.date,net:Number(p.net)||0});
      }
    }
    return by;
  },[metrics]);

  const due=reviews.filter(x=>new Date(x.dueAt)<=new Date()).length;
  const goalPct=metrics?.goal?.percent??0;

  return <div className="stack">
    <div className="smartCoachTop">
      <div className="card goalCard">
        <div className="moduleEyebrow">HEDEFE YAKLAŞMA</div>
        <div className="goalCardMain"><div><div className="kpi">{metrics?.goal?.percent==null?'—':'%'+goalPct}</div><strong>{metrics?.goal?.label||'Hedef verisi bekleniyor'}</strong></div><span className="moduleIcon">⚑</span></div>
        <div className="goldProgress"><i style={{width:pctWidth(goalPct)}}/></div>
        <div className="goalDetails">{(metrics?.goal?.details||[]).map((x:string)=><span key={x}>{x}</span>)}</div>
      </div>

      <div className="card planActionCard">
        <div className="moduleHeaderRow">
          <div><div className="moduleEyebrow">MİZA · ÖĞRENME ORKESTRATÖRÜ</div><h2>Haftalık plan taslağını hazırla</h2></div>
          <MizaLogo/>
        </div>
        <p className="muted">Son doğruluk verileri, tamamlanmamış konular ve tekrar kuyruğuna göre açıklanabilir 7 günlük çalışma taslağı oluşturur. MİZA koçun hedefini veya müdahale kararını değiştirmez; taslak koçluk sürecinin yerine geçmez.</p>
        <div className="row" style={{flexWrap:'wrap',gap:8}}>
          <button className="btn primary" onClick={savePlan}>Haftalık Taslağı Yenile</button>
          <button className="btn" onClick={requestReview} disabled={reviewBusy}>
            {reviewBusy?'Koça iletiliyor…':'Taslağı Koçuma İlet'}
          </button>
        </div>
      </div>

      <div className="card dueReviewCard">
        <div className="moduleEyebrow">BUGÜN</div>
        <div className="goalCardMain"><div><div className="kpi">{due}</div><strong>Tekrar bekliyor</strong></div><span className="moduleIcon">↺</span></div>
        <p className="muted">Yanlış soru tekrar sistemindeki vadesi gelen sorular.</p>
      </div>
    </div>

    {plan?.evidence&&<div className="card">
      <div className="moduleEyebrow">AKILLI KOÇ · VERİ GÜVENİ</div>
      <h3>{plan.evidence.confidence==='HIGH'?'Birden fazla güne yayılan güçlü gözlem':
        plan.evidence.confidence==='MEDIUM'?'Orta düzeyde gözlem':'Ek ölçüm gerekli'}</h3>
      <p className="muted">{plan.evidence.message}</p>
      <div className="stack">
        {(plan.evidence.subjects||[]).slice(0,4).map((x:any)=><div key={x.subject} className="notice">
          <strong>{x.subject}</strong>
          <div className="muted">{x.reason}</div>
          <small>{x.priority==='REVIEW'?'Öncelik: Yanlış/boş analizli konu kontrolü':
            x.priority==='MONITOR'?'Öncelik: Kısa test ve tekrar':
            x.priority==='MAINTAIN'?'Güçlü alan: Düzenli pekiştirme':'Eksik kanıt: Farklı günlerde yeni soru seti'}</small>
        </div>)}
      </div>
      <small className="muted">Öğrenci beyanı, bağımsız ölçme ve değerlendirme sonucunun yerine geçmez.</small>
    </div>}

    {Array.isArray(plan?.topicDiagnostics)&&plan.topicDiagnostics.length>0&&<div className="card">
      <div className="moduleEyebrow">AKILLI KOÇ · FARKLI GÜNLERDE ÖĞRENME</div>
      <h2>Konu bazlı kanıt ve sonraki adım</h2>
      <p className="muted">Tek deneme başarı kabul edilmez. Son 35 günün farklı günlerdeki sonuçları karşılaştırılır; bunlar öğrencinin beyanına dayanan ölçümlerdir.</p>
      <div className="stack">
        {plan.topicDiagnostics.slice(0,5).map((x:any)=><article key={x.subject+'|'+x.topic} className="notice">
          <div className="row" style={{justifyContent:'space-between',alignItems:'center',gap:8,flexWrap:'wrap'}}>
            <strong>{x.subject} · {x.topic}</strong>
            <span className="pill">{x.signal==='REGRESSING'?'Gerileme sinyali':x.signal==='AT_RISK'?'Desteğe ihtiyaç var':
              x.signal==='IMPROVING'?'Gelişme sinyali':x.signal==='CONSISTENT'?'İstikrarlı sonuç':
              x.signal==='MIXED'?'Değişken sonuç':'Ek veri gerekli'}</span>
          </div>
          <p className="muted">{x.reason}</p>
          <p><strong>Sonraki adım:</strong> {x.nextAction}</p>
          <small className="muted">Kanıt: {x.studyDays} farklı gün · {x.totalQuestions} soru · {x.confidence==='MULTI_DAY'?'Karşılaştırılabilir günler':'Henüz karşılaştırma için yeterli değil'}</small>
        </article>)}
      </div>
    </div>}

    {approvedPlan&&<div className="card">
      <div className="moduleEyebrow">KOÇ ONAYLI · ETKİN HAFTALIK PROGRAM</div>
      <h2>Koçumun onayladığı çalışma planı</h2>
      <p className="muted">{approvedPlan.title} · Onay tarihi: {new Date(approvedPlan.createdAt).toLocaleDateString('tr-TR',{timeZone:'Europe/Istanbul'})}</p>
      <p className="muted">Bu bölüm etkinleştirilmiş programı gösterir. Aşağıdaki otomatik öneri taslağı koç onayı olmadan bu planı değiştiremez.</p>
      <div className="stack">
        {(approvedPlan.days||[]).slice(0,7).map((d:any,i:number)=><div className="notice" key={d.date||i}>
          <strong>{new Date(d.date).toLocaleDateString('tr-TR',{
            timeZone:'Europe/Istanbul',weekday:'long',day:'numeric',month:'long'
          })}</strong>
          <p className="muted">Planlanan: {d.plannedMinutes??'—'} dk · Kapasite: {d.capacityMinutes??'—'} dk</p>
          {Array.isArray(d.tasks)?d.tasks.slice(0,8).map((t:any,j:number)=><p key={t.actionId||t.reviewIds?.join('|')||j}>
            {t.title||t.type} <small className="muted">· {t.duration??'—'} dk</small>
          </p>):<p className="muted">Bu güne ait görev listesi bulunmuyor.</p>}
        </div>)}
      </div>
    </div>}

    {adherence&&<div className="card">
      <div className="moduleEyebrow">AKILLI KİŞİSEL PLAN · GERÇEKLEŞME İZLEME</div>
      <h3>Onaylı planda gerçekleşen çalışmalar</h3>
      {!adherence.approvedPlan||!adherence.report
        ?<p className="muted">{adherence.note||'Koç tarafından onaylanmış etkin haftalık plan yok.'}</p>
        :<>
          <p className="muted">Yalnızca koçun onayladığı etkin programdaki görev teslimleri ve ölçülen zamanlayıcı oturumları kullanılır. Öğrenci taslakları bu oranlara dahil değildir.</p>
          <div className="row" style={{gap:10,flexWrap:'wrap'}}>
            <span className="pill">Koç görevi: {adherence.report.summary.confirmedCoachTasks} / {adherence.report.summary.expectedCoachTasks}</span>
            <span className="pill">Geçmiş, teslimsiz görev: {adherence.report.summary.missedCoachTasks}</span>
            <span className="pill">Ölçülmüş odak günü: {adherence.report.summary.observedFocusDays}</span>
          </div>
          <div className="stack">
            {adherence.report.days.map((d:any)=><div className="notice" key={d.date}>
              <strong>{new Date(d.date+'T12:00:00+03:00').toLocaleDateString('tr-TR',{weekday:'long',day:'numeric',month:'long'})}</strong>
              <p className="muted">Planlanan: {d.plannedMinutes} dk · Zamanlayıcıyla ölçülen: {d.observedFocusMinutes==null?'Süre kaydı yok':d.observedFocusMinutes+' dk'}</p>
              <small className="muted">Koç teslimi {d.coachConfirmed}/{d.coachAssigned} · {d.status==='FUTURE'?'Gelecek gün':d.status==='TODAY'?'Bugün':'Geçmiş gün'} · {d.suggestedBlocks} öneri bloğu (teslim kanıtı yok)</small>
            </div>)}
          </div>
          <details>
            <summary>Veri sınırları ve önerilen koç adımları</summary>
            <p className="muted">{adherence.report.evidenceNote}</p>
            {adherence.dataLimitReached&&<p className="muted">Kayıt üst sınırına ulaşıldı; bazı veriler değerlendirmeye dahil edilmemiş olabilir.</p>}
            {(adherence.report.recommendations||[]).map((x:any,i:number)=><p key={i}><strong>{x.reason}</strong> {x.action}</p>)}
          </details>
        </>}
    </div>}

    {plan?.prioritySummary&&<div className="card">
      <div className="moduleEyebrow">AKILLI KİŞİSEL ÇALIŞMA PLANI · GERÇEK KAPASİTE</div>
      <h3>Koç görevleri ve tekrarlar önce planlandı</h3>
      <div className="row" style={{gap:12,flexWrap:'wrap'}}>
        <span className="pill">{plan.prioritySummary.coachTasksIncluded} koç görevi taslakta</span>
        <span className="pill">{plan.prioritySummary.allocatedReviewCount} tekrar önerilen günlere dağıtıldı</span>
        <span className="pill">Günlük öneri: {plan.capacityProfile?.suggestedDailyMinutes||'—'} dk</span>
        {plan.prioritySummary.academicInterventionsSuggested>0&&<span className="pill">
          Akademik kanıt incelemesi taslağı: {plan.prioritySummary.academicInterventionsSuggested}
        </span>}
      </div>
      <p className="muted">Bunlar yalnızca taslak önceliklerdir. Gerçek koç görevlerinin ve tekrarların tarihleri değişmedi; yeni görevler öğrenci hesabına otomatik eklenmedi.</p>
      {plan.prioritySummary.coachTasksNeedingDecision?.length>0&&<div className="notice error">
        <strong>Kapasiteyi aşan {plan.prioritySummary.coachTasksNeedingDecision.length} koç görevi var</strong>
        <p className="muted">Bu görevler gizlenmedi veya kendiliğinden ertelenmedi. Koçun yeniden planlama kararı gerekir.</p>
        {plan.prioritySummary.coachTasksNeedingDecision.slice(0,5).map((x:any)=>
          <p key={x.id}><strong>{x.title}</strong>: {x.minutes} dk — {x.reason}</p>)}
      </div>}
      {plan.prioritySummary.academicInterventionsUnscheduled>0&&<p className="muted">
        Bu haftanın kalan kapasitesine alınmayan akademik inceleme önerisi: {plan.prioritySummary.academicInterventionsUnscheduled}.
        Bunlar öğrencinin zorunlu görevi değildir; koç ek değerlendirme yapabilir.
      </p>}
      {plan.prioritySummary.pendingReviewCount>0&&<div className="notice">
        <strong>Henüz taslağa sığmayan {plan.prioritySummary.pendingReviewCount} tekrar var.</strong>
        <p className="muted">Bu sorular tamamlandı kabul edilmez. Mevcut tekrar kuyruğunda durur; koçla kapasite düzenlenebilir.</p>
      </div>}
      {(plan.prioritySummary.reviewQueueTruncated||plan.prioritySummary.coachQueueTruncated)&&
        <p className="muted">Veri sınırına ulaşıldı. Bu plan, mevcut tüm görevleri veya tekrarları kapsamıyor olabilir.</p>}
    </div>}

    {plan&&<div className="card weeklyPlanCard"><div className="moduleHeaderRow"><div><div className="moduleEyebrow">7 GÜNLÜK ÖNERİ TASLAĞI</div><h2>Bu haftanın çalışma akışı</h2></div><span className="moduleIcon">▦</span></div>{plan.explanation&&<div className="notice"><strong>Plan neden böyle?</strong><div className="muted">{plan.explanation}</div></div>}<div className="weeklyPlanGrid">{plan.days.map((d:any)=><div className="dayPlan" key={d.date}><strong>{new Date(d.date).toLocaleDateString('tr-TR',{weekday:'long'})}</strong><span className="dayDate">{new Date(d.date).toLocaleDateString('tr-TR',{day:'numeric',month:'short'})}</span><small className="muted">Plan: {d.plannedMinutes} / {d.capacityMinutes} dk · Kalan {d.availableMinutes??Math.max(0,d.capacityMinutes-d.plannedMinutes)} dk</small>{d.tasks.length===0?<p className="muted">Dinlenme / telafi</p>:d.tasks.map((t:any,i:number)=><div className="dayTask" key={i}><span>{t.type==='COACH_ACTION'?'KOÇ GÖREVİ':t.type==='REVIEW'?'TEKRAR':t.type==='TOPIC'?'KONU':t.type==='PRACTICE'?'SORU':'ÇALIŞMA'}</span><b>{t.title}</b><small>{t.duration} dk{t.questions?' · '+t.questions+' soru':''}</small>{t.reason&&<small className="muted">{t.reason}</small>}</div>)}</div>)}</div></div>}

    <div className="card trendCard">
      <div className="moduleHeaderRow"><div><div className="moduleEyebrow">NET TRENDLERİ</div><h2>Ders bazlı gelişim</h2></div><span className="moduleIcon">⌁</span></div>
      {Object.keys(trends).length===0?<p className="muted">Trend oluşturmak için en az iki deneme/net kaydı gerekir.</p>:<div className="trendList">{Object.entries(trends).map(([subject,rows]:any)=><div key={subject} className="trendRow">
        <div className="trendLabel"><strong>{subject}</strong><span>Son net {rows[rows.length-1]?.net}</span></div>
        <div className="trendBars">{rows.slice(-10).map((x:any,i:number)=>{const max=Math.max(...rows.map((z:any)=>z.net),1);const h=Math.max(6,(x.net/max)*72);return <i key={i} title={new Date(x.date).toLocaleDateString('tr-TR')+' · '+x.net+' net'} style={{height:h}}/>})}</div>
      </div>)}</div>}
    </div>

    <div className="card reviewCard">
      <div className="moduleHeaderRow"><div><div className="moduleEyebrow">YANLIŞ SORU TEKRARI</div><h2>0–1–3–7–14–28 tekrar kuyruğu</h2></div><span className="moduleIcon">↺</span></div>
      {reviews.length===0?<p className="muted">Tekrar kuyruğunda soru yok.</p>:<div className="reviewList">{reviews.slice(0,10).map((x:any)=><article key={x.id} className="reviewItem">
        <div className="reviewItemHead"><div><strong>{x.question.subject} · {x.question.topic}</strong><span>Aşama {x.stepIndex} · {new Date(x.dueAt).toLocaleDateString('tr-TR')}</span></div>{new Date(x.dueAt)<=new Date()&&<span className="pill">Bugün</span>}</div>
        {x.question.imageUrl&&<div className="reviewQuestionImage"><Image src={x.question.imageUrl} alt="Tekrar edilecek yanlış soru" width={720} height={480} unoptimized/></div>}
        <p>{x.question.prompt}</p>
        {new Date(x.dueAt)<=new Date()&&(x.question.inputMode==='TEXT'
          ? <div className="reviewTextAnswer">
              <input value={reviewAnswers[x.id]||''} onChange={e=>setReviewAnswers(v=>({...v,[x.id]:e.target.value}))} placeholder="Cevabını yaz"/>
              <button className="btn primary" disabled={!String(reviewAnswers[x.id]||'').trim()} onClick={()=>review(x.id,String(reviewAnswers[x.id]||'').trim())}>Cevabı Kontrol Et</button>
            </div>
          : <div className="answerGrid">{Object.entries(x.question.options||{}).map(([key,val]:any)=><button key={key} className="btn" onClick={()=>review(x.id,key)}><strong>{key})</strong> {val}</button>)}</div>)}
      </article>)}</div>}
    </div>
    {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')}>{msg}</div>}
  </div>;
}
