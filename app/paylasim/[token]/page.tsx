import crypto from 'node:crypto';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';

function tokenHash(token:string){return crypto.createHash('sha256').update(token).digest('hex')}

export default async function SharedProgressPage({params}:{params:Promise<{token:string}>}){
  const {token}=await params;
  const share=await db.progressShare.findUnique({where:{tokenHash:tokenHash(token)},include:{student:true}});
  if(!share||share.revokedAt||(share.expiresAt&&share.expiresAt<new Date()))return notFound();
  const scope:any=share.scope||{};
  const student=share.student;
  if(!student)return notFound();

  const [exams,actions,gamification,target]=await Promise.all([
    scope.exams?db.examResult.findMany({where:{studentId:student.id},orderBy:{createdAt:'desc'},take:8}):Promise.resolve([]),
    scope.actions?db.coachingAction.findMany({where:{studentId:student.id},orderBy:{createdAt:'desc'},take:12}):Promise.resolve([]),
    scope.gamification?db.studentGamification.findUnique({where:{studentId:student.id}}):Promise.resolve(null),
    scope.overview?db.studentTarget.findFirst({where:{studentId:student.id,active:true},orderBy:{createdAt:'desc'}}):Promise.resolve(null)
  ]);

  return <main className="portal"><div className="portalWrap portalContent">
    <section className="card">
      <div className="moduleEyebrow">KEKS AKADEMİ · PAYLAŞILAN GELİŞİM ÖZETİ</div>
      <h1>{student.fullName}</h1>
      <p className="muted">Alıcı: {share.recipientLabel} · Bu görünüm yalnız koç tarafından seçilen kapsamı içerir.</p>
    </section>
    {scope.overview&&<section className="card"><h2>Genel Durum</h2><p>Hedef: {student.goal||'Tanımlı değil'}</p>{target&&<p className="muted">{target.institutionName}{target.departmentName?' · '+target.departmentName:''}</p>}</section>}
    {scope.exams&&<section className="card"><h2>Son Denemeler</h2>{exams.map(x=><div key={x.id} style={{padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.08)'}}><strong>{x.examType}</strong><pre className="muted" style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(x.payload,null,2)}</pre></div>)}</section>}
    {scope.actions&&<section className="card"><h2>Koçluk Aksiyonları</h2>{actions.map(x=>{const pct=Math.min(100,Math.round((x.currentValue/x.targetValue)*100));return <div key={x.id} className="actionProgress"><div><strong>{x.title}</strong><span>{x.currentValue}/{x.targetValue}</span></div><div className="goldProgress"><i style={{width:pct+'%'}}/></div></div>})}</section>}
    {scope.gamification&&<section className="card"><h2>Oyunlaştırma</h2><div className="kpi">{gamification?.xp||0} XP</div><p>Seviye {gamification?.level||1}</p></section>}
  </div></main>;
}
