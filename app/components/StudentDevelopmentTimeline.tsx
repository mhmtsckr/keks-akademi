import {buildStudentDevelopmentTimeline,TimelineAudience,TimelineKind} from '@/lib/studentDevelopmentTimeline';

const ICONS:Record<TimelineKind,string>={
  REGISTRATION:'●',
  ASSESSMENT:'◎',
  PLAN:'▤',
  EXAM:'↗',
  TARGET:'◆',
  SESSION:'◉'
};

function dateLabel(date:Date){
  return date.toLocaleDateString('tr-TR',{timeZone:'Europe/Istanbul',day:'2-digit',month:'short',year:'numeric'});
}

export async function StudentDevelopmentTimeline({
  studentId,
  audience='STUDENT',
  compact=false
}:{studentId:string;audience?:TimelineAudience;compact?:boolean}){
  const data=await buildStudentDevelopmentTimeline(studentId,audience);
  if(!data)return null;

  return <div className={'card studentDevelopmentTimeline '+(compact?'compact':'')}>
    <div className="moduleHeaderRow">
      <div>
        <div className="moduleEyebrow">1 YILLIK GELİŞİM ZAMAN ÇİZELGESİ</div>
        <h2>KEKS yolculuğu</h2>
        <p className="muted">Kayıt, değerlendirme, plan, denemeler, hedef değişimleri ve koç görüşmeleri aynı kronolojik akışta.</p>
      </div>
      <span className="pill">{data.events.length} dönüm noktası</span>
    </div>

    <div className="timelineSummaryGrid">
      <div><b>{data.summary.examCount}</b><span>Deneme</span></div>
      <div><b>{data.summary.sessionCount}</b><span>Koç görüşmesi</span></div>
      <div><b>{data.summary.planCount}</b><span>Plan</span></div>
      <div><b>{data.summary.targetCount}</b><span>Hedef</span></div>
      {data.summary.netChange!=null&&<div className={data.summary.netChange>0?'positive':''}><b>{data.summary.netChange>0?'+':''}{data.summary.netChange}</b><span>Yıllık net değişimi</span></div>}
    </div>

    {data.events.length===0
      ?<p className="muted">Henüz zaman çizelgesine eklenecek gelişim kaydı bulunmuyor.</p>
      :<ol className="developmentTimelineList">
        {data.events.map(event=><li className={'developmentTimelineItem '+(event.positive?'positive':'')} key={event.id}>
          <div className="developmentTimelineRail"><span>{ICONS[event.kind]}</span></div>
          <div className="developmentTimelineBody">
            <div className="developmentTimelineTop">
              <div>
                <small>{dateLabel(event.date)}</small>
                <strong>{event.title}</strong>
              </div>
              {event.badge&&<span className="pill">{event.badge}</span>}
            </div>
            <p>{event.detail}</p>
          </div>
        </li>)}
      </ol>}
  </div>;
}
