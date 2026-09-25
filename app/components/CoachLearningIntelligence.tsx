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
        <div className="card"><small className="muted">En verimli zaman</small><strong>{c.bestWindow||'Veri birikiyor'}</strong><p className="muted">{c.evidenceDays||0} kanıt günü</p></div>
      </div>
      {c.lowCompletionDays?.length>0&&<div className="notice" style={{marginTop:10}}><strong>Düşük tamamlama günleri:</strong> {c.lowCompletionDays.map((x:any)=>x.day+' %'+x.completionRate).join(' · ')}</div>}
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
      <div className="moduleEyebrow">BİLGİ HÂKİMİYETİ</div>
      <h2>Konu durumu</h2>
      {mastery.length===0?<p className="muted">Hâkimiyet durumu için yeterli soru/tekrar kaydı yok.</p>:<div className="stack">
        {mastery.map((x:any)=><div className="row" key={x.subject+'|'+x.topic} style={{justifyContent:'space-between',alignItems:'center'}}>
          <div><strong>{x.subject} · {x.topic}</strong><div className="muted">{x.totalQuestions} soru · doğruluk %{x.accuracy}{x.primaryErrorReasonLabel?' · '+x.primaryErrorReasonLabel:''}</div></div>
          <span className="pill">{masteryLabel(x.status)} · {x.score}/100</span>
        </div>)}
      </div>}
    </div>

    <div className="card">
      <div className="moduleEyebrow">DERS BAZLI ÖĞRENME MODELİ</div>
      <h2>Her ders farklı metrikle izlenir</h2>
      <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))'}}>
        {subjects.map((s:any)=><div className="card" key={s.subject}>
          <strong>{s.subject}</strong>
          <p className="muted">{(s.metrics||[]).join(' · ')}</p>
          <p>Doğruluk: {s.accuracy==null?'—':'%'+s.accuracy}{s.avgSeconds?' · '+s.avgSeconds+' sn/soru':''}{s.reviewSuccess==null?'':' · tekrar %'+s.reviewSuccess}</p>
          {s.errorReasons?.[0]&&<small>Baskın yanlış nedeni: {s.errorReasons[0].label} ({s.errorReasons[0].count})</small>}
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
