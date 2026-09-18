import { notFound } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { PrintButton } from '@/app/components/PrintButton';

export default async function PrintReportPage({params}:{params:Promise<{id:string;reportId:string}>}) {
  const user=await currentUser();
  if(!user || (user.role!=='COACH'&&user.role!=='ADMIN') || !user.coachProfile) return notFound();
  const {id,reportId}=await params;
  const report=await db.studentReport.findFirst({where:{id:reportId,studentId:id},include:{student:true}});
  if(!report || report.student.coachId!==user.coachProfile.id) return notFound();
  return <main className="shell" style={{maxWidth:800}}>
    <div className="row" style={{justifyContent:'space-between'}}><a href={'/koc/ogrenci/'+id}>← Geri</a><PrintButton/></div>
    <article className="card" style={{marginTop:20}}>
      <div className="brand">KEKS AKADEMİ</div>
      <h1>{report.title}</h1>
      <p className="muted">Öğrenci: {report.student.fullName} · Kod: {report.student.studentCode}</p>
      {report.summary&&<h3>{report.summary}</h3>}
      <div style={{whiteSpace:'pre-wrap',lineHeight:1.7}}>{report.content}</div>
      <p className="muted" style={{marginTop:32}}>Oluşturulma: {new Date(report.createdAt).toLocaleDateString('tr-TR')}</p>
    </article>
  </main>;
}
