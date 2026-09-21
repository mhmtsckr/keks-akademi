import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { StudentLoginForm, StudentRegisterForm } from '@/app/components/AuthForms';
import { StudentActions } from '@/app/components/StudentActions';
import { StudentProgressTools } from '@/app/components/StudentProgressTools';
import { AdaptiveRecommendation } from '@/app/components/AdaptiveRecommendation';
import { SmartCoachDashboard } from '@/app/components/SmartCoachDashboard';
import { ContentStudio } from '@/app/components/ContentStudio';
import { StudyTechniqueLab } from '@/app/components/StudyTechniqueLab';
import { PortalSectionTitle, PortalShell } from '@/app/components/PortalShell';
import { turkeyMonthWindow } from '@/lib/monthlyAccess';
import { StudentEngagementHub } from '@/app/components/StudentEngagementHub';
import { StudentDailyTasks } from '@/app/components/StudentDailyTasks';
import { StudentPreInterview } from '@/app/components/StudentPreInterview';
import { StudentCommandCenter } from '@/app/components/StudentCommandCenter';

function pretty(v: unknown) {
  if (!v) return '';
  if (typeof v === 'string') return v;
  try { return JSON.stringify(v); } catch { return String(v); }
}

export default async function StudentPage() {
  const user = await currentUser();

  if (!user || user.role !== 'STUDENT' || !user.student) {
    return <PortalShell
      active="ogrenci"
      eyebrow="ÖĞRENCİ GİRİŞİ"
      title="Kendi öğrenme yolculuğuna giriş yap."
      description="Programların, hedeflerin, testlerin, tekrarların ve çalışma tekniklerin tek bir panelde."
    >
      <section className="portalLoginGrid">
        <div className="portalLoginIntro">
          <span className="portalEyebrow">KEKS ÖĞRENCİ DENEYİMİ</span>
          <h2>Planını gör, çalışmanı uygula, gelişimini takip et.</h2>
          <p>Koçunun oluşturduğu programları takip et; Pomodoro ve diğer teknikleri doğrudan uygula, konu bazlı test çöz ve hedefe yaklaşma durumunu gör.</p>
          <div className="portalLoginBullets">
            <span>Akıllı haftalık program ve hedef takibi</span>
            <span>Gerçek aktif süre ölçümü</span>
            <span>Konu, deneme ve yanlış soru tekrar sistemi</span>
          </div>
        </div>
        <div className="stack">
          <div className="card"><h2>Öğrenci Girişi</h2><p className="muted">Öğrenci kodu ve özel giriş anahtarıyla giriş yapabilirsiniz.</p><StudentLoginForm/></div>
          <div className="card"><h2>Öğrenci Başvurusu</h2><p className="muted">Bilgilerinizi girin, aktif koçlardan birini seçin. Başvurunuz tamamlanınca öğrenci kodunuz ve giriş anahtarınız Gmail adresinize gönderilir.</p><StudentRegisterForm/></div>
        </div>
      </section>
    </PortalShell>;
  }

  const month=turkeyMonthWindow();
  const student = await db.student.findUnique({
    where:{id:user.student.id},
    include:{
      plans:{where:{active:true},orderBy:{updatedAt:'desc'}},
      dailyLogs:{orderBy:{date:'desc'},take:20},
      examResults:{orderBy:{createdAt:'desc'},take:20},
      studyTechniques:{where:{active:true},orderBy:{createdAt:'desc'}},
      techniquePreferences:{},
      reports:{where:{visibleToStudent:true},orderBy:{createdAt:'desc'}},
      libraryItems:{orderBy:{createdAt:'desc'}},
      testAccesses:{where:{status:'READY',OR:[{source:{not:'ACADEMY_CODE'}},{createdAt:{gte:month.start,lt:month.end}}]},orderBy:{createdAt:'asc'},take:1},
      targets:{where:{active:true},orderBy:{createdAt:'desc'},take:1},
      topicProgress:{},
      practiceLogs:{orderBy:{date:'desc'},take:30},
      generatedContent:{where:{visibleToStudent:true},orderBy:{createdAt:'desc'},take:30}
    }
  });
  if (!student) return null;

  const access = student.testAccesses[0];
  const activeTarget = student.targets[0];
  const grade=(student.gradeLevel||'').toLowerCase();
  const allowedExams=(grade.includes('8')||grade.includes('ortaokul'))?['LGS'] as const:['TYT','AYT'] as const;

  return <PortalShell signedIn
    active="ogrenci"
    eyebrow="ÖĞRENCİ PANELİ"
    title={'Merhaba, '+student.fullName}
    description="Bugünkü çalışmalarını başlat, hedefini kontrol et ve gelişimini tek ekrandan yönet."
    meta={<><span>Kod: {student.studentCode}</span>{student.gradeLevel&&<span>{student.gradeLevel}</span>}<span>{student.plans.length} aktif program</span></>}
    wide
  >
    <section className="section">
      <StudentCommandCenter/>
    </section>

    <section className="section">
      <div className="grid">
        <div className="card"><div className="kpi">{student.plans.length}</div><div className="muted">Aktif program</div></div>
        <div className="card"><div className="kpi">{student.studyTechniques.length}</div><div className="muted">Atanmış teknik</div></div>
        <div className="card"><div className="kpi">{student.examResults.length}</div><div className="muted">Deneme kaydı</div></div>
      </div>
    </section>

    <section id="gunluk-gorevler" className="section section-anchor"><PortalSectionTitle eyebrow="BUGÜN" title="Günlük Görevlerim" description="Koçunuzun verdiği görevleri en geç 23.00'a kadar soru sonuçlarıyla birlikte kaydedin."/><StudentDailyTasks/></section>
    <section className="section"><AdaptiveRecommendation/></section>
    <section id="akilli-koc" className="section section-anchor"><SmartCoachDashboard/></section>
    <section className="section"><PortalSectionTitle eyebrow="KOÇLUK & OYUNLAŞTIRMA" title="Aksiyonlar, seanslar, XP ve mikro tekrar"/><StudentEngagementHub/></section>

    <section className="section">
      <PortalSectionTitle eyebrow="UYGULA" title="Ders Çalışma Teknikleri" description="Tekniği seç, nasıl uygulanacağını gör ve aynı ekranda hemen çalışmaya başla."/>
      <StudyTechniqueLab initialPreferences={student.techniquePreferences}/>
    </section>

    <section className="section"><div className="grid" style={{gridTemplateColumns:'1fr 1fr'}}>
      <div className="card"><h2>Hedefim</h2><p>{student.goal || 'Koçunuz henüz hedef bilgisi eklemedi.'}</p>{activeTarget&&<div className="notice"><strong>{activeTarget.institutionName}</strong>{activeTarget.departmentName?' · '+activeTarget.departmentName:''}<br/><span className="muted">{activeTarget.source} · {activeTarget.dataYear||'Yıl belirtilmedi'} · Puan {activeTarget.score??'—'} · Sıra {activeTarget.ranking??'—'} · Yüzdelik {activeTarget.percentile??'—'}</span></div>}{student.profile&&<p className="muted">{pretty(student.profile)}</p>}</div>
      <div className="card"><h2>Çalışma Tekniklerim</h2>{student.studyTechniques.length===0?<p className="muted">Henüz teknik atanmadı.</p>:student.studyTechniques.map(t=><div key={t.id} style={{marginBottom:12}}><strong>{t.title}</strong><div className="muted">{t.description}</div></div>)}</div>
    </div></section>

    <section className="section"><PortalSectionTitle eyebrow="PLAN" title="Programlarım"/>{student.plans.length===0?<div className="card muted">Henüz aktif program bulunmuyor.</div>:<div className="stack">{student.plans.map(p=><div className="card" key={p.id}><strong>{p.title}</strong><p className="muted">{pretty(p.payload)}</p></div>)}</div>}</section>

    <section className="section"><div className="grid" style={{gridTemplateColumns:'1fr 1fr'}}>
      <div className="card"><h2>Çalışma Kayıtlarım</h2>{student.dailyLogs.length===0?<p className="muted">Henüz kayıt yok.</p>:student.dailyLogs.map(l=><div key={l.id} style={{marginBottom:12}}><strong>{new Date(l.date).toLocaleDateString('tr-TR')}</strong><div className="muted">{pretty(l.payload)}</div></div>)}</div>
      <div className="card"><h2>Denemelerim</h2>{student.examResults.length===0?<p className="muted">Henüz deneme kaydı yok.</p>:student.examResults.map(x=><div key={x.id} style={{marginBottom:12}}><strong>{x.examType}</strong><div className="muted">{pretty(x.payload)}</div></div>)}</div>
    </div></section>

    <section className="section"><div className="grid" style={{gridTemplateColumns:'2fr 1fr'}}>
      <div className="card"><h2>Koç Raporlarım</h2>{student.reports.length===0?<p className="muted">Henüz rapor yayınlanmadı.</p>:student.reports.map(r=><article key={r.id} style={{padding:'12px 0',borderBottom:'1px solid var(--line)'}}><strong>{r.title}</strong>{r.summary&&<p className="muted">{r.summary}</p>}<p>{r.content}</p></article>)}</div>
      <div className="card"><h2>Kütüphanem</h2>{student.libraryItems.length===0?<p className="muted">Henüz not veya dosya yok.</p>:student.libraryItems.map(i=><div key={i.id} style={{marginBottom:14}}><strong>{i.title}</strong>{i.note&&<div className="muted">{i.note}</div>}{i.fileName&&<a href={'/api/library/'+i.id}>Dosyayı Aç · {i.fileName}</a>}</div>)}</div>
    </div></section>

    <section className="section"><div className="row" style={{justifyContent:'space-between',alignItems:'center'}}><PortalSectionTitle eyebrow="İLERLEME" title="Konu ve Soru Takibi"/><a className="btn primary" href="/ogrenci/testler">Konu Bazlı Test Çöz</a></div><StudentProgressTools allowedExams={[...allowedExams]} initialProgress={student.topicProgress.map(x=>({examType:x.examType,subject:x.subject,topic:x.topic,completed:x.completed}))} initialPractice={student.practiceLogs.map(x=>({id:x.id,examType:x.examType,subject:x.subject,topic:x.topic,correct:x.correct,wrong:x.wrong,blank:x.blank,net:x.net,date:x.date.toISOString(),errorReason:x.errorReason}))}/></section>

    <section className="section"><PortalSectionTitle eyebrow="ÜRET" title="Akıllı İçerik Stüdyosu"/><ContentStudio studentId={student.id} existing={student.generatedContent.map(x=>({id:x.id,type:x.type,title:x.title,status:x.status,qualityScore:x.qualityScore,visibleToStudent:x.visibleToStudent,visibleToParent:x.visibleToParent}))}/></section>

    <section id="keks-egilim-taramasi" className="section section-anchor"><PortalSectionTitle eyebrow="TARAMA" title="KEKS Eğilim Taraması" description="Eğitsel çalışma ve öz-düzenleme eğilimlerini belirleyen KEKS tarama uygulamasını bu bölümden tamamlayın."/><StudentActions hasAccess={Boolean(access)}/></section>
    <section className="section"><PortalSectionTitle eyebrow="ÖN GÖRÜŞME" title="Çalışma Davranışı ve Planlama Formu" description="Kişilik/eğilim taramasını tamamladıktan sonra bu form açılır. Yanıtlarınız koçunuza ayrıntılı rapor olarak iletilir."/><StudentPreInterview/></section>
  </PortalShell>;
}
