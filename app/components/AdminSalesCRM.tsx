'use client';

import {useEffect,useMemo,useState} from 'react';
import {ALL_PLANS} from '@/lib/subscriptionPlans';
const SALES_LEAD_STATUSES=['NEW','CALLED','SPOKEN','PACKAGE_RECOMMENDED','WON','LOST'] as const;
type SalesLeadStatus=(typeof SALES_LEAD_STATUSES)[number];
const SALES_LEAD_STATUS_LABELS:Record<SalesLeadStatus,string>={
  NEW:'Yeni',
  CALLED:'Arandı',
  SPOKEN:'Görüşüldü',
  PACKAGE_RECOMMENDED:'Paket Önerildi',
  WON:'Kazanıldı',
  LOST:'Kaybedildi'
};

const TERM_LABELS:Record<string,string>={
  monthly:'Aylık Esnek Başlangıç',
  threeMonths:'3 Aylık KEKS Kamp',
  sixMonths:'6 Aylık Güçlenme',
  annual:'Yıllık KEKS 360'
};

function planLabel(id?:string|null){
  if(!id)return '—';
  return ALL_PLANS.find(x=>x.id===id)?.name||id;
}

function dt(value?:string|null){
  if(!value)return '—';
  return new Date(value).toLocaleString('tr-TR');
}

function pct(v?:number|null){return v==null?'—':'%'+v;}
const LIFECYCLE_LABELS:Record<string,string>={
  LEAD:'Lead',CONTACT:'Görüşme',PACKAGE:'Paket önerildi',
  UNVERIFIED_SALE:'Satış bildirimi · ödeme doğrulanmadı',
  LOST_SALE:'Satış kaybedildi',PURCHASED:'Satın aldı',
  FIRST_30_DAYS:'30 günlük kullanım',ACTIVE:'30 gün sonrası aktif',
  RENEWAL_DUE:'Yenileme takibi',RENEWED:'Yeniledi',CHURNED:'Ayrıldı'
};
function money(kurus?:number|null){
  if(kurus==null)return '—';
  return new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(kurus/100);
}

type Lead=any;
type Summary=any;

