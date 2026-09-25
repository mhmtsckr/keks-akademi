import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { AccountLoginForm, CoachRegisterForm } from '@/app/components/AuthForms';
import { PortalSectionTitle, PortalShell } from '@/app/components/PortalShell';
import { CoachStudentTable } from '@/app/components/CoachStudentTable';
import { CoachCommandCenter } from '@/app/components/CoachCommandCenter';
import { CoachAccessCodeClaim } from '@/app/components/CoachAccessCodeClaim';
import { PanelNavigator } from '@/app/components/PanelNavigator';
import { isAgsOabtStudentRecord } from '@/lib/agsExamOptions';
import { getEffectiveOabtField } from '@/lib/oabtFieldApproval';
import { AccountSecurity } from '@/app/components/AccountSecurity';

export default async function CoachPage() {
  const user = await currentUser();

  if (!user || (user.role !== 'COACH' && user.role !== 'ADMIN') || !user.coachProfile) {
    return <PortalShell
      active="koc"
      eyebrow="KOÇ GİRİŞİ"
      title="Öğrencilerini tek merkezden yönet."
      description="Plan, deneme, hedef, içerik, teknik kullanımı ve koç uyarılarını aynı panelde takip et."
    >
      <section className="portalLoginGrid">
        <div className="portalLoginIntro">
          <span className="portalEyebrow">KOÇ KONTROL MERKEZİ</span>
          <h2>Veriyi gör, öğrenciyi yönlendir, gelişimi ölç.</h2>
          <p>KEKS koç paneli yalnız öğrenci listesi değildir; hedef açığını, çalışma davranışını ve müdahale gerektiren durumları tek ekranda toplar.</p>
          <div className="portalLoginBullets">
            <span>Eğitsel profil, ön görüşme ve öğrenci takip özeti</span>
            <span>Kişisel plan, performans, tekrar ve görüşme öncesi otomatik brifing</span>
            <span>Aylık gelişim, veli görünümü ve rol bazlı veri erişimi</span>
          </div>
        </div>
        <div className="stack">
          <div className="card"><h2>Koç Girişi</h2><p className="muted">Kendi koç hesabınızla giriş yapın.</p><AccountLoginForm/></div>
          <div className="card"><h2>Yeni Koç Hesabı</h2><p className="muted">Yeni hesaplar yönetici onayından sonra aktifleşir.</p><CoachRegisterForm/></div>
        </div>
      </section>
    </PortalShell>;
  }

  const now=new Date();
  const sevenDaysAgo=new Date(now.getTime()-7*24*60*60*1000);
  const sevenDaysAhead=new Date(now.getTime()+7*24*60*60*1000);
  const students = await db.student.findMany({
    where:{coachId:user.coachProfile.id},
    select:{
      id:true,fullName:true,studentCode:true,gradeLevel:true,academicTrack:true,profile:true,createdAt:true,
      coachAlerts:{where:{resolved:false},select:{severity:true,title:true}},
      coachingActions:{where:{status:'ACTIVE'},select:{periodEnd:true,title:true,currentValue:true,targetValue:true}},
      coachingSessions:{where:{startsAt:{gte:now,lte:sevenDaysAhead},status:'SCHEDULED'},select:{id:true,title:true,startsAt:true,endsAt:true,meetingUrl:true},orderBy:{startsAt:'asc'}},
      practiceLogs:{orderBy:{date:'desc'},take:1,select:{date:true}},
      dailyLogs:{orderBy:{date:'desc'},take:1,select:{date:true}},
      examResults:{orderBy:{createdAt:'desc'},take:1,select:{createdAt:true}},
      reviewQueue:{where:{status:{in:['DUE','PENDING']},dueAt:{lte:now}},select:{id:true}},
      plans:{where:{active:true},select:{id:true,title:true}},
      assessments:{orderBy:{completedAt:'desc'},take:1,select:{id:true,report:true}},
      preInterviewAttempts:{orderBy:{completedAt:'desc'},take:1,select:{id:true,reviewStatus:true}},
      weeklyReflections:{orderBy:{weekStart:'desc'},take:1,select:{id:true,weekStart:true}}
    },
    orderBy:{createdAt:'desc'}
  });
  const coachTasks=await db.coachTask.findMany({
    where:{coachId:user.coachProfile.id,status:{in:['OPEN','COMPLETED']}},
    include:{student:{select:{id:true,fullName:true}}},
    orderBy:[{status:'asc'},{dueAt:'asc'},{createdAt:'desc'}],
    take:80
  });
  const weeklyActions=await db.coachingAction.findMany({where:{studentId:{in:students.map(s=>s.id)},taskDate:{gte:sevenDaysAgo,lte:now}},select:{studentId:true,status:true,submission:{select:{id:true}}}});
  const priorityStudents=students.map(s=>{
    const overdue=s.coachingActions.filter(a=>a.periodEnd<now).length;
    const high=s.coachAlerts.filter(a=>a.severity==='HIGH').length;
    const medium=s.coachAlerts.filter(a=>a.severity==='MEDIUM').length;
    const lastDates=[
      s.practiceLogs[0]?.date,
      s.dailyLogs[0]?.date,
      s.examResults[0]?.createdAt
    ].filter(Boolean).map(x=>new Date(x as Date).getTime());
    const lastActivity=lastDates.length?new Date(Math.max(...lastDates)):null;
    const inactive=lastActivity?lastActivity<sevenDaysAgo:true;
    const dueReviews=s.reviewQueue.length;
    const week=weeklyActions.filter(a=>a.studentId===s.id);
    const completion=week.length?Math.round(week.filter(a=>a.submission||a.status==='COMPLETED').length/week.length*100):null;
    const examGap=s.examResults[0]?Math.floor((now.getTime()-s.examResults[0].createdAt.getTime())/86400000):null;
    const priorityScore=Math.min(100,high*30+medium*12+Math.min(overdue,3)*15+(inactive?20:0)+Math.min(dueReviews,10)*2);
    const reasons:string[]=[];
    if(high)reasons.push(high+' önemli takip sinyali');
    if(overdue)reasons.push(overdue+' geciken aksiyon');
    if(inactive)reasons.push('7+ gündür düşük aktivite');
    if(dueReviews)reasons.push(dueReviews+' yanlış tekrar');
    if(examGap===null)reasons.push('Henüz deneme kaydı yok');
    else if(examGap>=7)reasons.push(examGap+' gündür deneme girilmedi');
    if(completion!==null)reasons.push('Haftalık görev tamamlama %'+completion);
    const suggestedAction=inactive||dueReviews>=3||completion!==null&&completion<50?'15 dakikalık takip görüşmesi':examGap===null||examGap>=7?'Deneme tarihi ve yanlış analizini planla':'Haftalık ilerlemeyi gözden geçir';
    return {
      id:s.id,fullName:s.fullName,studentCode:s.studentCode,gradeLevel:s.gradeLevel,
      academicTrack:isAgsOabtStudentRecord({gradeLevel:s.gradeLevel,academicTrack:s.academicTrack,profile:s.profile})
        ?getEffectiveOabtField(s.academicTrack,s.profile)
        :s.academicTrack,
      priorityScore,priorityLevel:(priorityScore>=50?'HIGH':priorityScore>=20?'MEDIUM':'LOW') as 'HIGH'|'MEDIUM'|'LOW',
      reasons,suggestedAction,overdueActions:overdue,openAlerts:s.coachAlerts.length,dueReviews,
      activePlans:s.plans.length,
      profileReady:Boolean(s.assessments[0]&&s.preInterviewAttempts[0]),
      screeningReady:Boolean(s.assessments[0]),
      preInterviewReady:Boolean(s.preInterviewAttempts[0]),
      monthlyDevelopmentReady:Boolean(s.weeklyReflections[0]),
      hasExamData:Boolean(s.examResults[0]),
      lastActivity:lastActivity?lastActivity.toISOString():null
    };
  }).sort((a,b)=>b.priorityScore-a.priorityScore);
  const agenda=students.flatMap(s=>s.coachingSessions.map(x=>({
    id:x.id,studentId:s.id,studentName:s.fullName,title:x.title,
    startsAt:x.startsAt.toISOString(),endsAt:x.endsAt.toISOString(),meetingUrl:x.meetingUrl
  }))).sort((a,b)=>a.startsAt.localeCompare(b.startsAt));

  return <PortalShell signedIn
    active="koc"
    eyebrow="KOÇ PANELİ"
    title={'Koç Kontrol Merkezi · '+user.name}
    description="Öğrencilerini, çalışma planlarını ve gelişim verilerini tek merkezden yönet."
    meta={<><span>{students.length} öğrenci</span><span>Kişisel takip</span><span>Akıllı uyarılar</span></>}
    wide
  >
    <section className="section">
      <PanelNavigator roleLabel="Koç" groups={[
        {label:'KOÇ KOMUTA & ÖNCELİKLER',description:'Bugün müdahale edilmesi gereken öğrenci ve görevleri gör.',items:[
          {href:'#koc-komuta',title:'Koç Komuta Merkezi',description:'Takip sinyalleri, seanslar ve geciken aksiyonlar',badge:'BUGÜN'}
        ]},
        {label:'ÖĞRENCİ ERİŞİMİ',description:'Yeni öğrenciyi güvenli biçimde koç hesabına bağla.',items:[
          {href:'#ogrenci-erisim',title:'Erişim Kodu',description:'Öğrencinin tek kullanımlık koç kodunu doğrula'}
        ]},
        {label:'HESAP & GÜVENLİK',description:'Koç hesabınızın şifresini ve aktif oturumlarını yönetin.',items:[
          {href:'#hesap-guvenligi',title:'Hesap Güvenliği',description:'Şifre, oturumlar ve tüm cihazlardan çıkış'}
        ]},
        {label:'ÖĞRENCİ YÖNETİMİ',description:'Tüm öğrencilerin durumunu karşılaştır ve detay ekranına geç.',items:[
          {href:'#ogrencilerim',title:'Öğrencilerim',description:'Öncelik, tekrar, plan ve aktivite durumunu birlikte gör'}
        ]}
      ]}/>
    </section>

    <section id="koc-komuta" className="section section-anchor">
      <PortalSectionTitle eyebrow="KOÇ KOMUTA MERKEZİ" title="Bugün neye müdahale etmeliyim?" description="Seanslar, takip sinyalleri, geciken aksiyonlar ve kişisel takip görevleriniz tek ekranda."/>
      <CoachCommandCenter
        students={priorityStudents}
        agenda={agenda}
        initialTasks={coachTasks.map(t=>({id:t.id,title:t.title,description:t.description,priority:t.priority,status:t.status,dueAt:t.dueAt?.toISOString()||null,student:t.student}))}
      />
    </section>

    <section id="ogrenci-erisim" className="section section-anchor">
      <PortalSectionTitle eyebrow="ÖĞRENCİ ERİŞİMİ" title="Testini tamamlayan öğrenciyi koç paneline tanımla" description="Öğrencinin test sonunda aldığı tek kullanımlık KOC erişim kodunu girerek öğrenci bağlantısını doğrulayın."/>
      <CoachAccessCodeClaim/>
    </section>

    <section id="ogrencilerim" className="section section-anchor">
      <PortalSectionTitle eyebrow="ÖĞRENCİ YÖNETİMİ" title="Öğrencilerim" description="Bir öğrencinin adına dokunarak detaylı koç çalışma alanını açabilirsiniz."/>
      <div className="grid">
        <div className="card">
          <h2>Öğrenciler ({students.length})</h2>
          <CoachStudentTable students={priorityStudents}/>
        </div>
      </div>
    </section>

    <section id="hesap-guvenligi" className="section section-anchor"><PortalSectionTitle eyebrow="HESAP & GÜVENLİK" title="Koç Hesap Güvenliği" description="Şifrenizi, son girişlerinizi ve aktif oturumlarınızı yönetin."/><AccountSecurity loginPath="/koc"/></section>

    {user.role==='ADMIN'&&<section className="section"><div className="card"><h2>Yönetici erişimi</h2><p className="muted">Bu hesap aynı zamanda yönetici yetkisine sahip.</p><a className="btn primary" href="/yonetici">Yönetici Paneline Git</a></div></section>}
  </PortalShell>;
}
