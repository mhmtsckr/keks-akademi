'use client';

import {useState} from 'react';

type Props={studentId:string;onActivated?:()=>void};
function dateLabel(value:string){
  return new Date(value).toLocaleDateString('tr-TR',{
    timeZone:'Europe/Istanbul',weekday:'short',day:'numeric',month:'short'
  });
}
function delta(value:number|null,unit:string){
  return value==null?'Karşılaştırma yok':(value>0?'+':'')+value+' '+unit;
}
export function CoachWeeklyPlanApproval({studentId,onActivated}:Props){
  const [preview,setPreview]=useState<any>(null);
  const [approved,setApproved]=useState(false);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [activatedId,setActivatedId]=useState('');

  async function showPreview(){
    if(busy)return;
    setBusy(true);setApproved(false);setMessage('');setPreview(null);setActivatedId('');
    try{
      const response=await fetch('/api/coach/students/'+studentId+'/smart-plan',{
        cache:'no-store'
      });
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||'Önizleme alınamadı.');
      setPreview(data);
    }catch(e){
      setMessage('Hata: '+(e instanceof Error?e.message:'Plan önizlemesi açılamadı.'));
    }finally{setBusy(false);}
  }
  async function activate(){
    if(busy||!approved||!preview?.previewDigest)return;
    setBusy(true);setMessage('');
    try{
      const response=await fetch('/api/coach/students/'+studentId+'/smart-plan',{
        method:'POST',headers:{'content-type':'application/json'},
        body:JSON.stringify({
          action:'ACTIVATE',confirm:true,previewDigest:preview.previewDigest
        })
      });
      const result=await response.json();
      if(!response.ok){
        if(response.status===409){setPreview(null);setApproved(false);}
        throw new Error(result.error||'Plan etkinleştirilemedi.');
      }
      setActivatedId(result.planId);
      setPreview(null);setApproved(false);
      setMessage('Koç onayı kaydedildi. Yeni haftalık plan etkinleştirildi; eski planlar geçmiş kayıtlarında korundu.');
      onActivated?.();
    }catch(e){
      setMessage('Hata: '+(e instanceof Error?e.message:'Plan onaylanamadı.'));
    }finally{setBusy(false);}
  }
  const comparison=preview?.comparison;
  const proposal=preview?.proposal;
  return <section className="card">
    <div className="moduleHeaderRow">
      <div>
        <div className="moduleEyebrow">AKILLI KİŞİSEL ÇALIŞMA PLANI · KOÇ ONAYI</div>
        <h2>Önizle · Karşılaştır · Açık onayla etkinleştir</h2>
        <p className="muted">Önceki etkin planı koruyarak yeni yedi günlük öneriyi karşılaştır. Önizleme hiçbir kayıt değiştirmez.</p>
      </div>
      <button className="btn primary" type="button" onClick={()=>void showPreview()} disabled={busy}>
        {busy?'İşlem sürüyor…':'Yeni Haftalık Planı Önizle'}
      </button>
    </div>
    {message&&<p role="status" className="notice">{message}</p>}
    {activatedId&&<p className="muted">Etkinleştirilen plan kaydı: {activatedId}</p>}
    {comparison&&proposal&&<>
      <p className="muted"><strong>Mevcut etkin plan:</strong> {preview.currentPlan?.title||'Bulunmuyor'}
        {' · '}<strong>Güncel öneri:</strong> {comparison.proposed.days} gün
        {preview.currentActiveCount>1?' · '+preview.currentActiveCount+' eski etkin kayıt birden bulundu. Onay bunları geçmişe alacak.':''}
      </p>
      <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))'}}>
        <div className="notice">
          <strong>Mevcut plan</strong>
          <p>{comparison.previous?comparison.previous.minutes+' dakika / '+comparison.previous.days+' gün':'Karşılaştırılabilir plan yok'}</p>
          {comparison.previous&&<small className="muted">
            {comparison.previous.coachTasks} koç görevi · {comparison.previous.reviewQuestions} tekrar sorusu
          </small>}
        </div>
        <div className="notice">
          <strong>Önerilen yeni plan</strong>
          <p>{comparison.proposed.minutes} dakika / {comparison.proposed.days} gün</p>
          <small className="muted">
            {comparison.proposed.coachTasks} koç görevi · {comparison.proposed.reviewQuestions} tekrar sorusu
          </small>
        </div>
        <div className="notice">
          <strong>İki planın farkı</strong>
          <p>{delta(comparison.deltaMinutes,'dk')}</p>
          <small className="muted">
            Görev: {delta(comparison.deltaCoachTasks,'adet')}
            {' · '}Tekrar: {delta(comparison.deltaReviewQuestions,'soru')}
          </small>
        </div>
      </div>
      <p className="muted">{comparison.warning}</p>
      {proposal.prioritySummary?.coachTasksNeedingDecision?.length>0&&<div className="notice">
        <strong>Önemli: {proposal.prioritySummary.coachTasksNeedingDecision.length} koç görevi yeni kapasiteye sığmadı.</strong>
        <p className="muted">Bu görevlerin tarihleri değiştirilmez. Etkinleştirme öncesinde koçun ayrıca iş yükünü değerlendirmesi gerekir.</p>
        {proposal.prioritySummary.coachTasksNeedingDecision.slice(0,4).map((t:any)=>
          <p key={t.id}>{t.title} · {t.minutes} dk</p>)}
      </div>}
      {proposal.prioritySummary?.pendingReviewCount>0&&<p className="muted">
        Yeni önerinin kapasitesine sığmayan tekrar sayısı: {proposal.prioritySummary.pendingReviewCount}. Bu tekrarlar kuyruktan silinmez.
      </p>}
      <div className="stack">
        <h3>Günlük karşılaştırma</h3>
        {comparison.proposed.daily.map((day:any,index:number)=>{
          const old=comparison.previous?.daily?.[index];
          const proposedTasks=proposal.days?.[index]?.tasks||[];
          return <div className="notice" key={day.date}>
            <strong>{dateLabel(day.date)}</strong>
            <p className="muted">Yeni: {day.minutes}/{day.capacityMinutes} dk
              {' · '}Önceki {old?dateLabel(old.date)+' ('+old.minutes+' dk)':'—'}
            </p>
            {proposedTasks.slice(0,5).map((t:any,i:number)=>
              <p key={t.actionId||t.reviewIds?.join('|')||i}>
                {t.title} <small className="muted">· {t.duration} dk</small>
              </p>)}
            {proposedTasks.length>5&&<small className="muted">+{proposedTasks.length-5} ek çalışma bloğu</small>}
          </div>;
        })}
      </div>
      <details>
        <summary>Çıkarılan ve eklenen görevleri göster</summary>
        <strong>Yeni taslakta yer alanlar</strong>
        {comparison.addedTasks?.length
          ?comparison.addedTasks.map((x:string,i:number)=><p key={'a'+i}>+ {x}</p>)
          :<p className="muted">Yeni görev adı yok.</p>}
        <strong>Önceki taslakta kalanlar</strong>
        {comparison.removedTasks?.length
          ?comparison.removedTasks.map((x:string,i:number)=><p key={'r'+i}>− {x}</p>)
          :<p className="muted">Kaldırılan görev adı yok.</p>}
      </details>
      <div className="notice">
        <label style={{display:'flex',alignItems:'flex-start',gap:9}}>
          <input type="checkbox" checked={approved}
            onChange={e=>setApproved(e.target.checked)} disabled={busy}/>
          <span><strong>Karşılaştırmayı inceledim ve onaylıyorum.</strong>
            {' '}Eski etkin planın geçmişe alınmasını ve bu yeni haftalık programın öğrencinin etkin planı olmasını kabul ediyorum.
            Koç görevlerinin ve tekrarlarının bağımsız teslim tarihleri bu işlemle değişmeyecektir.
          </span>
        </label>
        <button className="btn primary" type="button" onClick={()=>void activate()}
          disabled={busy||!approved}>
          {busy?'Doğrulanıyor…':'Açık Onayla Yeni Planı Etkinleştir'}
        </button>
        <small className="muted">Onaydan önce sunucu planı yeniden hesaplar. Veri veya aktif plan değişmişse işlem reddedilir; yeni önizleme gerekir.</small>
      </div>
    </>}
  </section>;
}
