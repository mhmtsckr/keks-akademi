'use client';

import { FormEvent,useMemo,useState } from 'react';

const AGS_FIELDS=[
'Almanca','Arapça','Ayakkabı ve Saraciye Teknolojisi','Beden Eğitimi','Bilgisayar ve Öğretim Teknolojileri','Bilişim Teknolojileri','Biyoloji','Biyomedikal Cihaz Teknolojileri','Büro Yönetimi / Büro Yönetimi ve Yönetici Asistanlığı','Coğrafya','Çocuk Gelişimi ve Eğitimi','Denizcilik / Gemi Makineleri','Denizcilik / Gemi Yönetimi','Din Kültürü ve Ahlâk Bilgisi','Elektrik-Elektronik Teknolojisi / Elektrik','Elektrik-Elektronik Teknolojisi / Elektronik','Endüstriyel Otomasyon Teknolojileri','Felsefe','Fen Bilimleri','Fizik','Giyim Üretim Teknolojisi / Moda Tasarım Teknolojileri','Görsel Sanatlar','Grafik ve Fotoğraf / Grafik','Hayvan Sağlığı / Hayvan Yetiştiriciliği ve Sağlığı / Hayvan Sağlığı','İlköğretim Matematik','İmam-Hatip Lisesi Meslek Dersleri','İngilizce','İnşaat Teknolojisi / Yapı Tasarım','İtfaiyecilik ve Yangın Güvenliği','Kimya / Kimya Teknolojisi','Kuyumculuk Teknolojisi','Makine Teknolojisi / Makine ve Tasarım Teknolojisi / Makine Model','Makine Teknolojisi / Makine ve Tasarım Teknolojisi / Makine Ressamlığı','Makine Teknolojisi / Makine ve Tasarım Teknolojisi / Makine ve Kalıp','Matematik','Metal Teknolojisi','Mobilya ve İç Mekan Tasarımı','Motorlu Araçlar Teknolojisi','Müzik','Okul Öncesi','Özel Eğitim','Pazarlama ve Perakende','Raylı Sistemler Teknolojisi / Raylı Sistem Araçları','Raylı Sistemler Teknolojisi / Raylı Sistemler Elektrik-Elektronik','Rehberlik','Rusça','Sağlık / Sağlık Hizmetleri','Sanat ve Tasarım / Plastik Sanatlar','Sınıf Öğretmenliği','Sosyal Bilgiler','Tarım Teknolojileri / Tarım','Tarih','Teknoloji ve Tasarım','Tesisat Teknolojisi ve İklimlendirme','Tiyatro','Türk Dili ve Edebiyatı','Türkçe','Uçak Bakım / Uçak Elektroniği','Uçak Bakım / Uçak Gövde-Motor','Ulaştırma Hizmetleri / Lojistik','Yaşayan Diller ve Lehçeler (Kürtçe / Kurmanci)','Yaşayan Diller ve Lehçeler (Kürtçe / Zazaki)','Yenilenebilir Enerji Teknolojileri','Yiyecek İçecek Hizmetleri'
];

function examTitle(level:string){
  if(level==='KPSS')return 'KPSS Atama / Yerleştirme Hedefi';
  if(level==='AGS_OBAT')return 'MEB-AGS / ÖABT Öğretmenlik Hedefi';
  return 'Hedef Okul / Üniversite';
}

