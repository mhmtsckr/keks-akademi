import {buildMonthlyDevelopmentReport,MonthlyReportAudience} from '@/lib/monthlyDevelopmentReport';

function signed(v:number|null|undefined,suffix=''){
  if(v==null)return '—';
  return (v>0?'+':'')+v+suffix;
}
function metric(v:number|null|undefined,suffix=''){
  return v==null?'—':v+suffix;
}

export async function MonthlyDevelopmentReport({
  studentId,
  audience='COACH',
  printable=false
}:{studentId:string;audience?:MonthlyReportAudience;printable?:boolean}){
  const report=await buildMonthlyDevelopmentReport(studentId,audience);
  if(!report)return null;

  return <div className={'monthlyDevelopmentReport '+(printable?'printable':'')}>
    <div className="card">
      <div className="moduleHeaderRow">
        <div>
          <div className="moduleEyebrow">KEKS GELİŞİM RAPORU · CANLI</div>
          <h2>{report.period.label}</h2>
          <p className="muted">Akademik gelişim, çalışma davranışı, tekrar ve süreklilik verileri sisteme yeni kayıt geldikçe otomatik güncellenir.</p>
        </div>
        <div className="row">
          <span className="pill">Veri düzeyi: {report.confidence}</span>
          {!printable&&<a className="btn no-print" href={'/rapor/aylik/'+studentId}>PDF Dışa Aktar</a>}
        </div>
      </div>

      <div className="monthlyReportHero">
        <div><span>Öğrenci</span><strong>{report.student.name}</strong></div>
        <div><span>Hedef</span><strong>{report.student.target||report.student.goal||'Tanımlanmadı'}</strong></div>
        <div><span>Koç görüşmesi</span><strong>{report.coaching.completedSessions}</strong></div>
      </div>
    </div>

    <section className="monthlyReportSection">
      <div className="moduleEyebrow">AKADEMİK GELİŞİM</div>
      <div className="monthlyReportMetrics">
        <div className="card"><b>{report.academic.examCount}</b><span>Bu ay deneme</span>{report.academic.examDelta!=null&&<small>{signed(report.academic.examDelta,' net')} önceki aya göre</small>}</div>
        {audience!=='PARENT'&&<div className="card"><b>{metric(report.academic.examAverage)}</b><span>Deneme ortalaması</span></div>}
        <div className="card"><b>{report.academic.practiceQuestions}</b><span>Soru çözüm kaydı</span></div>
        <div className="card"><b>{metric(report.academic.accuracy,'%')}</b><span>Soru doğruluğu</span>{report.academic.accuracyDelta!=null&&<small>{signed(report.academic.accuracyDelta,' puan')}</small>}</div>
        <div className="card"><b>{report.academic.completedTopics}</b><span>Tamamlanan konu</span></div>
      </div>
    </section>

    <section className="monthlyReportSection">
      <div className="moduleEyebrow">ÇALIŞMA DAVRANIŞI & SÜREKLİLİK</div>
      <div className="monthlyReportMetrics">
        <div className="card"><b>%{report.behavior.taskCompletion}</b><span>Görev tamamlama</span><small>{signed(report.behavior.taskCompletionDelta,' puan')}</small></div>
        <div className="card"><b>{report.behavior.focusMinutes} dk</b><span>Kayıtlı odak süresi</span><small>{signed(report.behavior.focusDelta,' dk')}</small></div>
        <div className="card"><b>{report.behavior.activeDays}</b><span>Aktif çalışma günü</span><small>{signed(report.behavior.activeDaysDelta,' gün')}</small></div>
        <div className="card"><b>{metric(report.behavior.selfRating,'/5')}</b><span>Öz değerlendirme</span></div>
        <div className="card"><b>{metric(report.behavior.planRealism,'/5')}</b><span>Plan gerçekçiliği</span></div>
      </div>
    </section>

    <section className="monthlyReportSection">
      <div className="moduleEyebrow">TEKRAR SİSTEMİ</div>
      <div className="monthlyReportMetrics">
        <div className="card"><b>{report.review.completed}</b><span>Tamamlanan tekrar</span></div>
        <div className="card"><b>{metric(report.review.success,'%')}</b><span>Tekrar başarısı</span>{report.review.successDelta!=null&&<small>{signed(report.review.successDelta,' puan')}</small>}</div>
        <div className={'card '+(report.review.overdue>=3?'monthlyReportWarning':'')}><b>{report.review.overdue}</b><span>Gecikmiş tekrar</span></div>
      </div>
    </section>

    <div className="monthlyReportTwoColumn">
      <section className="card">
        <div className="moduleEyebrow">GÜÇLÜ GELİŞEN ALANLAR</div>
        <h3>Bu ay belirgin olumlu değişim</h3>
        {report.strongAreas.length===0
          ?<p className="muted">Güçlü gelişim sonucu vermek için henüz yeterli karşılaştırmalı veri yok.</p>
          :<div className="monthlyReportList">{report.strongAreas.map((x,i)=><div key={i}><strong>{x.title}</strong><p>{x.detail}</p></div>)}</div>}
      </section>

      <section className="card">
        <div className="moduleEyebrow">MÜDAHALE GEREKEN ALANLAR</div>
        <h3>Koçluk ve çalışma öncelikleri</h3>
        {report.interventionAreas.length===0
          ?<p className="muted">Bu ay belirgin bir müdahale sinyali oluşmadı. Mevcut ritim izlenmeye devam edilebilir.</p>
          :<div className="monthlyReportList">{report.interventionAreas.map((x,i)=><div key={i}><strong>{x.title}</strong><p>{x.detail}</p></div>)}</div>}
      </section>
    </div>

    <section className="card monthlyNextGoals">
      <div className="moduleEyebrow">GELECEK AYIN 3 ANA HEDEFİ</div>
      <h3>Veriye dayalı aylık müdahale planı</h3>
      <ol>{report.nextMonthGoals.map((goal,i)=><li key={i}><span>{i+1}</span><strong>{goal}</strong></li>)}</ol>
    </section>

    <div className="notice">
      <strong>Rapor mantığı:</strong> Bu ekran sabit bir PDF değildir. KEKS'e yeni deneme, görev, tekrar, çalışma süresi veya öz değerlendirme kaydı geldikçe canlı rapor yeniden hesaplanır. PDF, bu canlı görünümün dışa aktarılan anlık sürümüdür.
    </div>
  </div>;
}
