import {Prisma} from '@prisma/client';
import {z} from 'zod';
import {withApiErrors,HttpError,readJson} from '@/lib/apiGuard';
import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {requireRole} from '@/lib/auth';
import {buildWeeklyPlan} from '@/lib/smartCoach';
import {isFeatureEnabled} from '@/lib/systemConfig';
import {compareWeeklyPlans,planPreviewDigest} from '@/lib/smartPlanApproval';

const confirmSchema=z.object({
  action:z.literal('ACTIVATE'),
  confirm:z.literal(true),
  previewDigest:z.string().regex(/^[a-f0-9]{64}$/)
});

async function coachStudent(id:string){
  const user=await requireRole(['COACH','ADMIN']);
  if(!user.coachProfile)throw new HttpError(403,'Koç profili bulunamadı.');
  const student=await db.student.findFirst({
    where:{id,coachId:user.coachProfile.id},
    select:{id:true,studentCode:true}
  });
  if(!student)throw new HttpError(404,'Öğrenci bulunamadı.');
  if(!(await isFeatureEnabled('SMART_COACH',student.studentCode)))
    throw new HttpError(403,'Akıllı Koç bu öğrenci için etkin değil.');
  return {user,student};
}
async function activePlans(studentId:string){
  const rows=await db.studyPlan.findMany({
    where:{studentId,active:true},
    orderBy:[{createdAt:'desc'},{id:'desc'}],
    select:{id:true,title:true,createdAt:true,updatedAt:true,payload:true},
    take:21
  });
  if(rows.length>20)throw new HttpError(409,'Etkin plan sayısı beklenenden fazla. Koç yöneticisi kayıtları incelemeli.');
  return rows;
}
async function GET__handler(_req:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  await coachStudent(id);
  const [previous,proposed]=await Promise.all([activePlans(id),buildWeeklyPlan(id)]);
  const comparison=compareWeeklyPlans(previous[0]?.payload??null,proposed);
  return NextResponse.json({
    ok:true,previewOnly:true,
    currentPlan:previous[0]?{id:previous[0].id,title:previous[0].title,
      createdAt:previous[0].createdAt}:null,
    currentActiveCount:previous.length,
    proposal:proposed,
    comparison,
    previewDigest:planPreviewDigest(id,proposed,previous),
    notice:'Bu önizleme hiçbir öğrenci planını değiştirmez. Yeni plan yalnız koçun açık onayı ve güncel doğrulama sonrası etkinleşir.'
  },{headers:{'Cache-Control':'private, no-store'}});
}
async function POST__handler(req:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const {user}=await coachStudent(id);
  const input=await readJson(req,confirmSchema);
  const [previous,proposed]=await Promise.all([activePlans(id),buildWeeklyPlan(id)]);
  const digest=planPreviewDigest(id,proposed,previous);
  if(digest!==input.previewDigest)
    throw new HttpError(409,'Önizleme artık güncel değil. Planı yeniden önizleyip farkları inceleyerek tekrar onaylayın.');
  const comparison=compareWeeklyPlans(previous[0]?.payload??null,proposed);
  const now=new Date();
  try{
    const row=await db.$transaction(async tx=>{
      // Re-read within the serializable transaction to reject a competing coach approval.
      const current=await tx.studyPlan.findMany({
        where:{studentId:id,active:true},
        select:{id:true,updatedAt:true},take:21
      });
      if(current.length>20||planPreviewDigest(id,proposed,current)!==input.previewDigest)
        throw new HttpError(409,'Başka bir koç mevcut planı değiştirdi. Güncel karşılaştırmayı yeniden açın.');
      await tx.studyPlan.updateMany({where:{studentId:id,active:true},data:{active:false}});
      const created=await tx.studyPlan.create({data:{
        studentId:id,
        title:'Akıllı Haftalık Program · '+new Intl.DateTimeFormat('tr-TR',{
          timeZone:'Europe/Istanbul',day:'2-digit',month:'2-digit',year:'numeric'
        }).format(now),
        payload:proposed as Prisma.InputJsonValue,
        active:true
      }});
      await tx.auditLog.create({data:{
        actorUserId:user.id,action:'SMART_WEEKLY_PLAN_ACTIVATED',
        entityType:'StudyPlan',entityId:created.id,
        summary:'Koç yeni akıllı haftalık programı önizleme ve karşılaştırma sonrasında açık onayla etkinleştirdi.',
        metadata:{
          studentId:id,previousPlanIds:previous.map(x=>x.id),
          proposedPlanId:created.id,previewDigest:digest.slice(0,12),
          oldMinutes:comparison.previous?.minutes??null,
          newMinutes:comparison.proposed.minutes,
          deltaMinutes:comparison.deltaMinutes,
          approvedAt:now.toISOString()
        }
      }});
      return created;
    },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,maxWait:6000,timeout:15000});
    return NextResponse.json({
      ok:true,activated:true,planId:row.id,previousPlanIds:previous.map(x=>x.id),
      comparison,note:'Koç onayı kaydedildi. Önceki planlar geçmişte korundu; yeni etkin plan açıldı. Öğrencinin görev ve tekrar teslim kayıtları değiştirilmedi.'
    },{headers:{'Cache-Control':'private, no-store'}});
  }catch(error){
    if((error as {code?:string})?.code==='P2034')
      throw new HttpError(409,'Plan eş zamanlı güncellendi. Yeniden önizleme yaparak onaylayın.');
    throw error;
  }
}
export const GET=withApiErrors(GET__handler);
export const POST=withApiErrors(POST__handler);
