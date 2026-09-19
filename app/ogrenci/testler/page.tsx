import { currentUser } from '@/lib/auth';
import { QuizBuilder } from '@/app/components/QuizBuilder';

export default async function StudentTestsPage(){
 const user=await currentUser();
 if(!user || user.role!=='STUDENT' || !user.student) return <main className="shell"><div className="card">Bu alan için öğrenci girişi gerekir.</div></main>;
 const grade=(user.student.gradeLevel||'').toLowerCase();
 const allowed=(grade.includes('8')||grade.includes('ortaokul'))?['LGS'] as const:['TYT','AYT'] as const;
 return <main className="shell"><nav className="nav"><a className="brand" href="/">KEKS AKADEMİ</a><div className="navlinks"><a href="/ogrenci">← Öğrenci Paneli</a></div></nav><section className="section"><QuizBuilder allowedExams={[...allowed]}/></section></main>;
}