export function TargetManager({studentId,initial}:{studentId:string;initial:any}) {
  const [msg,setMsg]=useState('');
  const [target,setTarget]=useState(initial||null);
  const [examLevel,setExamLevel]=useState(target?.examLevel||'YKS');
  const isKpss=examLevel==='KPSS';
  const isAgs=examLevel==='AGS_OBAT';
  const isClassic=!isKpss&&!isAgs;

  const netMessage=useMemo(()=>{
    if(!target)return '';
    if(target.officialNetsStatus==='NOT_PUBLISHED')return 'Resmî kurum bu yerleştirme/alan için atanan adayların test bazlı netlerini yayımlamıyor.';
    if(target.officialNetsStatus==='SYNCED')return 'Resmî net verisi senkronlandı.';
    return '';
  },[target]);

  async function save(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setMsg('');
    const fd=new FormData(e.currentTarget);
    let benchmarkNets:any=undefined;
    const raw=String(fd.get('benchmarkNets')||'').trim();
    if(raw){try{benchmarkNets=JSON.parse(raw)}catch{return setMsg('Hata: Hedef netler JSON biçiminde olmalı.')}}

    const level=String(fd.get('examLevel'));
    const body={
      examLevel:level,
      institutionName:String(fd.get('institutionName')||'').trim()||(level==='AGS_OBAT'?'Millî Eğitim Akademisi':''),
      departmentName:String(fd.get('departmentName')||'').trim()||undefined,
      programCode:String(fd.get('programCode')||'').trim()||undefined,
      qualificationLevel:String(fd.get('qualificationLevel')||'').trim()||undefined,
      source:level==='KPSS'?'OSYM':level==='AGS_OBAT'?'MEB':fd.get('source'),
      sourceUrl:String(fd.get('sourceUrl')||'').trim()||undefined,
      dataYear:fd.get('dataYear')?Number(fd.get('dataYear')):undefined,
      score:fd.get('score')?Number(fd.get('score')):undefined,
      ranking:fd.get('ranking')?Number(fd.get('ranking')):undefined,
      percentile:fd.get('percentile')?Number(fd.get('percentile')):undefined,
      benchmarkNets
    };
    const r=await fetch('/api/coach/students/'+studentId+'/target',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json();
    if(!r.ok)return setMsg('Hata: '+(j.error||'Kaydedilemedi.'));
    setTarget(j.row);
    setMsg(j.message||'Hedef kaydedildi.');
  }

  async function sync(){
    setMsg('Resmî kaynak kontrol ediliyor...');
    const r=await fetch('/api/coach/students/'+studentId+'/target/sync',{method:'POST'});
    const j=await r.json();
    if(!r.ok)return setMsg('Hata: '+(j.error||'Senkron başarısız.'));
    setTarget(j.target);setMsg(j.message);
  }

  async function analyze(){
    setMsg('Performans raporu oluşturuluyor...');
    const r=await fetch('/api/coach/students/'+studentId+'/analysis',{method:'POST'});
    const j=await r.json();
    if(!r.ok)return setMsg('Hata: '+(j.error||'Rapor oluşturulamadı.'));
    setMsg('Koç raporu oluşturuldu: '+j.gap.text);
    setTimeout(()=>location.reload(),700);
  }

  return <div className="card">
    <div className="moduleHeaderRow">
      <div><div className="moduleEyebrow">HEDEF YÖNETİMİ</div><h2>{examTitle(examLevel)}</h2><p className="muted">KPSS ve AGS/ÖABT hedefleri resmî ÖSYM/MEB kaynaklarıyla senkronlanır.</p></div>
      {target&&<span className={'adminStatus '+(target.syncStatus==='SYNCED'?'active':target.syncStatus==='NEEDS_VERIFICATION'?'pending':'')}>{target.syncStatus||'PENDING'}</span>}
    </div>

    {target&&(target.examLevel==='KPSS'||target.examLevel==='AGS_OBAT')&&<div className="officialTargetPanel">
      <div className="officialTargetHero">
        <div><span>Resmî dönem</span><strong>{target.officialPeriod||target.dataYear||'—'}</strong></div>
        <div><span>Kaynak</span><strong>{target.source}</strong></div>
        <div><span>{target.examLevel==='AGS_OBAT'?'Öğretmenlik alanı':'Hedef kadro'}</span><strong>{target.departmentName||target.institutionName}</strong></div>
      </div>
      <div className="officialTargetMetrics">
        <div><b>{target.appointmentCount??'—'}</b><span>{target.examLevel==='AGS_OBAT'?'Resmî alan kontenjanı':'Kontenjan'}</span></div>
        <div><b>{target.placedCount??'—'}</b><span>Yerleşen aday</span></div>
        <div><b>{target.officialMinScore!=null?Number(target.officialMinScore).toFixed(3):'—'}</b><span>En düşük yerleşme puanı</span></div>
        <div><b>{target.officialMaxScore!=null?Number(target.officialMaxScore).toFixed(3):'—'}</b><span>En yüksek puan</span></div>
        <div><b>{target.officialEligibilityScore!=null?target.officialEligibilityScore:'—'}</b><span>Başvuru eşiği</span></div>
        <div><b>{target.officialScoreType||'—'}</b><span>Resmî puan türü</span></div>
      </div>
      {netMessage&&<div className="notice officialNetNotice"><strong>Atanan aday netleri:</strong> {netMessage}</div>}
    </div>}

    <form className="form" onSubmit={save}>
      <div className="row">
        <div className="field" style={{flex:1}}><label>Sınav / hedef türü</label><select name="examLevel" value={examLevel} onChange={e=>setExamLevel(e.target.value)}>
          <option value="YKS">YKS</option><option value="LGS">LGS</option><option value="KPSS">KPSS</option><option value="AGS_OBAT">MEB-AGS / ÖABT</option>
        </select></div>
        {isClassic&&<div className="field" style={{flex:1}}><label>Kaynak</label><select name="source" defaultValue={target?.source||'YOKATLAS'}><option value="YOKATLAS">YÖK Atlas</option><option value="MEB">MEB / Rota Maarif</option><option value="MANUAL">Manuel</option></select></div>}
      </div>

      {isKpss&&<>
        <div className="row">
          <div className="field" style={{flex:1}}><label>KPSS öğrenim düzeyi</label><select name="qualificationLevel" defaultValue={target?.qualificationLevel||'LISANS'} required><option value="ORTAOGRETIM">Ortaöğretim</option><option value="ONLISANS">Ön Lisans</option><option value="LISANS">Lisans</option></select></div>
          <div className="field" style={{flex:1}}><label>ÖSYM program kodu</label><input name="programCode" defaultValue={target?.programCode||''} placeholder="Örn. 301014259"/></div>
        </div>
        <div className="field"><label>Hedef kurum</label><input name="institutionName" required defaultValue={target?.examLevel==='KPSS'?target?.institutionName||'':''} placeholder="Örn. Devlet Demiryolları Taşımacılık A.Ş."/></div>
        <div className="field"><label>Hedef kadro / pozisyon</label><input name="departmentName" required defaultValue={target?.examLevel==='KPSS'?target?.departmentName||'':''} placeholder="Örn. Memur, Mühendis, Psikolog"/></div>
        <div className="notice"><strong>Kesin otomatik eşleşme için ÖSYM program kodunu girin.</strong> Kod yoksa kurum + kadro adına göre eşleştirme denenir.</div>
      </>}

      {isAgs&&<>
        <input type="hidden" name="institutionName" value="Millî Eğitim Akademisi"/>
        <div className="field"><label>Öğretmenlik alanı</label><select name="departmentName" defaultValue={target?.examLevel==='AGS_OBAT'?target?.departmentName||'':''} required><option value="">Alan seçin</option>{AGS_FIELDS.map(x=><option key={x} value={x}>{x}</option>)}</select></div>
        <div className="notice"><strong>MEB-AGS / ÖABT hedefi:</strong> Alan kontenjanı, resmî MEB-AGS puan türü ve yayımlanmış başvuru eşiği otomatik alınır. Fiilî son kabul puanı ve test bazlı netler yayımlanmadıysa sistem bunları tahmin etmez.</div>
      </>}

      {isClassic&&<>
        <div className="field"><label>Üniversite / okul adı</label><input name="institutionName" required defaultValue={target?.examLevel===examLevel?target?.institutionName||'':''}/></div>
        <div className="field"><label>Bölüm (YKS)</label><input name="departmentName" defaultValue={target?.examLevel===examLevel?target?.departmentName||'':''}/></div>
        <div className="field"><label>YÖK program kodu</label><input name="programCode" defaultValue={target?.programCode||''} placeholder="Örn. 200210555"/></div>
        <div className="field"><label>Resmî kaynak bağlantısı</label><input name="sourceUrl" type="url" defaultValue={target?.sourceUrl||''}/></div>
        <div className="row">
          <div className="field" style={{flex:1}}><label>Veri yılı</label><input name="dataYear" type="number" defaultValue={target?.dataYear||2026}/></div>
          <div className="field" style={{flex:1}}><label>Taban puan</label><input name="score" type="number" step="0.001" defaultValue={target?.score||''}/></div>
        </div>
        <div className="row">
          <div className="field" style={{flex:1}}><label>Başarı sırası (YKS)</label><input name="ranking" type="number" defaultValue={target?.ranking||''}/></div>
          <div className="field" style={{flex:1}}><label>Yüzdelik dilim (LGS)</label><input name="percentile" type="number" step="0.01" defaultValue={target?.percentile||''}/></div>
        </div>
        <div className="field"><label>Hedef netler (isteğe bağlı JSON)</label><textarea name="benchmarkNets" rows={4} defaultValue={target?.benchmarkNets?JSON.stringify(target.benchmarkNets,null,2):''} placeholder='{"TYT Matematik":30,"TYT Türkçe":32}'/></div>
      </>}

      {(isKpss||isAgs)&&<input type="hidden" name="dataYear" value="2026"/>}
      <div className="row"><button className="btn primary">Hedefi Kaydet ve Resmî Veriyi Çek</button>{target&&<button type="button" className="btn" onClick={sync}>Resmî Veriyi Yenile</button>}<button type="button" className="btn" onClick={analyze}>Koç Raporu Oluştur</button></div>
    </form>
    {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')}>{msg}</div>}
  </div>;
}
