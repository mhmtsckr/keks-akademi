import { notFound } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { ContentViewer } from '@/app/components/ContentViewer';

export default async function GeneratedContentPage({params}:{params:Promise<{id:string}>}){
  const user=await currentUser();
  if(!user) return notFound();
  const {id}=await params;
  const item=await db.generatedContent.findUnique({where:{id},include:{student:true,upload:true}});
  if(!item) return notFound();

  let allowed=false;
  if(user.role==='ADMIN'||item.createdByUserId===user.id) allowed=true;
  if(user.role==='STUDENT'&&user.student?.id===item.studentId&&item.visibleToStudent) allowed=true;
  if(user.role==='PARENT'&&user.parentProfile?.studentId===item.studentId&&item.visibleToParent) allowed=true;
  if(user.role==='COACH'&&user.coachProfile?.id===item.student?.coachId) allowed=true;
  if(!allowed) return notFound();

  return <main className="shell">
    <nav className="nav"><a className="brand" href="/">KEKS AKADEMİ</a><div className="navlinks"><a href={user.role==='COACH'?'/koc':user.role==='PARENT'?'/veli':'/ogrenci'}>← Panele Dön</a></div></nav>
    <section className="section">
      <span className="pill">{item.type}</span>
      <h1>{item.title}</h1>
      <p className="muted">Kaynak: {item.upload.fileName} · Kalite skoru: {item.qualityScore??'—'} / 100</p>
      <ContentViewer type={item.type} payload={item.payload} contentId={item.id} canTrack={user.role==='STUDENT'&&user.student?.id===item.studentId}/>
    </section>
  </main>;
}
