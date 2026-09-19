import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { StudentLoginForm, StudentRegisterForm } from '@/app/components/AuthForms';
import { StudentActions } from '@/app/components/StudentActions';
import { StudentProgressTools } from '@/app/components/StudentProgressTools';
import { AdaptiveRecommendation } from '@/app/components/AdaptiveRecommendation';
import { SmartCoachDashboard } from '@/app/components/SmartCoachDashboard';
import { ContentStudio } from '@/app/components/ContentStudio';
import { StudyTechniqueLab } from '@/app/components/StudyTechniqueLab';

function pretty(v: unknown) {
  if (!v) return '';
  if (typeof v === 'string') return v;
  try { return JSON.stringify(v); } catch { return String(v); }
}

export default async function StudentPage() {
  const user = await currentUser();
  if (!user || user.role !== 'STUDENT' || !user.student) {
    return <main className="shell">
      <nav className="nav"><a className="brand" href="/">KEKS AKADEMİ</a></nav>
      <section className="grid" style={{gridTemplateColumns:'repeat(2,1fr)'}}>
        <div className="card"><h1>Öğrenci Girişi</h1><p className="muted">Öğrenci kodu ve özel giriş anahtarıyla giriş yapabilirsiniz.</p><StudentLoginForm/></div>
        <div className="card"><h2>Öğrenci Hesabı Oluştur</h2><p className="muted">Koçunuzun verdiği öğrenci kodu ve giriş anahtarını kullanarak kendi e-posta/şifrenizi oluşturun.</p><StudentRegisterForm/></div>
      </section>
    </main>;
  }

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
      testAccesses:{where:{status:'READY'},orderBy:{createdAt:'asc'},take:1},
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

  return <main className="shell">
    <nav className="nav"><a className="brand" href="/">KEKS AKADEMİ</a><div className="navlinks"><a href="/">Ana Sayfa</a></div></nav>
    <section className="section"><span className="pill">Öğrenci Paneli</span><h1>{student.fullName}</h1><p className="muted">Öğrenci kodu: {student.studentCode}{student.gradeLevel ? ' · ' + student.gradeLevel : ''}</p></section>

    <section className="grid">
      <div className="card"><div className="kpi">{student.plans.length}</div><div className="muted">Aktif program</div></div>
      <div className="card"><div className="kpi">{student.studyTechniques.length}</div><div className="muted">Çalışma tekniği</div></div>
      <div className="card"><div className="kpi">{student.examResults.length}</div><div className="muted">Deneme kaydı</div></div>
    </section>

    <section className="section"><StudyTechniqueLab initialPreferences={student.techniquePreferences}/></section>

    <section className="section"><div className="grid" style={{gridTemplateColumns:'1fr 1fr'}}>
      <div className="card"><h2>Hedefim</h2><p>{student.goal || 'Koçunuz henüz hedef bilgisi eklemedi.'}</p>{activeTarget&&<div className="notice"><strong>{activeTarget.institutionName}</strong>{activeTarget.departmentName?' · '+activeTarget.departmentName:''}<br/><span className="muted">{activeTarget.source} · {activeTarget.dataYear||'Yıl belirtilmedi'} · Puan {activeTarget.score??'—'} · Sıra {activeTarget.ranking??'—'} · Yüzdelik {activeTarget.percentile??'—'}</span></div>}{student.profile&&<p className="muted">{pretty(student.profile)}</p>}</div>
      <div className="card"><h2>Çalışma Tekniklerim</h2>{student.studyTechniques.length===0?<p className="muted">Henüz teknik atanmadı.</p>:student.studyTechniques.map(t=><div key={t.id} style={{marginBottom:12}}><strong>{t.title}</strong><div className="muted">{t.description}</div></div>)}</div>
    </div></section>

    <section className="section"><h2>Programlarım</h2>{student.plans.length===0?<div className="card muted">Henüz aktif program bulunmuyor.</div>:<div className="stack">{student.plans.map(p=><div className="card" key={p.id}><strong>{p.title}</strong><p className="muted">{pretty(p.payload)}</p></div>)}</div>}</section>

    <section className="section"><div className="grid" style={{gridTemplateColumns:'1fr 1fr'}}>
      <div className="card"><h2>Çalışma Kayıtlarım</h2>{student.dailyLogs.length===0?<p className="muted">Henüz kayıt yok.</p>:student.dailyLogs.map(l=><div key={l.id} style={{marginBottom:12}}><strong>{new Date(l.date).toLocaleDateString('tr-TR')}</strong><div className="muted">{pretty(l.payload)}</div></div>)}</div>
      <div className="card"><h2>Denemelerim</h2>{student.examResults.length===0?<p className="muted">Henüz deneme kaydı yok.</p>:student.examResults.map(x=><div key={x.id} style={{marginBottom:12}}><strong>{x.examType}</strong><div className="muted">{pretty(x.payload)}</div></div>)}</div>
    </div></section>

    <section className="section"><div className="grid" style={{gridTemplateColumns:'2fr 1fr'}}>
      <div className="card"><h2>Koç Raporlarım</h2>{student.reports.length===0?<p className="muted">Henüz rapor yayınlanmadı.</p>:student.reports.map(r=><article key={r.id} style={{padding:'12px 0',borderBottom:'1px solid var(--line)'}}><strong>{r.title}</strong>{r.summary&&<p className="muted">{r.summary}</p>}<p>{r.content}</p></article>)}</div>
      <div className="card"><h2>Kütüphanem</h2>{student.libraryItems.length===0?<p className="muted">Henüz not veya dosya yok.</p>:student.libraryItems.map(i=><div key={i.id} style={{marginBottom:14}}><strong>{i.title}</strong>{i.note&&<div className="muted">{i.note}</div>}{i.fileName&&<a href={'/api/library/'+i.id}>Dosyayı Aç · {i.fileName}</a>}</div>)}</div>
    </div></section>

    <section className="section"><AdaptiveRecommendation/></section>
    <section className="section"><SmartCoachDashboard/></section>

    <section className="section"><div className="row" style={{justifyContent:'space-between',alignItems:'center'}}><h2>Konu ve Soru Takibi</h2><a className="btn primary" href="/ogrenci/testler">Konu Bazlı Test Çöz</a></div><StudentProgressTools allowedExams={[...allowedExams]} initialProgress={student.topicProgress.map(x=>({examType:x.examType,subject:x.subject,topic:x.topic,completed:x.completed}))} initialPractice={student.practiceLogs.map(x=>({id:x.id,examType:x.examType,subject:x.subject,topic:x.topic,correct:x.correct,wrong:x.wrong,blank:x.blank,net:x.net,date:x.date.toISOString()}))}/></section>

    <section className="section"><ContentStudio studentId={student.id} existing={student.generatedContent.map(x=>({id:x.id,type:x.type,title:x.title,status:x.status,qualityScore:x.qualityScore,visibleToStudent:x.visibleToStudent,visibleToParent:x.visibleToParent}))}/></section>

    <section className="section"><h2>KEKS Eğilim Taraması</h2><StudentActions hasAccess={Boolean(access)}/></section>
  </main>;
}
