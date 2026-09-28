import { db } from '@/lib/db';
import { summarizeCoachStudentAlignment } from '@/lib/coachStudentAlignment';

export async function CoachStudentAlignmentSignals({studentId}:{studentId:string}) {
  const now = new Date();
  const from = new Date(now.getTime() - 28 * 86400000);

  const [actions, sessions, reflections] = await Promise.all([
    db.coachingAction.findMany({
      where: {
        studentId,
        createdAt: { gte: from },
        periodEnd: { lte: now },
        OR: [
          { planSource: 'COACH' },
          { sessionId: { not: null } }
        ]
      },
      select: {
        status: true,
        submission: { select: { id: true } }
      }
    }),
    db.coachingSession.findMany({
      where: {
        studentId,
        startsAt: { gte: from, lte: now },
        status: { not: 'CANCELED' }
      },
      select: { status: true, completedAt: true }
    }),
    db.weeklyReflection.findMany({
      where: { studentId, weekStart: { gte: from } },
      orderBy: { weekStart: 'desc' },
      take: 4,
      select: { planRealistic: true }
    })
  ]);

  const summary = summarizeCoachStudentAlignment({
    assignedTasks: actions.length,
    completedTasks: actions.filter(x => x.submission || x.status === 'COMPLETED').length,
    expectedSessions: sessions.length,
    completedSessions: sessions.filter(x => x.status === 'COMPLETED' || x.completedAt).length,
    planRatings: reflections
      .map(x => x.planRealistic)
      .filter((x): x is number => typeof x === 'number')
  });

  return <div className="card">
    <div className="moduleHeaderRow">
      <div>
        <div className="moduleEyebrow">SON 28 GÜN · ÖĞRENCİ–KOÇ ÇALIŞMA UYUMU</div>
        <h2>Puan değil, uygulanabilir sinyaller</h2>
        <p className="muted">Koç önerilerinin uygulanması, görüşme devamlılığı ve planın öğrenci açısından sürdürülebilirliği ayrı ayrı izlenir.</p>
      </div>
      <span className="pill">SOMUT VERİ</span>
    </div>

    <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))'}}>
      <div className="card" style={{margin:0}}>
        <div className="moduleEyebrow">KOÇ GÖREVLERİNİN UYGULANMASI</div>
        {summary.tasks.assigned === 0
          ? <p className="muted">Son 28 günde süresi dolmuş koç görevi yok.</p>
          : <>
              <div className="kpi">{summary.tasks.completed}/{summary.tasks.assigned}</div>
              <p>Tamamlanan koç görevi</p>
              <p className="muted">%{summary.tasks.applicationRate} uygulandı · {summary.tasks.unfinished} görev tamamlanmadı.</p>
            </>}
      </div>

      <div className="card" style={{margin:0}}>
        <div className="moduleEyebrow">GÖRÜŞME DEVAMLILIĞI</div>
        {summary.sessions.expected === 0
          ? <p className="muted">Son 28 günde gerçekleşmesi beklenen görüşme kaydı yok.</p>
          : <>
              <div className="kpi">{summary.sessions.completed}/{summary.sessions.expected}</div>
              <p>Tamamlanan görüşme</p>
              <p className="muted">{summary.sessions.incomplete === 0
                ? 'Planlanan görüşmelerin tamamı tamamlandı.'
                : summary.sessions.incomplete + ' görüşme tamamlanmış görünmüyor.'}</p>
            </>}
      </div>

      <div className="card" style={{margin:0}}>
        <div className="moduleEyebrow">PLAN UYUMU</div>
        {summary.plan.answeredWeeks === 0
          ? <p className="muted">Henüz plan gerçekçiliği öz değerlendirmesi yok.</p>
          : <>
              <div className="kpi">{summary.plan.realisticWeeks}/{summary.plan.answeredWeeks}</div>
              <p>Hafta planı 4–5/5 gerçekçi bulundu</p>
              <p className="muted">{summary.plan.partialWeeks} hafta kısmen gerçekçi · {summary.plan.difficultWeeks} hafta gerçekçi bulunmadı.</p>
            </>}
      </div>
    </div>

    <div className="notice" style={{marginTop:14}}>
      <strong>Koç için yorumlama ilkesi:</strong> Bu üç sinyal tek bir “uyum puanı”na çevrilmez. Düşük görev uygulaması; planın ağır olması, öğrencinin kapasitesi, görev niteliği veya takip eksikliği gibi farklı nedenlerden kaynaklanabilir. Görüşmede neden ayrıca değerlendirilmelidir.
    </div>
  </div>;
}
