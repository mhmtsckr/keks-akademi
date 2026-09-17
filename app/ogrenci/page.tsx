import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
export default async function StudentPage() {
  const user = await currentUser();
  if (!user || user.role !== 'STUDENT' || !user.student) return <main style={{padding:40}}><h1>Öğrenci Girişi</h1><p>Öğrenci kodu + özel giriş anahtarı akışı mevcut sisteme bağlanmalıdır. Bu public repo gerçek öğrenci anahtarlarını içermez.</p></main>;
  const [plans, access] = await Promise.all([db.studyPlan.findMany({where:{studentId:user.student.id,active:true}}),db.testAccess.findFirst({where:{studentId:user.student.id,status:'READY'}})]);
  return <main style={{padding:40}}><h1>{user.student.fullName}</h1><p>Öğrenci kodu: {user.student.studentCode}</p><h2>Aktif Planlar</h2><p>{plans.length} plan kayıtlı. Eski planlar migrasyonda korunur.</p><h2>KEKS Eğilim Taraması</h2><p>{access ? 'Teste erişiminiz hazır.' : 'Erişim için KEKS Akademi kodu kullanın veya 350 TL ödeme yapın.'}</p></main>;
}
