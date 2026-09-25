'use client';

import { FormEvent,useEffect,useRef,useState } from 'react';

const reasonLabel:Record<string,string>={
  BILGI_EKSIKLIGI:'Bilgi eksikliği',
  DIKKAT:'Dikkat',
  ISLEM_HATASI:'İşlem hatası',
  SORU_KOKU:'Soru kökünü yanlış okuma',
  YONTEM_BILMEME:'Yöntem bilmeme',
  UNUTMA:'Unutma',
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
  const system=data.systemStatus||{};
  const monthly=data.monthlyDevelopment||{};
  const currentMonth=monthly.current||{};
  const previousMonth=monthly.previous||{};
  return <div className="stack studentCommandCenter">
    {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')}>{msg}</div>}
    {busy==='rebalance'&&<div className="notice">Kaçırılan görevleriniz dengeleniyor…</div>}

    <div className="studentTodayHero" aria-label="Bugünkü çalışma özeti">
      <div className="card todayMissionCard"><div className="moduleEyebrow">BUGÜN NE YAPACAĞIM?</div><h2>{t.totalTasks-t.completedTasks} görev kaldı</h2><p>{t.targetQuestions} hedef soru</p><a className="btn primary" href="#gunluk-gorevler">Günlük görevleri aç</a></div>
      <div className="card"><div className="moduleEyebrow">KAÇINI TAMAMLADIM?</div><h2>{t.completedTasks} / {t.totalTasks}</h2><div className="goldProgress"><i style={{width:(t.totalTasks?Math.round(t.completedTasks/t.totalTasks*100):0)+'%'}}/></div></div>
      <div className="card"><div className="moduleEyebrow">SIRADA HANGİ TEKRAR VAR?</div><h2>{t.dueReviews ? t.dueReviews+' tekrar bekliyor' : 'Bugün tekrar yok'}</h2><a className="btn" href="#yanlis-soru-bankasi">Tekrar kuyruğunu aç</a></div>
    </div>

    <details className="card"><summary>Diğer alanlar ve gelişim ayrıntıları</summary><div className="studentSystemJourney">
      <a href="#keks-egilim-taramasi" className="studentSystemTile">
        <span>01</span><div><small>EĞİTSEL PROFİL</small><strong>Profil & Ön Görüşme</strong><p>{system.screening?(system.preInterview?'Tarama ve ön görüşme verisi mevcut':'Tarama tamamlandı · ön görüşme bekleniyor'):'Eğilim taraması bekleniyor'}</p></div>
      </a>
      <a href="#programlar" className="studentSystemTile">
        <span>02</span><div><small>KİŞİSEL PLAN</small><strong>Akıllı Çalışma Planı</strong><p>{system.activePlans?system.activePlans+' aktif plan':'Yönetici/koç onaylı plan bekleniyor'}</p></div>
      </a>
      <a href="#akademik-performans" className="studentSystemTile">
        <span>03</span><div><small>PERFORMANS</small><strong>Akademik Merkez</strong><p>Doğruluk %{currentMonth.questionPerformance||0} · {currentMonth.questionCount||0} soru</p></div>
      </a>
      <a href="#ogrenme-tekrar" className="studentSystemTile">
        <span>04</span><div><small>ÖĞRENME</small><strong>Tekrar & Teknikler</strong><p>{system.dueReviews||0} tekrar bekliyor · odak {currentMonth.focusMinutes||0} dk</p></div>
      </a>
      <a href="#akilli-koc" className="studentSystemTile">
        <span>05</span><div><small>KOÇLUK</small><strong>Koçla Çalışma</strong><p>{system.nextSession?'Görüşme planlı':'Yeni görüşme planı bekleniyor'}</p></div>
      </a>
      <a href="#aylik-gelisim" className="studentSystemTile">
        <span>06</span><div><small>AYLIK GELİŞİM</small><strong>Gelişim & Değerlendirme</strong><p>Süreklilik %{currentMonth.continuity||0} · görev %{currentMonth.taskCompletion||0}</p></div>
      </a>
    </div></details>

    <details className="card"><summary>Hedef ve görüşme ayrıntıları</summary><div className="studentTodayHero">
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
    </div></details>

    <details className="card"><summary>Gelişim, eksik haritası ve haftalık değerlendirme</summary><div className="stack"><div className="studentInsightGrid">
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

    <div id="aylik-gelisim" className="card studentMonthlyDevelopment">
      <div className="moduleHeaderRow">
        <div><div className="moduleEyebrow">AYLIK GELİŞİM VE DEĞERLENDİRME</div><h2>Bu ay hangi çalışma davranışlarım değişti?</h2><p className="muted">Göstergeler görev, soru, tekrar, deneme ve gerçek odak kayıtlarından oluşur. Eğilim profiliyle aynı şey değildir.</p></div>
        <span className="pill">{currentMonth.taskCount||0} görev kaydı</span>
      </div>
      <div className="studentMonthlyAxes">
        <MonthAxis label="Çalışma Sürekliliği" current={currentMonth.continuity||0} previous={previousMonth.continuity||0} suffix="%"/>
        <MonthAxis label="Görev Tamamlama" current={currentMonth.taskCompletion||0} previous={previousMonth.taskCompletion||0} suffix="%"/>
        <MonthAxis label="Soru Performansı" current={currentMonth.questionPerformance||0} previous={previousMonth.questionPerformance||0} suffix="%"/>
        <MonthAxis label="Tekrar Disiplini" current={currentMonth.reviewDiscipline||0} previous={previousMonth.reviewDiscipline||0} suffix="%"/>
        <MonthAxis label="Odak Süresi" current={currentMonth.focusMinutes||0} previous={previousMonth.focusMinutes||0} suffix=" dk" normalize={Math.max(240,currentMonth.focusMinutes||0,previousMonth.focusMinutes||0)}/>
        <div className="monthlyAxisCard">
          <div className="monthlyAxisHead"><strong>Deneme Gelişimi</strong><span>{monthly.examDelta==null?'Veri bekleniyor':(monthly.examDelta>0?'+':'')+monthly.examDelta+' '+(monthly.examUnit||'net')}</span></div>
          <p className="muted">{currentMonth.examValue==null?'Bu ay karşılaştırılabilir deneme kaydı yok.':'Bu ay '+currentMonth.examValue+' '+(currentMonth.examUnit||'net')+(previousMonth.examValue!=null?' · Önceki ay '+previousMonth.examValue:'')}</p>
        </div>
      </div>
      <div className="notice" style={{marginTop:14}}>{monthly.note||'Bu alan çalışma davranışlarındaki operasyonel değişimi gösterir.'}</div>
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
    </div></div></details>
  </div>;
}

function MonthAxis({label,current,previous,suffix='',normalize=100}:{label:string;current:number;previous:number;suffix?:string;normalize?:number}){
  const delta=Number((current-previous).toFixed(1));
  const pct=Math.max(0,Math.min(100,normalize?current/normalize*100:current));
  return <div className="monthlyAxisCard">
    <div className="monthlyAxisHead"><strong>{label}</strong><span className={delta<0?'riskText':''}>{Math.round(current)}{suffix} · {delta===0?'aynı':(delta>0?'+':'')+delta+suffix}</span></div>
    <div className="goldProgress"><i style={{width:pct+'%'}}/></div>
    <small className="muted">Önceki ay: {Math.round(previous)}{suffix}</small>
  </div>;
}

function Axis({label,value,suffix='',display}:{label:string;value:number;suffix?:string;display?:string}){
  const v=Math.max(0,Math.min(100,value));
  return <div className="studentAxis"><div><strong>{label}</strong><span>{display??Math.round(v)+suffix}</span></div><div className="goldProgress"><i style={{width:v+'%'}}/></div></div>;
}
