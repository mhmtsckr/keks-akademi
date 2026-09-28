import {db} from '@/lib/db';
import {buildCoachCohorts} from '@/lib/coachCohortAnalytics';

function accuracy(rows:{total:number;correct:number}[]){
  const total=rows.reduce((n,x)=>n+x.total,0);
  return total?Math.round(rows.reduce((n,x)=>n+x.correct,0)/total*100):null;
}

function completion(rows:{status:string;submission:{id:string}|null}[]){
  return rows.length?Math.round(rows.filter(x=>x.status==='COMPLETED'||x.submission).length/rows.length*100):null;
}

export async function CoachCohortAnalytics({coachId}:{coachId:string}){
  const now=new Date();
  const sevenDaysAgo=new Date(now.getTime()-7*86400000);
  const fourteenDaysAgo=new Date(now.getTime()-14*86400000);
  const weekStart=new Date(now);
  weekStart.setDate(now.getDate()-((now.getDay()+6)%7));
  weekStart.setHours(0,0,0,0);
  const weekEnd=new Date(weekStart.getTime()+7*86400000);

  const students=await db.student.findMany({
    where:{coachId},
    take:50,
    orderBy:{createdAt:'desc'},
    select:{
      id:true,fullName:true,studentCode:true,
      reviewQueue:{where:{status:{in:['DUE','PENDING']},dueAt:{lte:now}},select:{id:true}},
      practiceLogs:{where:{date:{gte:fourteenDaysAgo}},select:{date:true,total:true,correct:true}},
      coachingActions:{where:{taskDate:{gte:fourteenDaysAgo,lte:now}},select:{taskDate:true,status:true,submission:{select:{id:true,submittedAt:true}}}},
      dailyLogs:{orderBy:{date:'desc'},take:1,select:{date:true}},
      examResults:{orderBy:{createdAt:'desc'},take:1,select:{createdAt:true}},
      techniqueSessions:{orderBy:{createdAt:'desc'},take:1,select:{createdAt:true}},
      coachingSessions:{where:{startsAt:{gte:weekStart,lt:weekEnd},status:{not:'CANCELED'}},select:{status:true,completedAt:true,startsAt:true}}
    }
  });

  const inputs=students.map(s=>{
    const currentPractice=s.practiceLogs.filter(x=>x.date>=sevenDaysAgo);
    const previousPractice=s.practiceLogs.filter(x=>x.date<sevenDaysAgo);
    const currentActions=s.coachingActions.filter(x=>x.taskDate&&x.taskDate>=sevenDaysAgo);
    const previousActions=s.coachingActions.filter(x=>x.taskDate&&x.taskDate<sevenDaysAgo);
    const dates=[
      ...s.practiceLogs.map(x=>x.date),
      ...s.coachingActions.flatMap(x=>x.submission?[x.submission.submittedAt]:[]),
      s.dailyLogs[0]?.date,
      s.examResults[0]?.createdAt,
      s.techniqueSessions[0]?.createdAt
    ].filter(Boolean).map(x=>new Date(x as Date).getTime());
    return {
      id:s.id,
      fullName:s.fullName,
      studentCode:s.studentCode,
      overdueReviews:s.reviewQueue.length,
      currentAccuracy:accuracy(currentPractice),
      previousAccuracy:accuracy(previousPractice),
      currentQuestions:currentPractice.reduce((n,x)=>n+x.total,0),
      previousQuestions:previousPractice.reduce((n,x)=>n+x.total,0),
      currentTaskCompletion:completion(currentActions),
      previousTaskCompletion:completion(previousActions),
      lastActivityAt:dates.length?new Date(Math.max(...dates)).toISOString():null,
      completedOrScheduledSessionThisWeek:s.coachingSessions.some(x=>x.status==='COMPLETED'||Boolean(x.completedAt)||x.startsAt>=now)
    };
  });

  const cohorts=buildCoachCohorts(inputs,now);

  return <div className="card">
    <div className="moduleHeaderRow">
      <div>
        <div className="moduleEyebrow">KOHORT & GRUP ANALİTİĞİ</div>
        <h2>Öğrenci grubunda nerede aksiyon gerekiyor?</h2>
        <p className="muted">Kümeler somut davranış ve performans sinyallerinden oluşur. Tek bir risk ya da başarı puanı kullanılmaz.</p>
      </div>
      <span className="pill">{students.length} öğrenci</span>
    </div>

    <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))'}}>
      <CohortBlock title="EN FAZLA TEKRAR GECİKTİRENLER" empty="Gecikmiş tekrarı olan öğrenci yok." rows={cohorts.repeatDelayers.slice(0,8)}/>
      <CohortBlock title="EN HIZLI GELİŞENLER" empty="Yeterli iki haftalık veride +5 puan doğruluk artışı gösteren öğrenci yok." rows={cohorts.fastestImproving.slice(0,8)}/>
      <CohortBlock title="7 GÜNDÜR AKTİVİTE GİRMEYENLER" empty="Son 7 günde tamamen sessiz öğrenci yok." rows={cohorts.inactive.slice(0,8)}/>
      <CohortBlock title="BU HAFTA GÖRÜŞME YAPILMASI GEREKENLER" empty="Mevcut kurallara göre ek görüşme ihtiyacı görünmüyor." rows={cohorts.meetingNeeded.slice(0,8)}/>
    </div>

    <div className="notice" style={{marginTop:14}}>
      <strong>Görüşme ihtiyacı kuralı:</strong> 7+ gün aktivite yokluğu, 3+ gecikmiş tekrar, haftalık görev tamamlama %50 altı veya doğrulukta en az 8 puan gerileme varsa ve bu hafta tamamlanmış/planlanmış görüşme yoksa öğrenci bu kümeye alınır.
    </div>
  </div>;
}

function CohortBlock({title,rows,empty}:{title:string;rows:any[];empty:string}){
  return <div className="card" style={{margin:0}}>
    <div className="moduleEyebrow">{title}</div>
    {rows.length===0?<p className="muted">{empty}</p>:rows.map((x:any)=>
      <a href={'/koc/ogrenci/'+x.id} key={x.id} style={{display:'block',padding:'10px 0',borderBottom:'1px solid var(--line)'}}>
        <strong>{x.fullName}</strong>
        <div className="muted">Kod: {x.studentCode}</div>
        <small>{x.signal}</small>
      </a>
    )}
  </div>;
}