export function AdminSalesCRM(){
  const [leads,setLeads]=useState<Lead[]>([]);
  const [summary,setSummary]=useState<Summary|null>(null);
  const [status,setStatus]=useState('ALL');
  const [source,setSource]=useState('ALL');
  const [q,setQ]=useState('');
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState('');

  async function load(){
    setLoading(true);
    try{
      const p=new URLSearchParams();
      if(status!=='ALL')p.set('status',status);
      if(source!=='ALL')p.set('source',source);
      if(q.trim())p.set('q',q.trim());
      const r=await fetch('/api/admin/sales-leads?'+p.toString());
      const j=await r.json();
      if(!r.ok){setMessage('Hata: '+(j.error||'CRM verileri alınamadı.'));return}
      setLeads(j.leads||[]);
      setSummary(j.summary||null);
    }finally{setLoading(false)}
  }

  useEffect(()=>{load()},[status,source]);

  const statusMap=useMemo(()=>{
    const map:Record<string,number>={};
    for(const item of summary?.statusCounts||[])map[item.status]=item._count?._all||0;
    return map;
  },[summary]);

  return <div className="salesCrm">
    <div className="moduleHeaderRow">
      <div>
        <div className="moduleEyebrow">SATIŞ OPERASYONU</div>
        <h2>KEKS CRM · Müşteri Yaşam Döngüsü</h2>
        <p className="muted">Lead → Görüşme → Paket önerildi → Doğrulanmış satın alma → İlk 30 gün → Yenileme → Ayrılma. Asıl değer yalnız kayıt değil, gözlenen öğrenci etkinliği, plan uygulaması ve koç görüşmesine katılımdır.</p>
      </div>
      <button className="btn" onClick={load}>Yenile</button>
    </div>

    {message&&<div className={'notice '+(message.startsWith('Hata:')?'error':'')}>{message}</div>}

    {summary&&<div className="salesKpiGrid">
      <div className="card"><span className="moduleEyebrow">TOPLAM LEAD</span><strong>{summary.total}</strong><small>Aktif: {summary.active}</small></div>
      <div className="card"><span className="moduleEyebrow">YENİ</span><strong>{statusMap.NEW||0}</strong><small>İlk temas bekliyor</small></div>
      <div className="card"><span className="moduleEyebrow">BİLDİRİLEN SATIŞ</span><strong>{summary.won||0}</strong><small>Elle kaydedilen satış; ödeme doğrulaması değildir.</small></div>
      <div className="card"><span className="moduleEyebrow">BİLDİRİLEN CİRO</span><strong>{money(summary.revenueKurus)}</strong><small>CRM beyanı; tahsil edilmiş ödeme toplamı değildir.</small></div>
    </div>}

    {summary?.lifecycle&&<section className="card" style={{marginTop:14}}>
      <div className="moduleEyebrow">30 GÜNLÜK KULLANIM VE YENİLEME</div>
      <h3>Satın alma sonrası gerçek kullanım</h3>
      <p className="muted">{summary.lifecycleScope}</p>
      <div className="salesKpiGrid">
        <div><strong>{summary.lifecycle.linkedPurchasers}</strong><small>Öğrenci hesabına bağlı, doğrulanmış satın alma</small></div>
        <div><strong>{pct(summary.lifecycle.retainedDay30Pct)}</strong><small>30. günde üyeliği ve kaydedilmiş kullanımı olanlar · {summary.lifecycle.retainedDay30}/{summary.lifecycle.day30Eligible} olgunlaşmış müşteri</small></div>
        <div><strong>{pct(summary.lifecycle.programAppliedPct)}</strong><small>İlk 30 günün son haftasında programının en az %60’ını uygulayanlar · {summary.lifecycle.programMeasured} ölçülebilir</small></div>
        <div><strong>{pct(summary.lifecycle.attendedCoachPct)}</strong><small>İlk 30 günde en az bir tamamlanmış koç görüşmesi · {summary.lifecycle.sessionsMeasured} görüşme kaydı olan</small></div>
        <div><strong>{summary.lifecycle.renewed}</strong><small>İkinci doğrulanmış abonelik ödemesi</small></div>
        <div><strong>{summary.lifecycle.churned}</strong><small>Abonelik bitiminden 7 gün sonra yenilemeyen</small></div>
      </div>
      <p className="muted">30 günlük oranlar yalnız ilk ödemesinden itibaren 30 gün geçmiş ve öğrenciyle açıkça eşleştirilmiş müşteriler üzerinden hesaplanır. Veri yoksa oran gösterilmez. Kayıt eksikliği, öğrencinin gerçek hayatta çalışmadığını kanıtlamaz.</p>
    </section>}

    {summary&&<div className="salesAnalyticsGrid">
      <div className="card">
        <div className="moduleEyebrow">SATIŞ HUNİSİ</div>
        <h3>Aşama dağılımı</h3>
        <div className="salesFunnel">
          {SALES_LEAD_STATUSES.map(s=><div key={s}><span>{SALES_LEAD_STATUS_LABELS[s]}</span><strong>{statusMap[s]||0}</strong></div>)}
        </div>
      </div>

      <div className="card">
        <div className="moduleEyebrow">TALEP KAYNAĞI</div>
        <h3>Nereden geliyor?</h3>
        <div className="salesFunnel">
          <div><span>Sizi Arayalım talepleri</span><strong>{summary.callbackRequests||0}</strong></div>
          <div><span>WhatsApp talepleri</span><strong>{summary.whatsappRequests||0}</strong></div>
          <div><span>Toplam talep</span><strong>{summary.totalRequests||0}</strong></div>
        </div>
      </div>

      <div className="card">
        <div className="moduleEyebrow">EĞİTİM DÜZEYİ</div>
        <h3>En çok talep gelen gruplar</h3>
        <div className="salesRankList">
          {(summary.educationCounts||[]).slice(0,8).map((x:any)=><div key={x.educationLevel}><span>{x.educationLevel}</span><strong>{x._sum?.inquiryCount||0} talep · {x._count?._all||0} lead</strong></div>)}
          {(summary.educationCounts||[]).length===0&&<p className="muted">Henüz eğitim düzeyi verisi yok.</p>}
        </div>
      </div>

      <div className="card">
        <div className="moduleEyebrow">GERÇEK SATIŞ</div>
        <h3>En çok satılan paketler</h3>
        <div className="salesRankList">
          {(summary.wonPackageCounts||[]).slice(0,8).map((x:any)=><div key={(x.soldPlanId||'')+'-'+(x.soldTerm||'')}>
            <span>{planLabel(x.soldPlanId)} · {TERM_LABELS[x.soldTerm]||x.soldTerm}</span>
            <strong>{x._count?._all||0} · {money(x._sum?.saleAmountKurus||0)}</strong>
          </div>)}
          {(summary.wonPackageCounts||[]).length===0&&<p className="muted">Henüz kazanılmış satış kaydı yok.</p>}
        </div>
      </div>
    </div>}

    <div className="card salesFilterBar">
      <div className="field"><label>Ara</label><input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')load()}} placeholder="Ad, telefon veya eğitim düzeyi"/></div>
      <div className="field"><label>Aşama</label><select value={status} onChange={e=>setStatus(e.target.value)}><option value="ALL">Tümü</option>{SALES_LEAD_STATUSES.map(s=><option key={s} value={s}>{SALES_LEAD_STATUS_LABELS[s]}</option>)}</select></div>
      <div className="field"><label>Kaynak</label><select value={source} onChange={e=>setSource(e.target.value)}><option value="ALL">Tümü</option><option value="CALLBACK">Sizi Arayalım</option><option value="WHATSAPP">WhatsApp</option></select></div>
      <button className="btn primary" onClick={load}>Filtrele</button>
    </div>

    {loading?<div className="notice">Leadler yükleniyor…</div>:<div className="salesLeadList">
      {leads.length===0?<div className="card muted">Bu filtrede lead bulunmuyor.</div>:leads.map(lead=><LeadCard key={lead.id} lead={lead} onSaved={async(msg)=>{setMessage(msg);await load()}}/>)}
    </div>}
  </div>;
}

