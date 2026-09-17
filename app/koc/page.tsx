import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
export default async function CoachPage() {
  const user = await currentUser();
  if (!user || user.role !== 'COACH' || !user.coachProfile) return <main style={{padding:40}}><h1>Koç Paneli</h1><p>Her koç kendi e-posta ve şifresiyle hesap oluşturur. Yeni koç hesapları yönetici onayıyla aktifleşir.</p></main>;
  const students = await db.student.findMany({where:{coachId:user.coachProfile.id},select:{id:true,fullName:true,studentCode:true}});
  return <main style={{padding:40}}><h1>Koç Paneli</h1><p>{user.name}</p><h2>Öğrencilerim ({students.length})</h2>{students.map(s=><div key={s.id}>{s.studentCode} — {s.fullName}</div>)}<p>Koçlar KEKS soru havuzunu, ham test sonuçlarını, test fiyatını veya akademi kodlarını yönetemez.</p></main>;
}
