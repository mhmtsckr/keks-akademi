import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { ParentLoginForm } from '@/app/components/AuthForms';

function pretty(v: unknown) {
  if (!v) return '';
  if (typeof v === 'string') return v;
  try { return JSON.stringify(v); } catch { return String(v); }
}

export default async function ParentPage() {
  const user=await currentUser();
  if(!user || user.role!=='PARENT' || !user.parentProfile) {
    return <main className="shell"><nav className="nav"><a className="brand" href="/">KEKS AKADEMİ</a></nav><section className="section" style={{maxWidth:520}}><div className="card"><h1>Veli Girişi</h1><p className="muted">Koç tarafından verilen öğrenci kodu ve KEKS Akademi veli giriş kodu ile giriş yapın.</p><ParentLoginForm/></div></section></main>;
  }

  const student=await db.student.findUnique({
    where:{id:user.parentProfile.studentId},
    include:{
      plans:{where:{active:true},orderBy:{updatedAt:'desc'}},
      dailyLogs:{orderBy:{date:'desc'},take:14},
      examResults:{orderBy:{createdAt:'desc'},take:10},
      studyTechniques:{where:{active:true},orderBy:{createdAt:'desc'}},
      reports:{where:{visibleToParent:true},orderBy:{createdAt:'desc'}},
    }
  });
  if(!student) return <main className="shell"><div className="card">Öğrenci kaydı bulunamadı.</div></main>;

  return <main className="shell">
    <nav className="nav"><a className="brand" href="/">KEKS AKADEMİ</a><div className="navlinks"><a href="/">Ana Sayfa</a></div></nav>
    <section className="section"><span className="pill">Veli Paneli</span><h1>{student.fullName}</h1><p className="muted">Öğrenci kodu: {student.studentCode}{student.gradeLevel?' · '+student.gradeLevel:''}</p></section>
    <section className="grid">
      <div className="card"><div className="kpi">{student.plans.length}</div><div className="muted">Aktif program</div></div>
      <div className="card"><div className="kpi">{student.dailyLogs.length}</div><div className="muted">Son çalışma kaydı</div></div>
      <div className="card"><div className="kpi">{student.examResults.length}</div><div className="muted">Deneme kaydı</div></div>
    </section>
    <section className="section"><div className="grid" style={{gridTemplateColumns:'1fr 1fr'}}>
      <div className="card"><h2>Hedef ve Genel Durum</h2><p>{student.goal||'Henüz hedef bilgisi eklenmedi.'}</p>{student.profile&&<p className="muted">{pretty(student.profile)}</p>}</div>
      <div className="card"><h2>Uygulanan Teknikler</h2>{student.studyTechniques.length===0?<p className="muted">Henüz teknik yok.</p>:student.studyTechniques.map(t=><div key={t.id} style={{marginBottom:10}}><strong>{t.title}</strong><div className="muted">{t.description}</div></div>)}</div>
    </div></section>
    <section className="section"><div className="grid" style={{gridTemplateColumns:'1fr 1fr'}}>
      <div className="card"><h2>Programlar</h2>{student.plans.length===0?<p className="muted">Henüz program yok.</p>:student.plans.map(p=><div key={p.id} style={{marginBottom:12}}><strong>{p.title}</strong><div className="muted">{pretty(p.payload)}</div></div>)}</div>
      <div className="card"><h2>Denemeler</h2>{student.examResults.length===0?<p className="muted">Henüz deneme yok.</p>:student.examResults.map(x=><div key={x.id} style={{marginBottom:12}}><strong>{x.examType}</strong><div className="muted">{pretty(x.payload)}</div></div>)}</div>
    </div></section>
    <section className="section"><div className="card"><h2>Koç Raporları</h2>{student.reports.length===0?<p className="muted">Henüz veliye açık rapor yayınlanmadı.</p>:student.reports.map(r=><article key={r.id} style={{padding:'14px 0',borderBottom:'1px solid var(--line)'}}><strong>{r.title}</strong>{r.summary&&<p className="muted">{r.summary}</p>}<p>{r.content}</p></article>)}</div></section>
  </main>;
}
