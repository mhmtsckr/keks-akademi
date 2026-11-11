'use client';

import {useCallback,useEffect,useMemo,useState} from 'react';

const priorityLabels:Record<string,string>={
  REVIEW:'Öncelikli inceleme',MONITOR:'İzle',COLLECT_EVIDENCE:'Ek ölçüm gerekli',MAINTAIN:'Koruma çalışması'
};
const trendLabels:Record<string,string>={
  MEASURE_MORE:'Karşılaştırma verisi yetersiz',
  IMPROVING:'Olumlu eğilim',DECLINING:'Düşüş eğilimi',STEADY:'Sınırlı değişim'
};
const concordanceLabels:Record<string,string>={
  CONFLICTING:'Kaynaklar arası belirgin fark',
  BOTH_NEED_SUPPORT:'İki kaynakta da destek sinyali',
  BOTH_HIGH:'İki kaynakta yüksek doğruluk',
  MIXED:'Karma görünüm',
  INSUFFICIENT:'Karşılaştırma için veri yetersiz'
};
const topicLabels:Record<string,string>={
  REGRESSING:'Düşüş sinyali',AT_RISK:'Destek gerektiren sinyal',
  MEASURE_MORE:'Ölçüm eksik',MIXED:'Karışık sinyal',
  IMPROVING:'İyileşme sinyali',CONSISTENT:'İstikrarlı sinyal'
};
function change(n:number|null){
  return n==null?'—':(n>0?'+':'')+n+' puan';
}
function percent(n:number|null){
  return n==null?'—':'%'+n;
}
export function AcademicPerformanceCenter({
  audience='STUDENT',studentId
}:{audience?:'STUDENT'|'COACH';studentId?:string}){
  const [report,setReport]=useState<any>(null);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(true);
  const [examFilter,setExamFilter]=useState('ALL');
  const [reviewReasons,setReviewReasons]=useState<Record<string,string>>({});
  const [reviewPending,setReviewPending]=useState('');
  const [reviewMessage,setReviewMessage]=useState('');
  const [crossSourceFollowUps,setCrossSourceFollowUps]=useState<any[]>([]);
  const [followUpTruncated,setFollowUpTruncated]=useState(false);
  const endpoint=audience==='COACH'
    ?'/api/coach/students/'+encodeURIComponent(studentId||'')+'/academic-performance'
    :'/api/student/academic-performance';
  const interventionEndpoint=audience==='COACH'&&studentId
    ?'/api/coach/students/'+encodeURIComponent(studentId)+'/academic-interventions'
    :null;
  const loadInterventions=useCallback(async()=>{
    if(!interventionEndpoint)return;
    try{
      const response=await fetch(interventionEndpoint,{cache:'no-store'});
      if(!response.ok)return;
      const payload=await response.json();
      setCrossSourceFollowUps(payload.items||[]);
      setFollowUpTruncated(Boolean(payload.truncated));
    }catch{/* Supplemental follow-up telemetry should never hide the main report. */}
  },[interventionEndpoint]);
  const openAcademicReview=async(topic:any)=>{
    if(!interventionEndpoint||reviewPending)return;
    const topicKey=[topic.examType,topic.subject,topic.topic].join('|');
    const decisionReason=(reviewReasons[topicKey]||'').trim();
    if(decisionReason.length<15)return;
    setReviewPending(topicKey);setReviewMessage('');
    try{
      const response=await fetch(interventionEndpoint,{
        method:'POST',headers:{'content-type':'application/json'},
        body:JSON.stringify({
          action:'REQUEST_RECHECK',examType:topic.examType,
          subject:topic.subject,topic:topic.topic,decisionReason
        })
      });
      const result=await response.json();
      if(!response.ok)throw new Error(result.error||'İnceleme kaydedilemedi.');
      setReviewMessage(result.message||'Koç incelemesi oluşturuldu.');
      await loadInterventions();
    }catch(e){
      setReviewMessage('Hata: '+(e instanceof Error?e.message:'İnceleme açılamadı.'));
    }finally{setReviewPending('');}
  };
  const load=useCallback(async()=>{
    setLoading(true);setError('');
    try{
      const response=await fetch(endpoint,{cache:'no-store'});
      const payload=await response.json();
      if(!response.ok)throw new Error(payload.error||'Akademik performans raporu alınamadı.');
      setReport(payload.report||null);
      await loadInterventions();
    }catch(e){setError(e instanceof Error?e.message:'Performans raporu yüklenemedi.');}
    finally{setLoading(false);}
  },[endpoint,loadInterventions]);
  useEffect(()=>{void load();},[load]);
  useEffect(()=>{
    const handler=()=>{void load();};
    window.addEventListener('keks:practice-saved',handler);
    return ()=>window.removeEventListener('keks:practice-saved',handler);
  },[load]);
  const examOptions=useMemo(()=>{
    const rows=[...(report?.subjects||[]),...(report?.topics||[]),...(report?.formalExamTopics||[])];
    return [...new Set<string>(rows.map((x:any)=>x.examType).filter((v:any)=>typeof v==='string'))].sort();
  },[report]);
  const matches=(x:any)=>examFilter==='ALL'||x.examType===examFilter;
  const subjects=(report?.subjects||[]).filter(matches);
  const topics=(report?.topics||[]).filter(matches);
  const formal=(report?.formalExamTopics||[]).filter(matches);
  const recommendations=(report?.recommendations||[]).filter(matches);
  const errorReasons=(report?.errorReasons||[]).filter(matches);
  const weeklyEvidence=(report?.weeklyEvidence||[]).filter(matches);
  const topicConcordance=(report?.topicConcordance||[]).filter(matches);
  const visibleFollowUps=crossSourceFollowUps.filter(matches);
  const isCoach=audience==='COACH';
  return <div className="stack">
    <section className="card">
      <div className="moduleHeaderRow">
        <div>
          <div className="moduleEyebrow">KEKS AKADEMİ · AKADEMİK PERFORMANS MERKEZİ</div>
          <h2>Hangi ders gelişiyor, nerede yeni ölçüm gerekiyor?</h2>
          <p className="muted">Doğru, yanlış, boş, soru ritmi ve konu eğilimleri birlikte yorumlanır. Kesin öğrenme veya nedensellik iddiası üretilmez.</p>
        </div>
        <button className="btn" type="button" onClick={()=>void load()} disabled={loading}>
          {loading?'Güncelleniyor…':'Veriyi Yenile'}
        </button>
      </div>
      {error&&<p className="notice error" role="alert">{error}</p>}
      {!report&&loading&&<p className="muted">Son 35 günlük çalışmalar analiz ediliyor…</p>}
      {report&&<>
        <div className="row" style={{gap:10,flexWrap:'wrap',alignItems:'center'}}>
          <span className="pill">{report.windowDays} günlük pencere</span>
          <span className="pill">{report.overview.days} çalışma günü</span>
          <span className="pill">{report.overview.questions} soru</span>
          <span className="pill">{report.subjects.length} ders analizi</span>
        </div>
        <p className="muted"><strong>Tüm sınav ve programların toplam soru kaydı</strong> — aşağıdaki filtre ders, konu ve deneme ayrıntılarını değiştirir.</p>
        <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))'}}>
          {[
            ['Doğru',report.overview.correct],
            ['Yanlış',report.overview.wrong],
            ['Boş',report.overview.blank],
            ['Doğruluk',percent(report.overview.accuracy)],
            ['Boş oranı',percent(report.overview.blankRate)]
          ].map(([title,value])=><div className="notice" key={String(title)}>
            <strong>{String(value)}</strong><p className="muted">{String(title)}</p>
          </div>)}
        </div>
        <p className="muted">
          Öğrenci görev teslimlerinden gelen: {report.overview.reportedQuestions} soru;
          diğer çalışma kayıtları: {report.overview.otherPracticeQuestions} soru.
          Diğer kayıtlar otomatik olarak bağımsız doğrulanmış ölçüm anlamına gelmez.
        </p>
        {report.limited&&<div className="notice"><strong>Eksik veri uyarısı:</strong> {report.limitationNote}</div>}
        <div className="field" style={{maxWidth:320}}>
          <label htmlFor={isCoach?'coach-academic-exam':'student-academic-exam'}>Sınav / program filtresi</label>
          <select id={isCoach?'coach-academic-exam':'student-academic-exam'} value={examFilter} onChange={e=>setExamFilter(e.target.value)}>
            <option value="ALL">Tüm sınav ve programlar</option>
            {examOptions.map(x=><option key={x} value={x}>{x}</option>)}
          </select>
        </div>
      </>}
    </section>
    {report&&<>
      <section className="card">
        <div className="moduleEyebrow">5 HAFTALIK ÇALIŞMA RİTMİ · GÖZLEMLENEN KAYITLAR</div>
        <h3>Soru hacmi, çalışma günü ve doğruluk birlikte</h3>
        <p className="muted">Her dönem yedi takvim günüdür (İstanbul saati). Soru sayısı azalınca bu tek başına başarısızlık; doğruluk yükselince de kesin öğrenme anlamına gelmez. Her hafta en az 12 soru ve iki ayrı çalışma günü, yalnızca tanımlayıcı değerlendirme için asgari eşiktir.</p>
        {weeklyEvidence.length===0
          ?<p className="muted">Seçilen program için son 35 günde haftalık soru kaydı bulunmuyor.</p>
          :<div className="stack">{weeklyEvidence.slice(0,6).map((series:any)=>{
            const maximum=Math.max(12,...series.weeks.map((x:any)=>x.questions));
            return <div className="notice" key={series.examType}>
              <strong>{series.examType} · Haftalık dağılım</strong>
              {series.weeks.map((week:any)=><div key={week.start} style={{marginTop:10}}>
                <div className="row" style={{justifyContent:'space-between',gap:10,flexWrap:'wrap'}}>
                  <small>{week.start} – {week.end}</small>
                  <small className="muted">{week.questions} soru · {week.studyDays} gün ·
                    {' '}doğruluk {percent(week.accuracy)}
                    {week.evidence==='MULTI_DAY'?' · Çok günlü kanıt':' · Veri sınırlı'}
                  </small>
                </div>
                <progress aria-label={series.examType+' '+week.start+' soru hacmi'} value={week.questions} max={maximum}
                  style={{width:'100%',height:9}}/>
              </div>)}
            </div>;
          })}</div>}
      </section>
      <section className="card">
        <div className="moduleEyebrow">DENEME – PRATİK KANIT KARŞILAŞTIRMASI</div>
        <h3>İki kaynağın aynı konu için anlattığı sonuç uyuşuyor mu?</h3>
        <p className="muted">Pratik ve deneme soru sonuçları ayrı sayılır. Karşılaştırma için pratikte en az 20 soru/2 gün, deneme analizinde en az 10 soru/2 farklı gün gerekir. Deneme analizi kaydı da bağımsız doğrulanmış bir sınav sonucu olmayabilir.</p>
        {report.sourceQuality?.contradictoryTopics>0&&<p className="notice">
          <strong>{report.sourceQuality.contradictoryTopics} konuda kaynaklar arasında belirgin doğruluk farkı var.</strong>
          {' '}Bu sonuç öğrenme eksikliği tanısı değil; koçun soru türü ve güçlük karşılaştırması yapması için inceleme sinyalidir.
        </p>}
        {topicConcordance.length===0
          ?<p className="muted">Bu sınav/program için karşılaştırılabilecek konu kaydı bulunmuyor.</p>
          :<div className="stack">{topicConcordance.slice(0,12).map((topic:any)=>
            <details className="notice" key={topic.examType+'|'+topic.subject+'|'+topic.topic}>
              <summary>
                <strong>{topic.examType} · {topic.subject} · {topic.topic}</strong>
                {' · '}{concordanceLabels[topic.status]||topic.status}
              </summary>
              <p>Pratik: <strong>{topic.practiceQuestions} soru / {topic.practiceDays} gün</strong>
                {' · '}Doğruluk {percent(topic.practiceAccuracy)}</p>
              <p>Deneme konu analizi: <strong>{topic.examQuestions} soru / {topic.examDays} gün</strong>
                {' · '}Doğruluk {percent(topic.examAccuracy)}</p>
              {topic.practiceReportedQuestions>0&&<p className="muted">
                Pratik kaydının {topic.practiceReportedQuestions} sorusu öğrenci görev tesliminden geliyor.
              </p>}
              {topic.accuracyGapPoints!=null&&<p><strong>Pratik − deneme farkı:</strong>
                {' '}{change(topic.accuracyGapPoints)}</p>}
              <p className="muted">{topic.explanation}</p>
              <p><strong>{isCoach?'Koçun değerlendirebileceği adım:':'Önerilen yeniden ölçüm:'}</strong>
                {' '}{topic.action}</p>
              {isCoach&&!report.limited&&['CONFLICTING','BOTH_NEED_SUPPORT'].includes(topic.status)
                &&topic.practiceQuestions>=20&&topic.practiceDays>=2
                &&topic.examQuestions>=10&&topic.examDays>=2&&
                <div style={{marginTop:12}}>
                  <label htmlFor={'review-reason-'+topic.examType+'-'+topic.subject+'-'+topic.topic}>
                    <strong>Koç inceleme gerekçesi</strong>
                  </label>
                  <textarea
                    id={'review-reason-'+topic.examType+'-'+topic.subject+'-'+topic.topic}
                    rows={2} maxLength={500}
                    placeholder="Konu ve soru türü farkını incelemek için gerekçenizi belirtin."
                    value={reviewReasons[[topic.examType,topic.subject,topic.topic].join('|')]||''}
                    onChange={e=>setReviewReasons(s=>({...s,
                      [[topic.examType,topic.subject,topic.topic].join('|')]:e.target.value}))}
                    disabled={Boolean(reviewPending)}
                  />
                  <button type="button" className="btn" disabled={Boolean(reviewPending)||
                    (reviewReasons[[topic.examType,topic.subject,topic.topic].join('|')]||'').trim().length<15}
                    onClick={()=>void openAcademicReview(topic)}>
                    {reviewPending===[topic.examType,topic.subject,topic.topic].join('|')
                      ?'Kaydediliyor…':'Koç İnceleme Kaydı Aç'}
                  </button>
                  <p className="muted">Bu işlem öğrenciye yeni görev atamaz; yalnızca koç takip listesine gerekçeli inceleme ekler.</p>
                </div>}
            </details>)}</div>}
        {report.sourceQuality&&(report.sourceQuality.excludedPractice>0||
          report.sourceQuality.excludedExams>0)&&<p className="muted">
          Haftalık ve çapraz kanıt analizinden dışlanan kayıtlar:
          {' '}pratik {report.sourceQuality.excludedPractice},
          {' '}deneme analizi {report.sourceQuality.excludedExams}.
        </p>}
      </section>
      {isCoach&&<section className="card">
        <div className="moduleEyebrow">AKADEMİK KANIT İNCELEMELERİ · ÖNCE / SONRA</div>
        <h3>Koçun açtığı konu kontrolleri ve ölçüm sinyalleri</h3>
        <p className="muted">Koç incelemesinin açıldığı gün sınır alınır: önceki 14 gün ile sonraki en fazla 21 gün karşılaştırılır. İnceleme kaydının açılması müdahalenin uygulandığı veya başarılı olduğu anlamına gelmez.</p>
        {reviewMessage&&<p className="notice" role="status">{reviewMessage}</p>}
        {followUpTruncated&&<p className="notice">Kayıt üst sınırına ulaşıldı; bazı eski veriler rapora girmemiş olabilir.</p>}
        {visibleFollowUps.length===0
          ?<p className="muted">Bu sınav için henüz koç tarafından açılmış akademik karşılaştırma incelemesi yok.</p>
          :<div className="stack">{visibleFollowUps.slice(0,12).map((x:any)=><details className="notice" key={x.taskId}>
            <summary><strong>{x.examType} · {x.subject} · {x.topic}</strong>
              {' · '}{x.state==='GAP_NARROWED'?'Kaynak farkı azaldı':x.state==='GAP_WIDENED'
                ?'Kaynak farkı büyüdü':x.state==='GAP_SIMILAR'
                  ?'Fark benzer kaldı':x.state==='WAITING_FOR_DATA'
                    ?'Yeni veri bekleniyor':'Ölçüm verisi yetersiz'}
            </summary>
            <p><strong>İnceleme tarihi:</strong> {new Date(x.openedAt).toLocaleDateString('tr-TR')}
              {' · '}<strong>Durum:</strong> {x.taskStatus}</p>
            <p><strong>Önce:</strong> Pratik {x.baseline.practice.questions} soru /
              {' '}{x.baseline.practice.days} gün ({percent(x.baseline.practice.accuracy)}),
              {' '}deneme {x.baseline.exam.questions} soru /
              {' '}{x.baseline.exam.days} gün ({percent(x.baseline.exam.accuracy)}).</p>
            <p><strong>Sonra:</strong> Pratik {x.followUp.practice.questions} soru /
              {' '}{x.followUp.practice.days} gün ({percent(x.followUp.practice.accuracy)}),
              {' '}deneme {x.followUp.exam.questions} soru /
              {' '}{x.followUp.exam.days} gün ({percent(x.followUp.exam.accuracy)}).</p>
            {x.absoluteGapChange!=null&&<p><strong>Kaynaklar arası mutlak fark değişimi:</strong>
              {' '}{change(x.absoluteGapChange)}</p>}
            <p className="muted">{x.note}</p>
            <p><strong>Sonraki ölçüm:</strong> {x.nextAction}</p>
          </details>)}</div>}
      </section>}
      <section className="card">
        <div className="moduleEyebrow">DERS BAZLI İLERLEME</div>
        <h3>Öncelik sırasına göre dersler</h3>
        {subjects.length===0?<p className="muted">Bu filtrede yeterli ders kaydı yok.</p>
          :<div className="stack">
            {subjects.slice(0,14).map((row:any)=><article className="notice" key={row.examType+'|'+row.subject}>
              <div className="row" style={{gap:10,justifyContent:'space-between',flexWrap:'wrap'}}>
                <strong>{row.examType} · {row.subject}</strong>
                <span className="pill">{priorityLabels[row.priority]||row.priority}</span>
              </div>
              <p><strong>{row.counts.questions} soru</strong> · Doğru {row.counts.correct}
                {' · '}Yanlış {row.counts.wrong} · Boş {row.counts.blank}
                {' · '}Doğruluk {percent(row.counts.accuracy)}
              </p>
              <div className="row" style={{gap:10,flexWrap:'wrap',alignItems:'center'}}>
                <span className="pill">{trendLabels[row.signal]||row.signal}</span>
                <span className="muted">Önceki hafta: {percent(row.previousSeven.accuracy)}
                  {' · '}Son hafta: {percent(row.recentSeven.accuracy)}
                  {' · '}Değişim: {change(row.accuracyDelta)}
                </span>
              </div>
              <p className="muted">{row.explanation}</p>
            </article>)}
          </div>}
      </section>
      <section className="card">
        <div className="moduleEyebrow">KONU BAZLI GÜVENİLİR ÖLÇÜM</div>
        <h3>Farklı günlerde toplanmış öğrenme sinyalleri</h3>
        <p className="muted">Öncelik, tek test sonucuna değil farklı günlerdeki kanıt miktarına göre belirlenir. Çok-günlü sinyaller bile kalıcılığı kesinleştirmez.</p>
        {topics.length===0?<p className="muted">Henüz konu bazında değerlendirilebilir soru kaydı yok.</p>
          :<div className="stack">{topics.slice(0,10).map((topic:any)=><details className="notice" key={topic.examType+'|'+topic.subject+'|'+topic.topic}>
            <summary><strong>{topic.examType} · {topic.subject} · {topic.topic}</strong>
              {' · '}{topicLabels[topic.signal]||topic.signal}
            </summary>
            <p>{topic.questions} soru, {topic.days} gün
              {' · '}Kanıt: {topic.confidence==='MULTI_DAY'?'Çok günlü':'Yetersiz'}</p>
            <p className="muted">{topic.reason}</p>
            {topic.changePoints!=null&&<p><strong>Önceki:</strong> {percent(topic.previousAccuracy)}
              {' · '}<strong>Sonraki:</strong> {percent(topic.recentAccuracy)}
              {' · '}<strong>Fark:</strong> {change(topic.changePoints)}</p>}
            <p><strong>{isCoach?'Koçun değerlendirebileceği adım:':'Önerilen çalışma:'}</strong> {topic.nextAction}</p>
          </details>)}</div>}
      </section>
      <section className="card">
        <div className="moduleEyebrow">YANLIŞ VE BOŞTAN ÖĞRENME</div>
        <h3>Yanlış nedeni kayıtları</h3>
        <p className="muted">Yanlış nedeni, tüm yanlış sorular için ayrı ayrı doğrulanmış değildir; kayıt bazlı bir açıklamadır.</p>
        {errorReasons.length
          ?<div className="stack">{errorReasons.map((x:any)=><div className="row" style={{gap:12,justifyContent:'space-between',flexWrap:'wrap'}} key={x.examType+'|'+x.code}>
            <strong>{x.examType} · {x.label}</strong>
            <span className="muted">{x.records} kayıt · Bu kayıtlarda {x.wrongQuestionsInRecords} yanlış</span>
          </div>)}</div>
          :<p className="muted">Yanlış nedeni içeren kayıt yok.</p>}
      </section>
      <section className="card">
        <div className="moduleEyebrow">DENEME SORU ANALİZİ · AYRI KANIT</div>
        <h3>Deneme türü ve konulara göre ölçüm</h3>
        <p className="muted">Deneme analizleri öğrenci soru günlüğüne eklenerek çifte sayılmaz. Deneme kaydı bulunmaması denemeye girilmediğinin kesin kanıtı değildir.</p>
        {formal.length
          ?formal.map((row:any)=><div className="notice" key={row.examType+'|'+row.subject+'|'+row.topic}>
            <strong>{row.examType} · {row.subject} · {row.topic}</strong>
            <p>{row.questions} soru · {row.recordCount} analiz kaydı
              {' · '}Doğruluk {percent(row.accuracy)} · Boş oranı {percent(row.blankRate)}</p>
          </div>)
          :<p className="muted">Seçilen sınav için son 35 günde konu ayrıntılı deneme analizi yok.</p>}
      </section>
      <section className="card">
        <div className="moduleEyebrow">AKILLI KOÇ · GEREKÇELİ ÖNCELİKLER</div>
        <h3>{isCoach?'Görüşmede ele alınacak dersler':'Bir sonraki çalışmada dikkat edilecekler'}</h3>
        {recommendations.length
          ?recommendations.map((x:any)=><div className="notice" key={x.examType+'|'+x.subject}>
            <strong>{x.examType} · {x.subject}</strong>
            <p>{x.suggestedAction}</p>
            <small className="muted">Dayanak: {x.reason}</small>
          </div>)
          :<p className="muted">Henüz öncelik belirlemek için yeterli ölçüm kaydı yok.</p>}
        <details>
          <summary>Analizin kapsamı ve veri sınırlılıkları</summary>
          <p className="muted">{report.limitations}</p>
          {report.overview.excludedPractice>0&&<p className="muted">
            Geçersiz veya tarih aralığı dışında kalan kayıtlar: {report.overview.excludedPractice}.
          </p>}
        </details>
      </section>
    </>}
  </div>;
}
