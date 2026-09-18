import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { AccountLoginForm, CoachRegisterForm } from '@/app/components/AuthForms';
import { CoachActions } from '@/app/components/CoachActions';

export default async function CoachPage() {
  const user = await currentUser();
  if (!user || (user.role !== 'COACH' && user.role !== 'ADMIN') || !user.coachProfile) {
    return <main className="shell"><nav className="nav"><a className="brand" href="/">KEKS AKADEMİ</a></nav><section className="grid" style={{gridTemplateColumns:'repeat(2,1fr)'}}><div className="card"><h1>Koç Girişi</h1><p className="muted">Kendi koç hesabınızla giriş yapın.</p><AccountLoginForm/></div><div className="card"><h2>Yeni Koç Hesabı</h2><p className="muted">Yeni hesaplar yönetici onayından sonra aktifleşir.</p><CoachRegisterForm/></div></section></main>;
  }
  const students = await db.student.findMany({where:{coachId:user.coachProfile.id},select:{id:true,fullName:true,studentCode:true,gradeLevel:true,createdAt:true},orderBy:{createdAt:'desc'}});
  return <main className="shell">
    <nav className="nav"><a className="brand" href="/">KEKS AKADEMİ</a><div className="navlinks"><a href="/">Ana Sayfa</a>{user.role==='ADMIN'&&<a href="/yonetici">Yönetici</a>}</div></nav>
    <section className="section"><span className="pill">Koç Paneli</span><h1>{user.name}</h1><p className="muted">Yalnızca kendi öğrencilerinizi görür ve takip edersiniz.</p></section>
    <section className="grid" style={{gridTemplateColumns:'1fr 2fr'}}><CoachActions/><div className="card"><h2>Öğrencilerim ({students.length})</h2>{students.length===0?<p className="muted">Henüz öğrenci eklenmemiş.</p>:<table className="table"><thead><tr><th>Kod</th><th>Öğrenci</th><th>Grup</th></tr></thead><tbody>{students.map(s=><tr key={s.id}><td>{s.studentCode}</td><td>{s.fullName}</td><td>{s.gradeLevel||'—'}</td></tr>)}</tbody></table>}</div></section>
  </main>;
}