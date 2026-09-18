import { notFound } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { StudentWorkspaceForms } from '@/app/components/StudentWorkspaceForms';

export default async function CoachStudentPage({params}:{params:Promise<{id:string}>}) {
  const user=await currentUser();
  if(!user || (user.role!=='COACH'&&user.role!=='ADMIN') || !user.coachProfile) return notFound();
  const {id}=await params;
  const student=await db.student.findFirst({
    where:{id,coachId:user.coachProfile.id},
    include:{
      plans:{orderBy:{createdAt:'desc'},take:10},
      dailyLogs:{orderBy:{date:'desc'},take:10},
      examResults:{orderBy:{createdAt:'desc'},take:10},
      studyTechniques:{orderBy:{createdAt:'desc'},take:10},
      reports:{orderBy:{createdAt:'desc'},take:10},
      libraryItems:{orderBy:{createdAt:'desc'},take:20},
      parentProfiles:{where:{active:true},select:{id:true,codeHint:true,createdAt:true}}
    }
  });
  if(!student) return notFound();

  return <main className="shell">
    <nav className="nav"><a className="brand" href="/">KEKS AKADEMİ</a><div className="navlinks"><a href="/koc">← Öğrencilerim</a></div></nav>
    <section className="section"><span className="pill">Koç Öğrenci Çalışma Alanı</span><h1>{student.fullName}</h1><p className="muted">Öğrenci kodu: {student.studentCode}{student.gradeLevel?' · '+student.gradeLevel:''}</p></section>
    <section className="grid">
      <div className="card"><div className="kpi">{student.plans.length}</div><div className="muted">Program</div></div>
      <div className="card"><div className="kpi">{student.examResults.length}</div><div className="muted">Deneme</div></div>
      <div className="card"><div className="kpi">{student.reports.length}</div><div className="muted">Rapor</div></div>
    </section>
    <section className="section"><StudentWorkspaceForms studentId={student.id}/></section>

    <section className="section"><h2>Mevcut Kayıtlar</h2>
      <div className="grid">
        <div className="card"><h3>Programlar</h3>{student.plans.map(p=><div key={p.id} style={{marginBottom:10}}><strong>{p.title}</strong><div className="muted">{JSON.stringify(p.payload)}</div></div>)}</div>
        <div className="card"><h3>Teknikler</h3>{student.studyTechniques.map(t=><div key={t.id} style={{marginBottom:10}}><strong>{t.title}</strong><div className="muted">{t.description}</div></div>)}</div>
        <div className="card"><h3>Denemeler</h3>{student.examResults.map(x=><div key={x.id} style={{marginBottom:10}}><strong>{x.examType}</strong><div className="muted">{JSON.stringify(x.payload)}</div></div>)}</div>
      </div>
    </section>

    <section className="section"><div className="grid" style={{gridTemplateColumns:'2fr 1fr'}}>
      <div className="card"><h2>Raporlar</h2>{student.reports.length===0?<p className="muted">Henüz rapor yok.</p>:student.reports.map(r=><article key={r.id} style={{padding:'12px 0',borderBottom:'1px solid var(--line)'}}><strong>{r.title}</strong><p className="muted">{r.summary}</p><p>{r.content}</p><a className="btn" href={'/koc/ogrenci/'+student.id+'/rapor/'+r.id}>Raporu Yazdır</a></article>)}</div>
      <div className="card"><h2>Kütüphane</h2>{student.libraryItems.length===0?<p className="muted">Henüz kayıt yok.</p>:student.libraryItems.map(i=><div key={i.id} style={{marginBottom:14}}><strong>{i.title}</strong>{i.note&&<div className="muted">{i.note}</div>}{i.fileName&&<a href={'/api/library/'+i.id}>Dosyayı Aç · {i.fileName}</a>}</div>)}</div>
    </div></section>
  </main>;
}
