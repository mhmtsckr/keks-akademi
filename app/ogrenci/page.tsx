import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { StudentLoginForm } from '@/app/components/AuthForms';
import { StudentActions } from '@/app/components/StudentActions';

export default async function StudentPage() {
  const user = await currentUser();
  if (!user || user.role !== 'STUDENT' || !user.student) {
    return <main className="shell"><nav className="nav"><a className="brand" href="/">KEKS AKADEMİ</a></nav><section className="section" style={{maxWidth:520}}><div className="card"><h1>Öğrenci Girişi</h1><p className="muted">Koçunuzun verdiği öğrenci kodu ve özel giriş anahtarıyla giriş yapın.</p><StudentLoginForm/></div></section></main>;
  }
  const [plans, logs, exams, access] = await Promise.all([
    db.studyPlan.findMany({where:{studentId:user.student.id,active:true},orderBy:{updatedAt:'desc'}}),
    db.dailyLog.findMany({where:{studentId:user.student.id},orderBy:{date:'desc'},take:7}),
    db.examResult.findMany({where:{studentId:user.student.id},orderBy:{createdAt:'desc'},take:5}),
    db.testAccess.findFirst({where:{studentId:user.student.id,status:'READY'},orderBy:{createdAt:'asc'}}),
  ]);
  return <main className="shell">
    <nav className="nav"><a className="brand" href="/">KEKS AKADEMİ</a><div className="navlinks"><a href="/">Ana Sayfa</a></div></nav>
    <section className="section"><span className="pill">Öğrenci Paneli</span><h1>{user.student.fullName}</h1><p className="muted">Öğrenci kodu: {user.student.studentCode}{user.student.gradeLevel ? ' · ' + user.student.gradeLevel : ''}</p></section>
    <section className="grid">
      <div className="card"><div className="kpi">{plans.length}</div><div className="muted">Aktif çalışma planı</div></div>
      <div className="card"><div className="kpi">{logs.length}</div><div className="muted">Son 7 günlük kayıt</div></div>
      <div className="card"><div className="kpi">{exams.length}</div><div className="muted">Son deneme kaydı</div></div>
    </section>
    <section className="section"><h2>Çalışma Planları</h2>{plans.length===0?<div className="card muted">Henüz aktif çalışma planı bulunmuyor.</div>:<div className="stack">{plans.map(p=><div className="card" key={p.id}><strong>{p.title}</strong><div className="muted">Mevcut plan kaydı korunmaktadır.</div></div>)}</div>}</section>
    <section className="section"><h2>KEKS Eğilim Taraması</h2><StudentActions hasAccess={Boolean(access)}/></section>
  </main>;
}