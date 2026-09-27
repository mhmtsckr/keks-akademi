'use client';

import {FormEvent,useEffect,useState} from 'react';

function masteryLabel(v:string){
  return v==='NEW'?'Yeni'
    :v==='LEARNING'?'Öğreniliyor'
    :v==='REINFORCING'?'Pekiştiriliyor'
    :v==='DURABLE'?'Kalıcı'
    :v==='RISKY'?'Riskli':'—';
}

export function CoachLearningIntelligence({studentId}:{studentId:string}){
  const [data,setData]=useState<any>(null);
  const [simulation,setSimulation]=useState<any>(null);
  const [msg,setMsg]=useState('');
  const [busy,setBusy]=useState(false);

  async function load(){
    const r=await fetch('/api/coach/students/'+studentId+'/learning-engine',{cache:'no-store'});
    const j=await r.json();
    if(!r.ok){setMsg(j.error||'Öğrenme zekâsı verileri yüklenemedi.');return}
    setData(j);setMsg('');
  }
  useEffect(()=>{void load()},[studentId]);

  async function simulate(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setMsg('');
    try{
      const fd=new FormData(e.currentTarget);
      const body={
        dailyMinutes:Number(fd.get('dailyMinutes')),
        studyDaysPerWeek:Number(fd.get('studyDaysPerWeek')),
        examsPerWeek:Number(fd.get('examsPerWeek'))
      };
      const r=await fetch('/api/coach/students/'+studentId+'/learning-engine',{
        method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)
      });
      const j=await r.json();
      if(!r.ok){setMsg(j.error||'Simülasyon oluşturulamadı.');return}
      setSimulation(j.simulation);
    }finally{setBusy(false)}
  }

  if(msg&&!data)return <div className="notice error">{msg}</div>;
  if(!data)return <div className="card"><div className="moduleEyebrow">KEKS LEARNING ENGINE</div><h2>Öğrenme zekâsı hazırlanıyor…</h2></div>;

  const c=data.capacity||{};
  const goal=data.goal;
  const mastery=(data.mastery||[]).slice(0,10);
  const subjects=data.subjects||[];
  const impact=(data.impact||[]).slice(0,6);
  const timeline=(data.timeline||[]).slice(-12).reverse();

  return <div className="stack">
    {msg&&<div className="notice error">{msg}</div>}
    <div className="card">
      <div className="moduleHeaderRow">
        <div><div className="moduleEyebrow">KEKS LEARNING ENGINE · ÖLÇ → PLANLA → UYGULAT → KAYDET → TEKRAR → YENİDEN ÖLÇ</div><h2>Öğrencinin gerçek çalışma modeli</h2><p className="muted">Beyan edilen niyetten çok gözlenen davranış kullanılır. Bu göstergeler tanı veya kişilik puanı değildir.</p></div>
        <span className="pill">{c.confidence||'LOW'} veri güveni</span>
      </div>
      <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))'}}>
        <div className="card"><small className="muted">Planlanan süre</small><div className="kpi">{c.plannedMinutes??'—'}</div><span>dk/gün</span></div>
        <div className="card"><small className="muted">Gerçek ortalama</small><div className="kpi">{c.actualAverageMinutes??'—'}</div><span>dk/gün</span></div>
        <div className="card"><small className="muted">Önerilen kapasite</small><div className="kpi">{c.suggestedDailyMinutes??'—'}</div><span>dk/gün</span></div>
        <div className="card"><small className="muted">En verimli zaman</small><strong>{c.bestWindow||'Veri birikiyor'}</strong><p className="muted">{c.bestWindowAccuracy==null?'Performans verisi birikiyor':'Doğruluk %'+c.bestWindowAccuracy+' · '+c.bestWindowQuestions+' soru'}</p></div>
        <div className="card"><small className="muted">Önerilen odak bloğu</small><div className="kpi">{c.recommendedFocusBlockMinutes??'—'}</div><span>dk</span></div>
      </div>
      {c.actualVsPlannedDeltaMinutes!=null&&<div className="notice" style={{marginTop:10}}>
        <strong>Plan–gerçek farkı:</strong> {c.actualVsPlannedDeltaMinutes===0?'Planlanan süre ile gözlenen ortalama eşit.':Math.abs(c.actualVsPlannedDeltaMinutes)+' dk '+(c.actualVsPlannedDeltaMinutes<0?'planın altında':'planın üzerinde')}.
      </div>}
      {c.focusDropAfterMinutes&&<div className="notice" style={{marginTop:10}}>
        <strong>Odak sinyali:</strong> {c.focusDropAfterMinutes} dakikayı aşan eşleşmiş oturumlarda doğruluk yaklaşık {c.focusDropPoints} puan düşüyor
        {c.focusDropBeforeAccuracy!=null&&c.focusDropAfterAccuracy!=null?' (%'+c.focusDropBeforeAccuracy+' → %'+c.focusDropAfterAccuracy+')':''}. Bu gözlemsel bir ilişkidir; nedensellik iddiası değildir.
      </div>}
      {c.lowCompletionDays?.length>0&&<div className="notice" style={{marginTop:10}}><strong>Düşük tamamlama günleri:</strong> {c.lowCompletionDays.map((x:any)=>x.day+' %'+x.completionRate).join(' · ')}</div>}
      <p className="muted" style={{marginTop:10}}>Veri kaynağı: {c.measurementSource==='ACTIVE_TIMER'?'gerçek aktif çalışma zamanlayıcısı + görev sonuçları':'görev/soru kayıtları'} · {c.evidenceDays||0} kanıt günü. Sistem veri yetersizse kesin odak veya saat sonucu üretmez.</p>
    </div>

    {goal&&<div className="card">
      <div className="moduleEyebrow">HEDEFE KALAN MESAFE</div>
      <h2>{goal.target}</h2>
      <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))'}}>
        <div><strong>Mevcut performans</strong><p>{goal.currentPerformance??'—'}</p></div>
        <div><strong>Hedef ölçüt</strong><p>{goal.targetValue??'—'}</p></div>
        <div><strong>Operasyonel fark</strong><p>{goal.gap??'—'}</p></div>
        <div><strong>Açık konu tahmini</strong><p>{goal.estimatedOpenTopics}</p></div>
      </div>
      {goal.highestContributionAreas?.length>0&&<div className="notice"><strong>En yüksek katkı potansiyeli:</strong> {goal.highestContributionAreas.map((x:any)=>x.subject+' · '+x.topic).join(' | ')}</div>}
      <p className="muted">{goal.note}</p>
    </div>}

    <div className="card">
      <div className="moduleEyebrow">BİLGİ HÂKİMİYETİ · NETTEN BAĞIMSIZ</div>
      <h2>Konu bazlı kalıcılık durumu</h2>
      <p className="muted">Durum; yalnız çözülen soru sayısına göre değil, son test, tekrar başarısı, geçen süre ve kanıt miktarı birlikte değerlendirilerek oluşturulur.</p>
      {mastery.length===0?<p className="muted">Henüz tanımlı konu veya yeterli öğrenme kanıtı yok.</p>:<div className="stack">
        {mastery.map((x:any)=><div className="card" key={x.subject+'|'+x.topic} style={{margin:0}}>
          <div className="moduleHeaderRow">
            <div>
              <strong>{x.subject} · {x.topic}</strong>
              <p className="muted" style={{marginBottom:0}}>
                Son test: {x.latestTestAccuracy==null?'veri yok':'%'+x.latestTestAccuracy}
                {' · '}Tekrar: {x.reviewAccuracy==null?'veri yok':'%'+x.reviewAccuracy}
                {' · '}Son kanıt: {x.daysSinceLastEvidence>=999?'yok':x.daysSinceLastEvidence+' gün önce'}
                {' · '}{x.totalQuestions} soru / {x.attempts} oturum
              </p>
            </div>
            <span className="pill">{masteryLabel(x.status)} · {x.score}/100</span>
          </div>
          <div className="row" style={{flexWrap:'wrap',gap:8}}>
            <small className="muted">Veri güveni: {x.confidence}</small>
            {x.scoreBreakdown&&<small className="muted">Güncellik {x.scoreBreakdown.recencyScore}/100 · Kanıt {x.scoreBreakdown.evidenceScore}/100{x.scoreBreakdown.overduePenalty?' · Gecikme cezası -'+x.scoreBreakdown.overduePenalty:''}</small>}
          </div>
          <p style={{marginTop:8,marginBottom:0}}><strong>Durum gerekçesi:</strong> {x.statusReason}</p>
          {x.primaryErrorReasonLabel&&<small className="muted">Baskın yanlış nedeni: {x.primaryErrorReasonLabel}</small>}
        </div>)}
      </div>}
      <div className="notice" style={{marginTop:10}}>Yeni → Öğreniliyor → Pekiştiriliyor → Kalıcı. Son test, tekrar veya zaman sinyali zayıflarsa konu Riskli durumuna dönebilir.</div>
    </div>

    <div className="card">
      <div className="moduleEyebrow">DERS BAZLI ÖĞRENME MODELİ</div>
      <h2>Her ders farklı metrikle izlenir</h2>
      <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))'}}>
        {subjects.map((s:any)=><div className="card" key={s.subject}>
          <div className="moduleHeaderRow">
            <div><strong>{s.subject}</strong><p className="muted">{(s.metrics||[]).join(' · ')}</p></div>
            <span className="pill">{s.family==='MATHEMATICS'?'Matematik':s.family==='TURKISH'?'Türkçe':s.family==='HISTORY'?'Tarih':s.family==='LITERATURE'?'Edebiyat':s.family==='SCIENCE'?'Fen':'Genel'}</span>
          </div>
          <p><strong>Temel sinyal:</strong> {s.primarySignal}</p>
          <p>Doğruluk: {s.accuracy==null?'—':'%'+s.accuracy}{s.avgSeconds?' · '+s.avgSeconds+' sn/soru':''}{s.reviewSuccess==null?'':' · tekrar %'+s.reviewSuccess}</p>

          {s.family==='MATHEMATICS'&&<div className="stack">
            {s.weakestQuestionType&&<small>Zayıf problem tipi: {s.weakestQuestionType.questionType} · doğruluk {s.weakestQuestionType.accuracy==null?'—':'%'+s.weakestQuestionType.accuracy}</small>}
            {s.slowestQuestionType&&<small>En yavaş soru tipi: {s.slowestQuestionType.questionType} · {s.slowestQuestionType.avgSeconds} sn/soru</small>}
          </div>}

          {s.family==='TURKISH'&&s.questionTypeBreakdown?.length>0&&<div className="stack">
            {s.questionTypeBreakdown.slice(0,3).map((x:any)=><small key={x.questionType}>{x.questionType}: {x.accuracy==null?'—':'%'+x.accuracy}{x.avgSeconds?' · '+x.avgSeconds+' sn/soru':''}</small>)}
          </div>}

          {s.family==='HISTORY'&&<div className="stack">
            <small>Aktif hatırlama: {s.activeRecall?.sessions||0} oturum · {s.activeRecall?.minutes||0} dk</small>
            <small>Tekrar başarısı: {s.reviewSuccess==null?'Veri yok':'%'+s.reviewSuccess}</small>
          </div>}

          {s.family==='LITERATURE'&&s.literatureConnections?.length>0&&<div className="stack">
            {s.literatureConnections.map((x:any)=><small key={x.dimension}>{x.dimension}: {x.evidence} soru · {x.accuracy==null?'veri yetersiz':'%'+x.accuracy}</small>)}
          </div>}

          {s.family==='SCIENCE'&&<div className="stack">
            {s.weakestTopic&&<small>Zayıf konu: {s.weakestTopic.topic} · doğruluk {s.weakestTopic.accuracy==null?'—':'%'+s.weakestTopic.accuracy}</small>}
            {s.misconceptionCandidates?.slice(0,2).map((x:any)=><small key={x.topic}>Kavram yanılgısı adayı: {x.topic} · %{x.accuracy}</small>)}
          </div>}

          {s.errorAnalytics?.totalWrong>0&&<div className="stack" style={{marginTop:8}}>
            <div className="notice"><strong>Yanlış nedeni motoru:</strong> {s.wrongReasonSignal}</div>
            {s.errorReasons?.slice(0,4).map((x:any)=><div className="row" key={x.key} style={{justifyContent:'space-between',gap:8}}>
              <span>{x.label}</span><strong>%{x.percent} · {x.count} yanlış</strong>
            </div>)}
            <small className="muted">Sınıflandırma kapsamı: %{s.errorAnalytics.coveragePercent} · {s.errorAnalytics.classifiedWrong}/{s.errorAnalytics.totalWrong} yanlış sınıflandırıldı{s.errorAnalytics.unclassifiedWrong?' · '+s.errorAnalytics.unclassifiedWrong+' sınıflandırılmamış yanlış':''}.</small>
          </div>}
          <div className="notice" style={{marginTop:10}}><strong>Önerilen koç aksiyonu:</strong> {s.recommendedAction}</div>
        </div>)}
      </div>
    </div>

    {data.examReport&&<div className="card">
      <div className="moduleEyebrow">DENEME ANALİZİ & 7 GÜNLÜK MÜDAHALE</div>
      <h2>{data.examReport.examType}</h2>
      <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))'}}>
        <div><strong>Toplam değişim</strong><p>{data.examReport.overall?.delta==null?'—':(data.examReport.overall.delta>=0?'+':'')+data.examReport.overall.delta}</p></div>
        <div><strong>En fazla net kazandıran</strong><p>{data.examReport.biggestGain?data.examReport.biggestGain.subject+' +'+data.examReport.biggestGain.delta:'—'}</p></div>
        <div><strong>En fazla kayıp</strong><p>{data.examReport.biggestLoss?data.examReport.biggestLoss.subject+' '+data.examReport.biggestLoss.delta:'—'}</p></div>
      </div>
      <p className="muted">{data.examReport.timeSignal?.message}</p>
      {data.examReport.sevenDayPlan?.length>0&&<div className="stack">{data.examReport.sevenDayPlan.map((x:any,i:number)=><div className="row" key={i}><strong>Gün {x.day}</strong><span>{x.subject}{x.topic?' · '+x.topic:''} — {x.task}</span></div>)}</div>}
      <p className="muted">{data.examReport.note}</p>
    </div>}

    <div className="card">
      <div className="moduleEyebrow">KOÇ KARARLARININ ETKİSİ</div>
      <h2>Müdahale sonrası gözlemsel değişim</h2>
      <p className="muted">Bu bölüm nedensellik iddiası kurmaz; müdahale öncesi ve sonrası veriyi karşılaştırarak koça karar desteği verir.</p>
      {impact.length===0?<p className="muted">Karşılaştırma için müdahale öncesi/sonrası yeterli soru verisi yok.</p>:<div className="stack">
        {impact.map((x:any)=><div className="card" key={x.actionId} style={{margin:0}}>
          <strong>{x.title}</strong><div className="muted">{x.subject}{x.topic?' · '+x.topic:''}</div>
          <p>Doğruluk: {x.before.accuracy==null?'—':'%'+x.before.accuracy} → {x.after.accuracy==null?'—':'%'+x.after.accuracy} {x.accuracyDelta==null?'':'('+((x.accuracyDelta>=0?'+':'')+x.accuracyDelta)+' puan)'}</p>
          <small className="muted">{x.interpretation}</small>
        </div>)}
      </div>}
    </div>

    {data.alignment&&<div className="card">
      <div className="moduleEyebrow">ÖĞRENCİ–KOÇ ÇALIŞMA UYUMU · PUAN YOK, SOMUT SİNYAL VAR</div>
      <h2>Önerilerin uygulanma ve görüşme devamlılığı</h2>
      <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))'}}>
        <div><strong>Görev uygulama</strong><p>{data.alignment.followThrough==null?'—':'%'+data.alignment.followThrough}</p></div>
        <div><strong>Yeniden planlanan görev</strong><p>{data.alignment.rescheduledTasks}</p></div>
        <div><strong>Görüşme devamlılığı</strong><p>{data.alignment.sessionContinuity==null?'—':'%'+data.alignment.sessionContinuity}</p></div>
      </div>
      {(data.alignment.signals||[]).map((x:string,i:number)=><div className="notice" key={i}>{x}</div>)}
    </div>}

    {data.examMap?.length>0&&<details className="card">
      <summary><strong>ÖSYM / MEB sınav haritası · ders → konu → soru tipi</strong></summary>
      <div className="stack" style={{marginTop:12}}>
        {data.examMap.map((exam:any)=><div key={exam.examType}>
          <h3>{exam.examType}</h3>
          {exam.subjects.map((subject:any)=><div key={subject.subject} style={{marginBottom:10}}>
            <strong>{subject.subject}</strong>
            <div className="muted">{subject.topics.slice(0,12).map((t:any)=>t.topic+(t.accuracy==null?'':' %'+t.accuracy)+(t.questionTypes?.length?' ['+t.questionTypes.join(', ')+']':'')).join(' · ')}</div>
          </div>)}
        </div>)}
      </div>
    </details>}

    <div className="card">
      <div className="moduleEyebrow">PLAN SİMÜLATÖRÜ</div>
      <h2>Koç için senaryo denemesi</h2>
      <p className="muted">Simülasyon mevcut programı değiştirmez. Farklı çalışma kapasitesinin hangi konulara ne kadar zaman bırakacağını gösterir.</p>
      <form className="row" onSubmit={simulate} style={{alignItems:'end',flexWrap:'wrap'}}>
        <label className="field"><span>Günlük dakika</span><input name="dailyMinutes" type="number" min="30" max="480" defaultValue={c.suggestedDailyMinutes||120}/></label>
        <label className="field"><span>Haftalık gün</span><input name="studyDaysPerWeek" type="number" min="1" max="7" defaultValue="6"/></label>
        <label className="field"><span>Haftalık deneme</span><input name="examsPerWeek" type="number" min="0" max="4" defaultValue="1"/></label>
        <button className="btn primary" disabled={busy}>{busy?'Hesaplanıyor…':'Senaryoyu Hesapla'}</button>
      </form>
      {simulation&&<div style={{marginTop:12}}>
        <div className="notice"><strong>Haftalık kullanılabilir süre:</strong> {simulation.weeklyAvailableMinutes} dk · Deneme rezervi: {simulation.examReserveMinutes} dk</div>
        <div className="stack">{simulation.scenario?.slice(0,8).map((x:any)=><div className="row" key={x.subject+'|'+x.topic} style={{justifyContent:'space-between'}}>
          <span>{x.subject} · {x.topic}</span><span>{x.suggestedMinutes} dk · {masteryLabel(x.status)}</span>
        </div>)}</div>
      </div>}
    </div>

    <details className="card">
      <summary><strong>Öğrenci gelişim zaman çizelgesi</strong></summary>
      <div className="stack" style={{marginTop:12}}>
        {timeline.map((x:any,i:number)=><div key={i}><strong>{new Date(x.at).toLocaleDateString('tr-TR')}</strong> · {x.title}</div>)}
      </div>
    </details>
  </div>;
}
