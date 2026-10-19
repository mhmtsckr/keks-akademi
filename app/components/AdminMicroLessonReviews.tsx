'use client';

import {useEffect,useState} from 'react';
import {AdminPerformanceQuality} from './AdminPerformanceQuality';

type Lesson={
  id:string;version:number;subject:string;title:string;skill:string;
  explanation:string;misconception:string;
  worked:{prompt:string;steps:string[];answer:string};
  exercises:{prompt:string;options?:Record<string,string>;answer:string;explanation:string}[];
  publication:{status:'APPROVED'|'PILOT';reviewedAt:string|null};
  contentDigest:string;
  targetGrades?:readonly number[];targetExams?:readonly string[];topicTags?:readonly string[];
  sourceUrl?:string;
  sourceEvidence?:{themeVerified:boolean;outcomeCodeVerified:boolean;theme:string|null;outcomeCode:string|null;sourceUrl:string|null;checkedOn:string|null;interpretation:string};
};

export function AdminMicroLessonReviews(){
 const [lessons,setLessons]=useState<Lesson[]>([]);
 const [coverage,setCoverage]=useState<any|null>(null);
 const [note,setNote]=useState<Record<string,string>>({});
 const [checked,setChecked]=useState<Record<string,boolean>>({});
 const [busy,setBusy]=useState('');
 const [message,setMessage]=useState('');
 const [filter,setFilter]=useState<'ALL'|'PILOT'|'APPROVED'>('PILOT');
 async function load(){
  try{
   const [r,c]=await Promise.all([
     fetch('/api/admin/micro-lessons',{cache:'no-store'}),
     fetch('/api/admin/micro-lessons/coverage',{cache:'no-store'})
   ]);
   const [j,cj]=await Promise.all([r.json(),c.json()]);
   if(c.ok&&cj.ok)setCoverage(cj.coverage||null);
   if(!r.ok)throw Error(j.error||'İçerik listesi alınamadı.');
   setLessons(j.lessons||[]);
  }catch(e){setMessage('Hata: '+(e instanceof Error?e.message:'Mikro dersler yüklenemedi.'));}
 }
 useEffect(()=>{void load()},[]);
 async function review(lesson:Lesson,decision:'APPROVE'|'REVOKE'){
   if(!checked[lesson.id])return setMessage('İçerik kontrol kutusunu işaretlemelisiniz.');
   const text=String(note[lesson.id]||'').trim();
   if(text.length<12)return setMessage('Gerekçeli inceleme notu en az 12 karakter olmalıdır.');
   setBusy(lesson.id);setMessage('');
   try{
    const r=await fetch('/api/admin/micro-lessons',{
     method:'PATCH',headers:{'content-type':'application/json'},
     body:JSON.stringify({id:lesson.id,version:lesson.version,contentDigest:lesson.contentDigest,decision,note:text,confirmedReviewed:true})
    });
    const j=await r.json();
    if(!r.ok)throw Error(j.error||'İnceleme kaydedilemedi.');
    setMessage(j.message||'İçerik durumu güncellendi.');
    setChecked(x=>({...x,[lesson.id]:false}));
    setNote(x=>({...x,[lesson.id]:''}));
    await load();
   }catch(e){setMessage('Hata: '+(e instanceof Error?e.message:'Bağlantı hatası'));}
   finally{setBusy('');}
 }
 const visible=lessons.filter(x=>filter==='ALL'||x.publication.status===filter);
 return <div className="card" style={{marginBottom:16}}>
  <div className="moduleHeaderRow">
   <div>
    <div className="moduleEyebrow">KEKS MİKRO DERS · İÇERİK KALİTESİ</div>
    <h3>Çözümlü Örnek Kataloğu Onay Merkezi</h3>
    <p className="muted">Her dersin bilgi doğruluğunu, seçeneklerini, cevap anahtarını ve açıklamasını inceleyin. Onay, içerik sürümüne ve değişmez özete bağlıdır; içerik değiştirilirse otomatik olarak pilota döner.</p>
   </div>
   <span className="pill">{lessons.filter(x=>x.publication.status==='APPROVED').length}/{lessons.length} onaylı</span>
  </div>
  <AdminPerformanceQuality/>
  {coverage&&<div className="card" style={{marginBottom:16}}>
    <div className="moduleEyebrow">2026–2027 · DERS/KONU TAMAMLAMA HARİTASI</div>
    <h4>Üretim ve eksik kazanım takibi</h4>
    <p className="muted">{coverage.totalLessons} pilot/içerik · {coverage.totalExercises} alıştırma. Bu tablo MEB/ÖSYM tarafından doğrulanmış kazanım kapsamı değildir; eksik içerik iş listesidir.</p>
    {(coverage.verifiedLiteraturePrograms||[]).map((g:any)=><details key={'tde-'+g.grade} className="card" style={{marginTop:12,marginBottom:12}}>
      <summary><strong>MEB TYMM · {g.grade}. sınıf Türk Dili ve Edebiyatı</strong> · {' '+g.totalOfficialThemes} tema · {' '+g.verifiedOutcomeContexts} tema bağlamında doğrulanmış kod · {' '+g.linkedPilotLessons} özgün mikro ders</summary>
      <p className="muted">{g.disclaimer}</p>
      <div className="stack" style={{gap:8}}>
       {(g.themes||[]).map((t:any)=><div key={t.id}>
        <strong>{t.theme}</strong> · {t.linkedPilotLessons} pilot mikro ders
        <p className="muted">{t.outcomeCode?'Kod: '+t.outcomeCode+' · '+t.skill:'Sadece tema başlığı doğrulandı; kazanım eşleştirmesi bekliyor'}</p>
        <a href={t.sourceUrl} target="_blank" rel="noopener noreferrer">MEB resmî tema ve öğrenme çıktıları</a>
       </div>)}
      </div>
    </details>)}
        {coverage.verifiedGrade7Science&&<details className="card" style={{marginTop:12,marginBottom:12}}>
      <summary><strong>MEB TYMM · 7. sınıf Fen Bilimleri</strong> ·
        {' '+coverage.verifiedGrade7Science.totalOfficialUnits} resmî ünite ·
        {' '+coverage.verifiedGrade7Science.verifiedSampleOutcomes} doğrulanmış örnek çıktı ·
        {' '+coverage.verifiedGrade7Science.linkedPilotLessons} pilot ders
      </summary>
      <p className="muted">{coverage.verifiedGrade7Science.disclaimer}</p>
      <div className="stack" style={{gap:8}}>
        {(coverage.verifiedGrade7Science.units||[]).map((u:any)=><div key={u.outcomeCode}>
          <strong>{u.unit}. ünite: {u.title}</strong> · {u.outcomeCode}
          <p className="muted">{u.skill} · {u.linkedPilotLessons} pilot mikro ders · {u.scheduledHours} ders saati</p>
          <a href={u.sourceUrl} target="_blank" rel="noopener noreferrer">MEB resmî ünite ve çıktı kaynağı</a>
        </div>)}
      </div>
    </details>}
            {coverage.verifiedMath&&<details className="card" style={{marginTop:12,marginBottom:12}}>
      <summary><strong>MEB TYMM · 9, 10 ve 11. sınıf Matematik</strong> ·
       {' '+coverage.verifiedMath.totalOfficialOutcomes} doğrulanmış öğrenme çıktısı ·
       {' '+coverage.verifiedMath.linkedPilotLessons} pilot mikro ders
      </summary>
      <p className="muted">{coverage.verifiedMath.disclaimer}</p>
      <div className="stack" style={{gap:8}}>
        {(coverage.verifiedMath.outcomes||[]).map((x:any)=><div key={x.code}>
          <strong>{x.grade}. sınıf · {x.code}</strong> — {x.theme}
          <p className="muted">{x.skill} · {x.linkedPilotLessons} çözümlü mikro ders</p>
          <a href={x.sourceUrl} target="_blank" rel="noopener noreferrer">MEB resmî öğrenme çıktısı</a>
        </div>)}
      </div>
    </details>}
            {coverage.verifiedGeography&&<details className="card" style={{marginTop:12,marginBottom:12}}>
      <summary><strong>MEB TYMM · 10. sınıf Coğrafya</strong> ·
       {' '+coverage.verifiedGeography.distinctThemes} tema ·
       {' '+coverage.verifiedGeography.totalOfficialOutcomes} resmî çıktı ·
       {' '+coverage.verifiedGeography.linkedPilotLessons} pilot mikro ders
      </summary>
      <p className="muted">{coverage.verifiedGeography.disclaimer}</p>
      <div className="stack" style={{gap:8}}>
       {(coverage.verifiedGeography.outcomes||[]).map((x:any)=><div key={x.code}>
        <strong>{x.code} · {x.theme}</strong>
        <p className="muted">{x.skill} · {x.linkedPilotLessons} özgün mikro ders</p>
        <a href={x.sourceUrl} target="_blank" rel="noopener noreferrer">Resmî MEB öğrenme çıktısı</a>
       </div>)}
      </div>
    </details>}
        {coverage.verifiedAdditionalOutcomes&&<details className="card" style={{marginTop:12,marginBottom:12}}>
      <summary><strong>Yeni resmî öğrenme çıktıları · 5, 6, 9, 10 ve 11. sınıflar</strong> ·
        {' '+coverage.verifiedAdditionalOutcomes.totalOfficialOutcomes} çıktı kodu ·
        {' '+coverage.verifiedAdditionalOutcomes.linkedPilotLessons} pilot mikro ders
      </summary>
      <p className="muted">{coverage.verifiedAdditionalOutcomes.note}</p>
      <div className="stack" style={{gap:9}}>
        {(coverage.verifiedAdditionalOutcomes.outcomes||[]).map((item:any)=><div key={item.code}>
          <strong>{item.grade}. sınıf {item.subject}</strong> · {item.code}
          <p className="muted">{item.theme} · {item.skill} · {item.linkedPilotLessons} pilot örnek</p>
          <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">MEB öğrenme çıktısı kaynağı</a>
        </div>)}
      </div>
      <small className="muted">Kazanım kodu doğrulaması MEB veya bağımsız alan uzmanı tarafından KEKS sorularının onaylandığı anlamına gelmez.</small>
    </details>}
        {(coverage.verifiedMiddlePrograms||[]).map((record:any)=><details key={record.grade+'-'+record.subject}
      className="card" style={{marginTop:12,marginBottom:12}}>
      <summary><strong>Resmî MEB · {record.grade}. sınıf {record.subject}</strong> ·
        {' '+record.totalThemes} başlık · {record.linkedPilotLessons} pilot beceri ·
        {' '+record.outcomesWithVerifiedCodes} doğrulanmış kod
      </summary>
      <p className="muted">{record.disclaimer}</p>
      <div className="stack" style={{gap:8}}>
        {(record.themes||[]).map((theme:any)=><div key={theme.id}>
          <strong>{theme.title}</strong> · {theme.linkedPilotLessons} mikro ders
          <p className="muted">
            {theme.outcomeCode?'Doğrulanmış kod: '+theme.outcomeCode:
              theme.verification==='THEME_SCOPE'?'Tema becerisi doğrulandı, kod incelemede':
              'Program dizini doğrulandı, beceri eşleştirmesi henüz yapılmadı'}
          </p>
          <a href={theme.sourceUrl} target="_blank" rel="noopener noreferrer">MEB program kaynağı</a>
        </div>)}
      </div>
    </details>)}
        {coverage.verifiedThemeSources&&<details className="card" style={{marginTop:12,marginBottom:12}}>
      <summary><strong>Resmî kaynak eşleştirmesi: 7. sınıf Türkçe</strong> · {coverage.verifiedThemeSources.totalThemes} MEB teması · {coverage.verifiedThemeSources.linkedPilotLessons} pilot örnek · {coverage.verifiedThemeSources.outcomesWithVerifiedCodes} doğrulanmış çıktı kodu</summary>
      <p className="muted">{coverage.verifiedThemeSources.disclaimer}</p>
      <div className="stack" style={{gap:8}}>
        {(coverage.verifiedThemeSources.themes||[]).map((item:any)=><div key={item.id}>
          <strong>{item.theme}</strong> · {item.linkedPilotLessons} pilot mikro ders
          <p className="muted">{item.skill} · {item.outcomeCode?'Resmî kod: '+item.outcomeCode:'Resmî öğrenme çıktısı kodu doğrulama bekliyor'}</p>
          <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">MEB tema sayfası</a>
        </div>)}
      </div>
    </details>}
    <div className="stack" style={{gap:8}}>
      {(coverage.gradeRows||[]).map((g:any)=><details key={g.grade}>
        <summary><strong>{g.grade}. sınıf</strong> · {g.framework==='TYMM'?'2026–2027 Maarif Modeli':'Önceki MEB programı'} · {g.subjectsWithLessons}/{g.totalSubjects} derste başlangıç içeriği</summary>
        <div className="stack" style={{margin:8}}>
          {(g.subjects||[]).map((subject:any)=><div key={subject.subject} className="muted">
            <strong>{subject.subject}:</strong> {subject.pilotLessons} mikro ders ·
            {subject.indexedTopics===null
              ?' Resmî konu dizini aktarılmadı; kapsam oranı hesaplanamaz.'
              :' '+subject.matchedIndexTopics+'/'+subject.indexedTopics+' KEKS iç dizin başlığı eşleşti.'}
            {subject.missingTopicNames?.length>0&&
              <div><small>Öncelikli açık başlıklar: {subject.missingTopicNames.slice(0,6).join(' · ')}</small></div>}
          </div>)}
        </div>
      </details>)}
      {(coverage.examRows||[]).map((ex:any)=><details key={ex.examType}>
        <summary><strong>{ex.examType}</strong> · ÖSYM/ilgili sınav · {ex.totalPilotLessons} konu adayı</summary>
        <div className="stack" style={{margin:8}}>
          {(ex.subjects||[]).map((subject:any)=><div key={subject.subject} className="muted">
            <strong>{subject.subject}:</strong> {subject.pilotLessons} mikro ders · {subject.matchedIndexTopics}/{subject.indexedTopics} KEKS iç dizin başlığı
            {subject.missingTopicNames?.length>0&&<div><small>Açık başlıklar: {subject.missingTopicNames.slice(0,6).join(' · ')}</small></div>}
          </div>)}
        </div>
      </details>)}
    </div>
  </div>}
  <div className="notice">Bu ekrandaki işlem <strong>yönetici içerik onayıdır</strong>. Bağımsız alan uzmanı/öğretmen tarafından onaylandığı anlamına gelmez. Alan uzmanı kontrolü yapılmadıysa uzman onayı iddiasında bulunmayın.</div>
  <div className="row" style={{marginTop:12,flexWrap:'wrap'}}>
   <label htmlFor="micro-lesson-filter">Filtre:</label>
   <select id="micro-lesson-filter" value={filter} onChange={e=>setFilter(e.target.value as typeof filter)}>
    <option value="PILOT">Onay bekleyenler</option><option value="APPROVED">Onaylılar</option><option value="ALL">Tümü</option>
   </select>
   <button type="button" className="btn" onClick={()=>void load()}>Yenile</button>
  </div>
  {message&&<p className={'notice '+(message.startsWith('Hata:')?'error':'')} role="status">{message}</p>}
  <div className="stack" style={{marginTop:14}}>
   {visible.length===0?<p className="muted">Bu filtrede mikro ders bulunmuyor.</p>:visible.map(x=>
    <details className="card" key={x.id} style={{margin:0}}>
     <summary><strong>{x.subject} · {x.title}</strong> <span className="pill">{x.publication.status==='APPROVED'?'İçerik onaylı':'Pilot / bekliyor'}</span></summary>
     <p><strong>Beceri:</strong> {x.skill}</p>
     {x.sourceEvidence&&<p className="muted"><strong>Resmî müfredat kanıtı:</strong> {x.sourceEvidence.themeVerified?'Tema bağlantısı doğrulandı':'Kesin tema eşleştirmesi doğrulanmadı'} · {x.sourceEvidence.outcomeCodeVerified?'Öğrenme çıktısı kodu doğrulandı: '+x.sourceEvidence.outcomeCode:'Kazanım kodu kontrol bekliyor'} · {x.sourceEvidence.interpretation}</p>}
     <p className="muted"><strong>Uygun düzeyler:</strong> {(x.targetGrades||[]).map(g=>g+'. sınıf').join(', ')||'—'} · <strong>Sınavlar:</strong> {(x.targetExams||[]).join(', ')||'—'} · <strong>KEKS konu etiketleri:</strong> {(x.topicTags||[]).join(', ')||'Yok / doğrulama bekliyor'}</p>
     <p><strong>Açıklama:</strong> {x.explanation}</p>
     <p><strong>Kavram yanılgısı:</strong> {x.misconception}</p>
     <p><strong>Çözümlü örnek:</strong> {x.worked.prompt}</p>
     <ol>{x.worked.steps.map((step,i)=><li key={i}>{step}</li>)}</ol>
     <p><strong>Örnek cevabı:</strong> {x.worked.answer}</p>
     {x.sourceUrl&&<p><a href={x.sourceUrl} target="_blank" rel="noopener noreferrer">İlgili kaynak sayfası</a></p>}
     <strong>Alıştırmalar ve cevap anahtarı ({x.exercises.length})</strong>
     <ol>{x.exercises.map((q,i)=><li key={i}>
       <p>{q.prompt}</p>
       {q.options&&<p className="muted">{Object.entries(q.options).map(([key,val])=>key+') '+val).join(' · ')}</p>}
       <p><strong>Beklenen:</strong> {q.answer} · {q.explanation}</p>
      </li>)}</ol>
     <small className="muted">Sürüm {x.version} · SHA-256: {x.contentDigest.slice(0,16)}…</small>
     <div className="field" style={{marginTop:12}}>
      <label htmlFor={'micro-note-'+x.id}>İnceleme notu / gerekçe</label>
      <textarea id={'micro-note-'+x.id} rows={2} value={note[x.id]||''}
       onChange={e=>setNote(v=>({...v,[x.id]:e.target.value}))}
       placeholder="Bilgi, kazanım, cevap ve açıklamalar kontrol edildi; gözlemler..." maxLength={1200}/>
     </div>
     <label style={{display:'flex',gap:9,marginBottom:12}}>
      <input type="checkbox" checked={Boolean(checked[x.id])} onChange={e=>setChecked(v=>({...v,[x.id]:e.target.checked}))}/>
      <span>Bu içerik sürümünü ve tüm cevap anahtarlarını gerçekten inceledim.</span>
     </label>
     <div className="row">
      {x.publication.status!=='APPROVED'
       ?<button className="btn primary" type="button" disabled={busy===x.id} onClick={()=>void review(x,'APPROVE')}>İçeriği Onayla</button>
       :<button className="btn danger" type="button" disabled={busy===x.id} onClick={()=>void review(x,'REVOKE')}>Onayı Geri Al</button>}
     </div>
    </details>)}
  </div>
 </div>;
}
