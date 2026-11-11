'use client';

import {useCallback,useEffect,useMemo,useState} from 'react';

const priorityLabels:Record<string,string>={
  REVIEW:'Öncelikli inceleme',MONITOR:'İzle',COLLECT_EVIDENCE:'Ek ölçüm gerekli',MAINTAIN:'Koruma çalışması'
};
const trendLabels:Record<string,string>={
  MEASURE_MORE:'Karşılaştırma verisi yetersiz',
  IMPROVING:'Olumlu eğilim',DECLINING:'Düşüş eğilimi',STEADY:'Sınırlı değişim'
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
  const endpoint=audience==='COACH'
    ?'/api/coach/students/'+encodeURIComponent(studentId||'')+'/academic-performance'
    :'/api/student/academic-performance';
  const load=useCallback(async()=>{
    setLoading(true);setError('');
    try{
      const response=await fetch(endpoint,{cache:'no-store'});
      const payload=await response.json();
      if(!response.ok)throw new Error(payload.error||'Akademik performans raporu alınamadı.');
      setReport(payload.report||null);
    }catch(e){setError(e instanceof Error?e.message:'Performans raporu yüklenemedi.');}
    finally{setLoading(false);}
  },[endpoint]);
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
