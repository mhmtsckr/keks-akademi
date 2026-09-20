'use client';

import { FormEvent,useEffect,useRef,useState } from 'react';

const reasonLabel:Record<string,string>={
  BILGI_EKSIKLIGI:'Bilgi eksikliği',
  DIKKAT:'Dikkat',
  ISLEM_HATASI:'İşlem hatası',
  SURE:'Süre',
  SORUYU_ANLAMA:'Soruyu anlama',
  STRATEJI:'Strateji',
  DIGER:'Diğer'
};

function goalText(goal:any){
  if(!goal)return 'Koçunuz henüz hedef tanımlamadı.';
  if(goal.difference==null)return 'Hedef tanımlı; karşılaştırma için güncel sınav puanı gerekli.';
  if(goal.difference>0)return goal.targetLabel+' hedefinize '+goal.difference+' puan kaldı.';
  return goal.targetLabel+' hedef seviyesinin '+Math.abs(goal.difference)+' puan üzerindesiniz.';
}

export function StudentCommandCenter(){
  const [data,setData]=useState<any>(null);
  const [msg,setMsg]=useState('');
  const [busy,setBusy]=useState('');
  const rebalanced=useRef(false);

  async function load(){
    const r=await fetch('/api/student/command-center');
    const j=await r.json();
    if(r.ok)setData(j);
    return j;
  }

  useEffect(()=>{
    (async()=>{
      const j=await load();
      if(j?.ok&&j.missedEligibleCount>0&&!rebalanced.current){
        rebalanced.current=true;
        setBusy('rebalance');
        const r=await fetch('/api/student/command-center',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'rebalance'})});
        const x=await r.json();setBusy('');
        if(r.ok){
          setData(x);
          if(x.moved?.length)setMsg(x.moved.length+' kaçırılan görev kalan yük korunarak ileri günlere otomatik dağıtıldı.');
        }
      }
    })();
  },[]);

  async function reflection(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy('reflection');setMsg('');
    const fd=new FormData(e.currentTarget);
    const body={
      action:'reflection',
      selfRating:Number(fd.get('selfRating')),
      bestThing:String(fd.get('bestThing')||''),
      biggestChallenge:String(fd.get('biggestChallenge')||''),
      repeatedDelay:String(fd.get('repeatedDelay')||''),
      nextWeekChange:String(fd.get('nextWeekChange')||'')
    };
    const r=await fetch('/api/student/command-center',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json();setBusy('');
    if(!r.ok)return setMsg('Hata: '+(j.error||'Değerlendirme kaydedilemedi.'));
    setMsg('Haftalık değerlendirmeniz kaydedildi ve koçunuza iletildi. '+j.comparison.label);
    await load();
  }

  if(!data)return <div className="card"><p className="muted">Bugünkü çalışma merkezi hazırlanıyor…</p></div>;

  const t=data.today;
  const axes=data.progressAxes||{};
  return <div className="stack studentCommandCenter">
    {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')}>{msg}</div>}
    {busy==='rebalance'&&<div className="notice">Kaçırılan görevleriniz dengeleniyor…</div>}

    <div className="studentTodayHero">
      <div className="card todayMissionCard">
        <div className="moduleHeaderRow">
          <div><div className="moduleEyebrow">BUGÜN NE YAPACAĞIM?</div><h2>{t.completedTasks}/{t.totalTasks} görev tamamlandı</h2></div>
          <span className="moduleIcon">✓</span>
        </div>
        <div className="todayMissionStats">
          <div><b>{t.targetQuestions}</b><span>hedef soru</span></div>
          <div><b>{t.dueReviews}</b><span>tekrar bekliyor</span></div>
          <div><b>{t.totalTasks-t.completedTasks}</b><span>görev kaldı</span></div>
        </div>
        <div className="goldProgress"><i style={{width:(t.totalTasks?Math.round(t.completedTasks/t.totalTasks*100):0)+'%'}}/></div>
        <div className="row" style={{marginTop:12}}>
          <a className="btn primary" href="#gunluk-gorevler">Şimdi Başla</a>
          {t.dueReviews>0&&<a className="btn" href="#akilli-koc">Tekrarları Aç</a>}
        </div>
      </div>

      <div className="card studentGoalGapCard">
        <div className="moduleEyebrow">HEDEF FARKI</div>
        <h2>{data.goal?.institutionName||'Hedef bekleniyor'}</h2>
        {data.goal?.departmentName&&<p className="muted">{data.goal.departmentName}</p>}
        <div className="goalGapValue">{data.goal?.difference==null?'—':(data.goal.difference>0?data.goal.difference+' puan kaldı':Math.abs(data.goal.difference)+' puan üzerinde')}</div>
        <p>{goalText(data.goal)}</p>
        {data.goal?.appointmentCount!=null&&<div className="targetMicroMeta">Resmî kontenjan: {data.goal.appointmentCount}{data.goal.officialScoreType?' · '+data.goal.officialScoreType:''}</div>}
        <small className="muted">Bu gösterge hedef farkıdır; kabul/atanma olasılığı değildir.</small>
      </div>

      <div className="card nextCoachSessionCard">
        <div className="moduleEyebrow">SONRAKİ KOÇLUK GÖRÜŞMESİ</div>
        {t.nextSession?<><h2>{new Date(t.nextSession.startsAt).toLocaleDateString('tr-TR',{day:'2-digit',month:'long'})}</h2><p>{new Date(t.nextSession.startsAt).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})} · {t.nextSession.title}</p>{t.nextSession.meetingUrl&&<a className="btn" href={t.nextSession.meetingUrl} target="_blank">Görüşmeye Katıl</a>}</>:<><h2>Planlı seans yok</h2><p className="muted">Yeni seans planlandığında burada görünecek.</p></>}
      </div>
    </div>

    <div className="studentInsightGrid">
      <div className="card">
        <div className="moduleEyebrow">GERÇEK İLERLEMEM</div><h2>Dört gelişim ekseni</h2>
        <div className="studentAxisList">
          <Axis label="Görev devamlılığı" value={axes.continuity||0} suffix="%"/>
          <Axis label="Soru doğruluğu" value={axes.accuracy||0} suffix="%"/>
          <Axis label="Tekrar disiplini" value={axes.reviewDiscipline||0} suffix="%"/>
          <Axis label="Son 7 gün odak" value={Math.min(100,Math.round((axes.focusMinutes||0)/4))} display={(axes.focusMinutes||0)+' dk'}/>
        </div>
      </div>

      <div className="card">
        <div className="moduleEyebrow">EKSİK HARİTASI</div><h2>Önce buraya çalış</h2>
        {!data.weaknessMap?.length?<p className="muted">Eksik haritası için soru çözüm verisi gerekli.</p>:<div className="studentWeakList">{data.weaknessMap.slice(0,5).map((x:any)=><div className="studentWeakRow" key={x.subject+x.topic}>
          <div><strong>{x.subject}</strong><span>{x.topic}</span>{x.primaryReason&&<small>En sık neden: {reasonLabel[x.primaryReason]||x.primaryReason}</small>}</div>
          <div className="weaknessBar"><i style={{width:x.accuracy+'%'}}/></div>
          <b className={x.accuracy<60?'riskText':''}>%{x.accuracy}</b>
        </div>)}</div>}
      </div>
    </div>

    <div className="card weeklyReflectionCard">
      <div className="moduleHeaderRow"><div><div className="moduleEyebrow">HAFTALIK ÖZ DEĞERLENDİRME</div><h2>Bu hafta gerçekten nasıldım?</h2><p className="muted">Cevabınız görev, doğruluk ve gerçek odak verileriyle karşılaştırılır ve koçunuza iletilir.</p></div>{data.latestReflection&&<span className="pill">Son kayıt mevcut</span>}</div>
      <form className="weeklyReflectionForm" onSubmit={reflection}>
        <div className="field"><label>Bu haftaki çalışma performansımı nasıl değerlendiriyorum?</label><select name="selfRating" required defaultValue=""><option value="">Seçiniz</option><option value="1">1 · Çok zayıf</option><option value="2">2 · Zayıf</option><option value="3">3 · Orta</option><option value="4">4 · İyi</option><option value="5">5 · Çok iyi</option></select></div>
        <div className="reflectionGrid">
          <div className="field"><label>En iyi giden neydi?</label><textarea name="bestThing" rows={2}/></div>
          <div className="field"><label>En çok ne zorladı?</label><textarea name="biggestChallenge" rows={2}/></div>
          <div className="field"><label>Hangi işi sürekli erteledim?</label><textarea name="repeatedDelay" rows={2}/></div>
          <div className="field"><label>Gelecek hafta neyi değiştireceğim?</label><textarea name="nextWeekChange" rows={2}/></div>
        </div>
        <button className="btn primary" disabled={busy==='reflection'}>{busy==='reflection'?'Kaydediliyor…':'Haftayı Değerlendir ve Koçuma Gönder'}</button>
      </form>
    </div>
  </div>;
}

function Axis({label,value,suffix='',display}:{label:string;value:number;suffix?:string;display?:string}){
  const v=Math.max(0,Math.min(100,value));
  return <div className="studentAxis"><div><strong>{label}</strong><span>{display??Math.round(v)+suffix}</span></div><div className="goldProgress"><i style={{width:v+'%'}}/></div></div>;
}