function LeadCard({lead,onSaved}:{lead:Lead;onSaved:(message:string)=>Promise<void>}){
  const [status,setStatus]=useState<SalesLeadStatus>(lead.status);
  const [recommendedPlanId,setRecommendedPlanId]=useState(lead.recommendedPlanId||lead.inquiryPlanId||'');
  const [recommendedTerm,setRecommendedTerm]=useState(lead.recommendedTerm||'sixMonths');
  const [soldPlanId,setSoldPlanId]=useState(lead.soldPlanId||lead.recommendedPlanId||lead.inquiryPlanId||'');
  const [soldTerm,setSoldTerm]=useState(lead.soldTerm||lead.recommendedTerm||'sixMonths');
  const [saleTl,setSaleTl]=useState(lead.saleAmountKurus!=null?String(lead.saleAmountKurus/100):'');
  const [lostReason,setLostReason]=useState(lead.lostReason||'');
  const [studentCode,setStudentCode]=useState(lead.student?.studentCode||'');
  const [busy,setBusy]=useState(false);

  useEffect(()=>{
    setStatus(lead.status);
    setRecommendedPlanId(lead.recommendedPlanId||lead.inquiryPlanId||'');
    setRecommendedTerm(lead.recommendedTerm||'sixMonths');
    setSoldPlanId(lead.soldPlanId||lead.recommendedPlanId||lead.inquiryPlanId||'');
    setSoldTerm(lead.soldTerm||lead.recommendedTerm||'sixMonths');
    setSaleTl(lead.saleAmountKurus!=null?String(lead.saleAmountKurus/100):'');
    setLostReason(lead.lostReason||'');
    setStudentCode(lead.student?.studentCode||'');
  },[lead]);

  async function save(){
    setBusy(true);
    try{
      const payload:any={id:lead.id,status};
      if(studentCode.trim()!==(lead.student?.studentCode||'')){
        payload.studentCode=studentCode.trim()||null;
      }
      if(status==='PACKAGE_RECOMMENDED'||status==='WON'){
        payload.recommendedPlanId=recommendedPlanId||null;
        payload.recommendedTerm=recommendedTerm||null;
      }
      if(status==='WON'){
        payload.soldPlanId=soldPlanId||recommendedPlanId||null;
        payload.soldTerm=soldTerm||recommendedTerm||null;
        payload.saleAmountKurus=saleTl.trim()===''?null:Math.round(Number(saleTl.replace(',','.'))*100);
      }
      if(status==='LOST')payload.lostReason=lostReason.trim()||null;

      const r=await fetch('/api/admin/sales-leads',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
      const j=await r.json();
      if(!r.ok){await onSaved('Hata: '+(j.error||'Lead güncellenemedi.'));return}
      await onSaved('Lead güncellendi: '+SALES_LEAD_STATUS_LABELS[status]+'.');
    }finally{setBusy(false)}
  }

  return <article className={'card salesLeadCard status-'+String(lead.status).toLowerCase()}>
    <div className="salesLeadHead">
      <div>
        <span className="portalEyebrow">{lead.source==='WHATSAPP'?'WHATSAPP':'SİZİ ARAYALIM'}</span>
        <h3>{lead.name||'İsimsiz WhatsApp talebi'}</h3>
        <p><strong>{lead.phone}</strong> · {lead.educationLevel||'Eğitim düzeyi henüz bilinmiyor'}</p>
      </div>
      <span className={'adminStatus '+String(lead.status).toLowerCase()}>{SALES_LEAD_STATUS_LABELS[lead.status as SalesLeadStatus]||lead.status}</span>
    </div>

    <div className="salesLeadMeta">
      <span>İlk talep: {dt(lead.firstSeenAt)}</span>
      <span>Son hareket: {dt(lead.lastSeenAt)}</span>
      {lead.preferredTime&&<span>Arama saati: {lead.preferredTime}</span>}
      {lead.audience&&<span>Profil: {lead.audience}</span>}
    </div>

    {(lead.note||lead.lastMessage)&&<div className="salesLeadContext">
      {lead.note&&<p><strong>Not:</strong> {lead.note}</p>}
      {lead.lastMessage&&<p><strong>Son WhatsApp:</strong> {lead.lastMessage}</p>}
    </div>}

    <div className="salesLeadContext">
      <strong>Müşteri yaşam döngüsü: {LIFECYCLE_LABELS[lead.lifecycle?.stage]||'Veri bekleniyor'}</strong>
      <p>{lead.lifecycle?.guidance||'Yaşam döngüsü bilgisi yüklenemedi.'}</p>
      {lead.lifecycle?.firstPurchaseAt&&<p>İlk doğrulanmış satın alma: {dt(lead.lifecycle.firstPurchaseAt)} · 30 gün dolum: {dt(lead.lifecycle.day30At)}</p>}
      {lead.lifecycle?.day30Matured&&<p>30. gün kayıtlı kullanım: {lead.lifecycle.activityAtDay30?'Var':'Kaydedilmemiş'} · Program uygulama: {pct(lead.lifecycle.programCompletionPct)} · Koç görüşmesine katılım: {pct(lead.lifecycle.sessionAttendancePct)}</p>}
      {lead.lifecycle?.renewalDate&&<p>Mevcut abonelik bitişi: {dt(lead.lifecycle.renewalDate)}</p>}
      {lead.lifecycle?.renewed&&<p>Yenileme: ikinci doğrulanmış ödeme mevcut.</p>}
    </div>
    <div className="salesLeadEditor">
      <label className="salesLeadWide"><span>Öğrenci koduyla eşleştir</span><input value={studentCode} maxLength={40} onChange={e=>setStudentCode(e.target.value)} placeholder="KEKS öğrenci kodu"/></label>
      <p className="muted salesLeadWide">Öğrenci kodunu kontrol ederek eşleştirin. Telefon veya isim benzerliğine göre otomatik bağlama yapılmaz. Kodu temizleyip kaydetmek ilişkiyi kaldırır.</p>
      <label><span>Aşama</span><select value={status} onChange={e=>setStatus(e.target.value as SalesLeadStatus)}>{SALES_LEAD_STATUSES.map(s=><option key={s} value={s}>{SALES_LEAD_STATUS_LABELS[s]}</option>)}</select></label>

      {(status==='PACKAGE_RECOMMENDED'||status==='WON')&&<>
        <label><span>Önerilen eğitim paketi</span><select value={recommendedPlanId} onChange={e=>{setRecommendedPlanId(e.target.value);if(!soldPlanId)setSoldPlanId(e.target.value)}}><option value="">Seç</option>{ALL_PLANS.map(p=><option key={p.id} value={p.id}>{p.level} · {p.name}</option>)}</select></label>
        <label><span>Önerilen süre</span><select value={recommendedTerm} onChange={e=>setRecommendedTerm(e.target.value)}>{Object.entries(TERM_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
      </>}

      {status==='WON'&&<>
        <label><span>Satılan paket</span><select value={soldPlanId} onChange={e=>setSoldPlanId(e.target.value)}><option value="">Seç</option>{ALL_PLANS.map(p=><option key={p.id} value={p.id}>{p.level} · {p.name}</option>)}</select></label>
        <label><span>Satılan süre</span><select value={soldTerm} onChange={e=>setSoldTerm(e.target.value)}>{Object.entries(TERM_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
        <label><span>Satış tutarı (TL)</span><input inputMode="decimal" value={saleTl} onChange={e=>setSaleTl(e.target.value)} placeholder="Örn. 12999"/></label>
      </>}

      {status==='LOST'&&<label className="salesLeadWide"><span>Kaybedilme nedeni</span><input value={lostReason} onChange={e=>setLostReason(e.target.value)} maxLength={500} placeholder="Örn. fiyat, zamanlama, karar ertelendi"/></label>}

      <button className="btn primary" onClick={save} disabled={busy}>{busy?'Kaydediliyor…':'CRM Kaydını Güncelle'}</button>
    </div>
  </article>;
}
